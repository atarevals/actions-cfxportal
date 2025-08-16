declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PORTAL_TOKEN: string;
			PORTAL_ASSET_ID: number;
			PORTAL_ASSET_NAME: string;

			FILE_TO_UPLOAD: string;
			LOG_LEVEL?: "debug" | "info" | "warn" | "error";
		}
	}
}

export { };

