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

			this.browser = await puppeteer.launch({
				headless: config.puppeteer.headless,
				defaultViewport: {
					width: 1920,
					height: 1080,
				},
			});
			this.page = await this.browser.newPage();

			// Configurar timeout padrão
			this.page.setDefaultTimeout(config.puppeteer.timeout);

			logger.info("Browser started successfully");
		} catch (error) {
			logger.error(`Error starting browser: ${error}`);
			throw new Error(`Failed to initialize browser: ${error}`);
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
