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
			token: process.env.PORTAL_TOKEN,
		},
		asset_id: Number(process.env.PORTAL_ASSET_ID),
		asset_name: process.env.PORTAL_ASSET_NAME,
	},
	puppeteer: {
		headless: process.env.NODE_ENV === 'production',
		timeout: 10_000,
	},
	upload: {
		filePath: process.env.FILE_TO_UPLOAD,
		maxFileSize: 1 * 1024 * 1024 * 1024, // 1gb
		allowedExtensions: ['.zip'],
	},
};