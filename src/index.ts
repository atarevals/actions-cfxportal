import { BrowserService } from "./services/BrowserService.js";
import { UploadService } from "./services/UploadService.js";

async function run(): Promise<void> {
	try {
		console.log("Starting CFX Portal upload process...");

		const browserService = new BrowserService();
		await browserService.init();
		await browserService.login();

		const uploadService = new UploadService(browserService);
		await uploadService.initUpload();
		await uploadService.uploadFile();
		await uploadService.submitUpload();

		await browserService.closeBrowser();

		console.log("Upload completed successfully!");
	} catch (error) {
		console.error(
			"Error:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}

run();
