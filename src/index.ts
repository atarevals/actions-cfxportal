import { BrowserService } from "./services/BrowserService.js";
import { UploadService } from "./services/UploadService.js";
import { ZipService } from "./services/ZipService.js";
import { config } from "./utils/config.js";
import logger from "./utils/logger.js";

async function run(): Promise<void> {
	try {
		logger.info("Starting CFX Portal upload process...");

		let fileToUpload = config.upload.filePath;

		// Create zip if enabled
		if (config.zip.enabled) {
			logger.info("Zip creation is enabled, creating zip file...");
			
			const zipService = new ZipService(config.zip);
			zipService.validateConfig();
			
			const filesToInclude = zipService.getFilesToInclude();
			logger.info(`Files to be included in zip: ${filesToInclude.join(", ")}`);
			
			const zipPath = await zipService.createZip();
			fileToUpload = zipPath;
			logger.info(`Zip file created successfully: ${zipPath}`);
		} else {
			logger.info("Zip creation is disabled, using original file path");
		}

		const browserService = new BrowserService();
		await browserService.init();
		await browserService.login();

		const uploadService = new UploadService(browserService, fileToUpload);
		await uploadService.initUpload();
		await uploadService.uploadFile();
		await uploadService.submitUpload();

		await browserService.closeBrowser();

		logger.info("Upload completed successfully!");
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(`Error: ${errorMessage}`);
		process.exit(1);
	}
}

run();
