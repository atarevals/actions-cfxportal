import { z } from 'zod';

const envSchema = z.object({
	PORTAL_TOKEN: z.string({ error: "Invalid portal token" }).min(1, "Invalid portal token"),
	PORTAL_ASSET_ID: z.string({ error: "Invalid asset ID" }).regex(/^\d+$/, "Invalid asset ID"),
	PORTAL_ASSET_NAME: z.string({ error: "Invalid asset name" }).min(1, "Invalid asset name"),
	FILE_TO_UPLOAD: z.string("Invalid asset file path").min(1, "Invalid asset file path"),
	NODE_ENV: z.enum(["development", "testing", "production"], { error: "Invalid environment" }).default("development"),
	LOG_LEVEL: z.enum(["debug", "info", "warn", "error"], { error: "Invalid log level" }).default("info"),
});

const env = envSchema.parse(process.env);

export default env;