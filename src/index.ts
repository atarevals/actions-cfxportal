import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import env from "./env.js";
import { BrowserService } from "./services/BrowserService";
import { UploadService } from "./services/UploadService";
import { ZipService } from "./services/ZipService";
import { config } from "./utils/config";
import logger from "./utils/logger";

const listFilesDirectory = (dir: string): string[] => {
	const files: string[] = [];
	const items = readdirSync(dir);

	for (const item of items) {
		const fullPath = path.join(dir, item);
		if (statSync(fullPath).isDirectory()) {
			// ignore node_modules
			if (item === "node_modules") continue;
			files.push(...listFilesDirectory(fullPath));
		} else {
			files.push(fullPath);
		}
	}

	return files;
};

async function run(): Promise<void> {
	try {
		logger.info("Starting CFX Portal upload process...");

		logger.debug(`Current folder: ${process.cwd()}`);

		let fileToUpload = config.upload.filePath;
		const workspace = env.USER_WORKSPACE ?? process.cwd();

		logger.debug("Given context:");
		logger.debug(`* User Workspace: ${env.USER_WORKSPACE ?? "Not Set"}`);
		logger.debug(`* CWD: ${process.cwd()}`);
		logger.debug(`Files:`);
		logger.debug(`* Workspace: ${listFilesDirectory(workspace).join(", ")}`);
		logger.debug(`* CWD: ${listFilesDirectory(process.cwd()).join(", ")}`);

		// Create zip if enabled
		if (config.zip.enabled) {
			logger.info("Zip creation is enabled, creating zip file...");

			const zipService = new ZipService(config.zip, workspace);
			zipService.validateConfig();

			const filesToInclude = zipService.getFilesToInclude();
			logger.info(`Files to be included in zip: ${filesToInclude.join(", ")}`);

			const zipPath = await zipService.createZip();
			fileToUpload = zipPath;
			logger.info(`Zip file created successfully: ${zipPath}`);
		} else {
			logger.info("Zip creation is disabled, using original file path");

			const initialPath = config.upload.filePath;
			const filePath = path.resolve(workspace, initialPath);

			if (!existsSync(filePath)) {
				logger.error(`File not found: ${filePath}`);
				process.exit(1);
			}

			fileToUpload = filePath;
			logger.info(`File to upload: ${fileToUpload}`);
		}

		const browserService = new BrowserService();
		await browserService.init();
		await browserService.login();

		const uploadService = new UploadService(browserService, fileToUpload);
		await uploadService.initUpload();
		await uploadService.uploadFile();
		await uploadService.submitUpload();

		if (config.portal.waitUntilProcessed) {
			await uploadService.waitUntilProcessed();
		}

		await browserService.closeBrowser();
		logger.info("Everything completed successfully!");
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(`Error: ${errorMessage}`);
		process.exit(1);
	}
}

run();
