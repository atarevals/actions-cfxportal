import { sleep } from "bun";
import { config } from "../utils/config.js";
import logger from "../utils/logger.js";
import type { BrowserService } from "./BrowserService.js";

export class UploadService {
	private browserService: BrowserService;
	private filePath: string;

	constructor(browserService: BrowserService, filePath?: string) {
		this.browserService = browserService;
		this.filePath = filePath || config.upload.filePath;
	}

	async getRow() {
		const page = this.browserService.getPage();
		if (!page) throw new Error("Page not initialized");

		const tableRows = await page.$$("tr");
		for (const row of tableRows) {
			const secondColumn = await row.$("td:nth-child(2)");
			if (!secondColumn) continue;

			const assetId = await secondColumn.evaluate((el) => el.textContent);
			if (Number(assetId) !== config.portal.asset_id) continue;

			return row;
		}
		return null;
	}

	/**
	 * Open the upload modal
	 */
	async initUpload() {
		const bService = this.browserService;
		const page = bService.getPage();
		if (!page) throw new Error("Page not initialized");

		await bService.navigateTo(
			`https://portal.cfx.re/assets/created-assets?page=1&sort=asset.id&search=${config.portal.asset_name}`,
		);

		await page?.waitForNetworkIdle({ idleTime: 2000 });

		logger.info(
			`Attempting to find asset ${config.portal.asset_id} in table...`,
		);

		const row = await this.getRow();
		if (!row)
			throw new Error(`Asset ${config.portal.asset_id} not found in table`);

		logger.info(`Found asset ${config.portal.asset_id} in table`);
		await row.click();

		await sleep(2000);

		logger.debug("Attempting to find upload button...");
		const allButtons = await page.$$("button");
		let uploadButton = null;
		for (const button of allButtons) {
			const buttonText = await button.evaluate((el) => el.textContent?.trim());
			if (!buttonText.toLowerCase().includes("upload")) continue;

			uploadButton = button;
			break;
		}

		if (!uploadButton) throw new Error("Upload button not found");

		logger.debug("Upload button found, clicking...");
		await uploadButton.click();
	}

	/**
	 * Upload a file
	 */
	async uploadFile() {
		const page = this.browserService.getPage();
		if (!page) throw new Error("Page not initialized");

		logger.debug("Waiting for upload dialog to appear...");

		await page.waitForSelector("#overlay-outlet div[role='dialog']");
		await page.waitForSelector('[class*="cfxui__InputDropzone__dropzone"]');

		const input = await page.$('input[type="file"]');
		if (!input) throw new Error("File input not found");

		logger.debug("File input found, uploading file...");
		await input.uploadFile(this.filePath);
	}

	async submitUpload() {
		const page = this.browserService.getPage();
		if (!page) throw new Error("Page not initialized");

		logger.debug("Attempting to find confirm button...");

		let confirmButton = null;
		const allButtons2 = await page.$$("button");
		for (const button of allButtons2) {
			const buttonText = await button.evaluate((el) => el.textContent?.trim());
			if (!buttonText.toLowerCase().includes("upload file")) continue;

			confirmButton = button;
			break;
		}

		if (!confirmButton) throw new Error("Confirm button not found");

		logger.debug("Confirm button found, clicking...");
		await confirmButton.click();

		logger.debug("Waiting for upload to complete...");

		// report upload progress while modal is open
		let lastProgress = null;
		while (true) {
			const progressBar = await page.$("[class*='ProgressBar_progressInner']");
			if (!progressBar) break;

			const progress = await progressBar.evaluate(
				(el) => (el as HTMLDivElement).style.width,
			);
			if (lastProgress === progress) continue;

			logger.info(`Upload progress: ${progress}`);

			lastProgress = progress;
		}

		logger.info("Upload completed successfully");
	}

	async getAssetInfo() {
		const page = this.browserService.getPage();
		if (!page) throw new Error("Page not initialized");

		const row = await this.getRow();
		if (!row)
			throw new Error(`Asset ${config.portal.asset_id} not found in table`);

		const tableRow = await row.evaluate((el) => ({
			id: el.querySelector("td:nth-child(2)")?.textContent?.trim(),
			name: el.querySelector("td:nth-child(3)")?.textContent?.trim(),
			lastUpdated: el.querySelector("td:nth-child(4)")?.textContent?.trim(),
			status: el.querySelector("td:nth-child(5)")?.textContent?.trim(),
		}));

		return tableRow;
	}

	async waitUntilProcessed() {
		logger.info("We will wait until the asset is processed...");

		while ((await this.getAssetInfo()).status === "processing...") {
			logger.info("Asset is still processing, waiting...");
			await sleep(3000);
		}

		const info = await this.getAssetInfo();
		if (info.status === "failed") {
			throw new Error(
				`There was an error with the uploaded asset: ${JSON.stringify(info)}`,
			);
		}
		logger.info(`Asset processed successfully: ${JSON.stringify(info)}`);
	}
}
