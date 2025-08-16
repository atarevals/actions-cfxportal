import { BrowserService } from "./services/BrowserService";
import { UploadService } from "./services/UploadService";

(async () => {
	const browserService = new BrowserService();
	await browserService.init();
	await browserService.login();

	const uploadService = new UploadService(browserService);
	await uploadService.initUpload();
	await uploadService.uploadFile();
	await uploadService.submitUpload();

	if (process.env.NODE_ENV === "production") {
		await browserService.closeBrowser();
	}
})();