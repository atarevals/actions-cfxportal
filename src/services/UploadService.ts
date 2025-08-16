import { sleep } from "bun";
import { config } from "../utils/config.js";
import logger from "../utils/logger.js";
import type { BrowserService } from "./BrowserService.js";

export class UploadService {
	private browserService: BrowserService;

	constructor(browserService: BrowserService) {
		this.browserService = browserService;
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

		const tableIdColumns = await page.$$("tr");
		for (const column of tableIdColumns) {
			const secondColumn = await column.$("td:nth-child(2)");
			if (!secondColumn) continue;

			const assetId = await secondColumn.evaluate((el) => el.textContent);
			if (Number(assetId) !== config.portal.asset_id) continue;

			logger.info(`Found asset ${config.portal.asset_id} in table`);
			await column.click();
		}

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
		await input.uploadFile(config.upload.filePath);
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
}
