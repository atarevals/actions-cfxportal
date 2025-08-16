import puppeteer, { type Browser, type Page } from "puppeteer";
import { config } from "../utils/config.js";
import logger from "../utils/logger.js";

export class BrowserService {
	private browser: Browser | null = null;
	private page: Page | null = null;

	private loginAttempt: number = 0;

	/**
	 * Start browser
	 */
	async init(): Promise<void> {
		try {
			logger.info("Starting browser instance...");

			// Configurações específicas para ambientes CI/CD Linux
			const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
				headless: config.puppeteer.headless,
				defaultViewport: {
					width: 1920,
					height: 1080,
				},
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--no-first-run',
					'--no-zygote',
					// '--single-process',
					'--disable-gpu',
					'--disable-background-timer-throttling',
					'--disable-backgrounding-occluded-windows',
					'--disable-renderer-backgrounding',
				],
			};

			// Em ambientes CI ou quando não há display disponível
			if (process.env.CI || process.env.NODE_ENV === 'production') {
				launchOptions.args?.push('--disable-web-security');
				launchOptions.args?.push('--disable-features=VizDisplayCompositor');
			}

			this.browser = await puppeteer.launch(launchOptions);
			this.page = await this.browser.newPage();

			// Configurar timeout padrão
			this.page.setDefaultTimeout(config.puppeteer.timeout);

			logger.info("Browser started successfully");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			
			// Verificar se é um erro de dependências do Chrome
			if (errorMessage.includes('libnspr4.so') || 
				errorMessage.includes('shared libraries') ||
				errorMessage.includes('chrome-linux64/chrome')) {
				logger.error('Chrome dependencies missing. In Linux environments, make sure required system packages are installed.');
				logger.error('Try installing: sudo apt-get update && sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils');
			}
			
			logger.error(`Error starting browser: ${errorMessage}`);
			throw new Error(`Failed to initialize browser: ${errorMessage}`);
		}
	}

	/**
	 * Navigate to a specific URL
	 */
	async navigateTo(url: string): Promise<void> {
		if (!this.page) return;

		try {
			logger.debug(`Navigating to: ${url}`);
			await this.page.goto(url, {
				waitUntil: "networkidle2",
				timeout: config.puppeteer.timeout,
			});
			logger.debug(`Waiting for network idle...`);
			await this.page.waitForNetworkIdle();
			logger.debug(`Navigation to ${url} completed successfully`);
		} catch (error) {
			logger.error(`Error navigating to ${url}: ${error}`);
			throw new Error(`Failed to navigate to ${url}: ${error}`);
		}
	}

	/**
	 * Attempt to login
	 */
	async login(): Promise<void> {
		const browser = this.browser;
		if (!browser) return;

		const page = this.page;
		if (!page) return;

		try {
			logger.info("Attempting to login...");

			await browser.setCookie({
				name: "_t",
				path: "/",
				domain: "forum.cfx.re",
				value: config.portal.credentials.token,
			});
			logger.debug("Cookie set for authentication");
			await this.navigateTo("https://portal.cfx.re/login");
			logger.debug("Clicking the login button");

			await Promise.all([
				page.waitForNavigation(), // The promise resolves after navigation has finished
				page
					.locator("button")
					.click(), // Clicking the link will indirectly cause a navigation
			]);

			await page.waitForNetworkIdle({
				idleTime: 2000,
			});

			logger.info("Successfully logged in");
		} catch {
			this.loginAttempt++;
			if (this.loginAttempt > 3) {
				logger.error("Max login attempts reached");
				return;
			}

			logger.warn("We got an error during the login process. We'll try again");
			await this.login();
		}
	}

	/**
	 * Get current page
	 */
	getPage(): Page | null {
		return this.page;
	}

	/**
	 * Get current browser
	 */
	getBrowser(): Browser | null {
		return this.browser;
	}

	/**
	 * Closes the browser
	 */
	async closeBrowser(): Promise<void> {
		if (!this.browser) return;

		logger.info("Closing browser...");
		await this.browser.close();
		this.browser = null;
		this.page = null;
		logger.info("Browser closed");
	}
}
