import env from "../env";

export interface AppConfig {
	portal: {
		credentials: {
			token: string;
		};
		asset_id: number;
		asset_name: string;
	};
	puppeteer: {
		headless: boolean;
		timeout: number;
	};
	upload: {
		filePath: string;
		maxFileSize: number;
		allowedExtensions: string[];
	};
}

export const config: AppConfig = {
	portal: {
		credentials: {
			token: env.PORTAL_TOKEN,
		},
		asset_id: Number(env.PORTAL_ASSET_ID),
		asset_name: env.PORTAL_ASSET_NAME,
	},
	puppeteer: {
		headless: env.NODE_ENV === "production",
		timeout: 10_000,
	},
	upload: {
		filePath: env.FILE_TO_UPLOAD,
		maxFileSize: 1 * 1024 * 1024 * 1024, // 1gb
		allowedExtensions: [".zip"],
	},
};
