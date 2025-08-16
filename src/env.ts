import { z } from 'zod';

const envSchema = z.object({
	PORTAL_TOKEN: z.string({ error: "Invalid portal token" }).min(1, "Invalid portal token"),
	PORTAL_ASSET_ID: z.string({ error: "Invalid asset ID" }).regex(/^\d+$/, "Invalid asset ID"),
	PORTAL_ASSET_NAME: z.string({ error: "Invalid asset name" }).min(1, "Invalid asset name"),
	PORTAL_WAIT_UNTIL_PROCESSED: z.enum(["true", "false"]).default("false"),
	FILE_TO_UPLOAD: z.string("Invalid asset file path").min(1, "Invalid asset file path"),
	NODE_ENV: z.enum(["development", "testing", "production"], { error: "Invalid environment" }).default("development"),
	LOG_LEVEL: z.enum(["debug", "info", "warn", "error"], { error: "Invalid log level" }).default("info"),
	ZIP_ENABLED: z.string().optional().default("false"),
	ZIP_FILES: z.string().optional(),
	ZIP_OUTPUT_PATH: z.string().optional(),
	USER_WORKSPACE: z.string().optional(),
});

// Helper function to parse ZIP_FILES as either JSON array or comma-separated string
function parseZipFiles(zipFiles?: string): string[] {
	if (!zipFiles) return [];
	
	// Try to parse as JSON array first (from GitHub Actions multiline input)
	try {
		const parsed = JSON.parse(zipFiles);
		if (Array.isArray(parsed)) {
			return parsed.map(f => String(f).trim()).filter(f => f.length > 0);
		}
	} catch {
		// If JSON parsing fails, fall back to comma-separated parsing
	}
	
	// Fall back to comma-separated string
	return zipFiles.split(",").map(f => f.trim()).filter(f => f.length > 0);
}

const env = envSchema.parse(process.env);

export default env;
export { parseZipFiles };

