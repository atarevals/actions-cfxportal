import env from "../env";
import { parseYamlArray } from "./yaml-parser.js";

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
	zip: {
		enabled: boolean;
		files: string[];
		outputPath: string;
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
	zip: {
		enabled: env.ZIP_ENABLED === "true",
		files: parseYamlArray(env.ZIP_FILES),
		outputPath: env.ZIP_OUTPUT_PATH || "./dist/output.zip",
	},
};
