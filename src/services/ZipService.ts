import archiver from "archiver";
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import * as path from "node:path";
import logger from "../utils/logger.js";

export interface ZipConfig {
  enabled: boolean;
  files: string[];
  outputPath: string;
}

export class ZipService {
  private config: ZipConfig;
  private baseWorkspace: string;

  constructor(config: ZipConfig, baseWorkspace: string) {
    this.config = config;
    this.baseWorkspace = baseWorkspace;
    logger.debug(`Base workspace: ${this.baseWorkspace}`);
  }

  validateConfig(): void {
    logger.debug(
      `Validating zip configuration: ${JSON.stringify(this.config)}`
    );

    if (!this.config.enabled) {
      throw new Error("Zip is not enabled");
    }

    if (!this.config.files || this.config.files.length === 0) {
      throw new Error("No files specified for zip creation");
    }

    if (!this.config.outputPath) {
      throw new Error("No output path specified for zip creation");
    }

    logger.debug(`Base workspace directory: ${this.baseWorkspace}`);
    logger.debug(`Files to validate: ${this.config.files.join(", ")}`);

    // Check if at least one file/folder exists
    let foundFiles = false;
    const checkedPaths: {
      requested: string;
      fullPath: string;
      exists: boolean;
    }[] = [];

    for (const file of this.config.files) {
      const fullPath = path.resolve(this.baseWorkspace, file);
      const exists = existsSync(fullPath);

      checkedPaths.push({ requested: file, fullPath, exists });
      logger.debug(`Checking: "${file}" -> "${fullPath}" (exists: ${exists})`);

      if (exists) {
        logger.debug(`✓ File/folder exists: ${file}`);
        foundFiles = true;
      }
    }

    if (!foundFiles) {
      logger.error("File validation failed. Details:");
      logger.error(`  Base workspace: ${this.baseWorkspace}`);
      for (const pathInfo of checkedPaths) {
        logger.error(
          `  ✗ "${pathInfo.requested}" -> "${pathInfo.fullPath}" (not found)`
        );
      }
      throw new Error(
        `None of the specified files or folders exist. ` +
          `Base directory: ${this.baseWorkspace}. ` +
          `Checked paths: ${this.config.files.join(", ")}`
      );
    }

    logger.debug("Zip configuration is valid");
  }

  getFilesToInclude(): string[] {
    logger.debug(
      `Resolving files to include in zip: ${this.config.files.join(", ")}`
    );

    const filesToInclude: string[] = [];
    for (const file of this.config.files) {
      const fullPath = path.resolve(this.baseWorkspace, file);
      logger.debug(`Resolving file: ${file} (${fullPath})`);

      if (existsSync(fullPath)) {
        logger.debug(`File/folder exists: ${file}`);
        filesToInclude.push(file);
      }
    }

    logger.debug(`Files to include in zip: ${filesToInclude.join(", ")}`);

    return filesToInclude;
  }

  async createZip(): Promise<string> {
    const outputPath = path.resolve(this.baseWorkspace, this.config.outputPath);
    mkdirSync(path.dirname(outputPath), { recursive: true });

    logger.debug(`Creating zip file at: ${outputPath}`);

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });

      output.on("close", () => {
        logger.debug(
          `Zip file created successfully. Total size: ${archive.pointer()} bytes`
        );
        resolve(outputPath);
      });

      archive.on("error", (err) => {
        logger.error(`Archive error: ${err.message}`);
        reject(err);
      });

      archive.pipe(output);

      // Add files/folders to archive
      for (const file of this.config.files) {
        const fullPath = path.resolve(this.baseWorkspace, file);

        if (existsSync(fullPath)) {
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            logger.debug(`Adding directory: ${file}`);
            // Add directory maintaining only its basename structure
            const dirName = path.basename(fullPath);
            archive.directory(fullPath, dirName);
          } else {
            logger.debug(`Adding file to root: ${file}`);
            // Add file to the root of the zip using only the filename
            const fileName = path.basename(fullPath);
            archive.file(fullPath, { name: fileName });
          }
        }
      }

      archive.finalize();
    });
  }
}
