// brazenly stolen from https://github.com/QuantGeekDev/mcp-framework/blob/main/src/core/Logger.ts
// so that we don't have to import the whole mcp-framework just for logging
import { createWriteStream, WriteStream } from "fs";
import { join } from "path";
import { mkdir } from "fs/promises";
import { config } from "../config/env.js";

export class Logger {
  private static instance: Logger;
  private logStream: WriteStream | null = null;
  private logFilePath: string = '';
  private logToFile: boolean = false;

  private constructor() {
    this.logToFile = config.logging.enableFileLogging;

    if (this.logToFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logDir = config.logging.logDirectory;

      this.initFileLogging(logDir, timestamp);
    }

    process.on("exit", () => this.close());
    process.on("SIGINT", () => this.close());
    process.on("SIGTERM", () => this.close());
  }

  private async initFileLogging(logDir: string, timestamp: string): Promise<void> {
    try {
      await mkdir(logDir, { recursive: true });
      this.logFilePath = join(logDir, `mcp-server-${timestamp}.log`);
      this.logStream = createWriteStream(this.logFilePath, { flags: "a" });
      this.info(`File logging enabled, writing to: ${this.logFilePath}`);
    } catch (err) {
      process.stderr.write(`Failed to initialize file logging: ${err}\n`);
      this.logToFile = false;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string): string {
    return `[${this.getTimestamp()}] [${level}] ${message}\n`;
  }

  public info(message: string): void {
    const formattedMessage = this.formatMessage("INFO", message);
    if (this.logToFile && this.logStream) {
      this.logStream.write(formattedMessage);
    }
    process.stderr.write(formattedMessage);
  }

  public log(message: string): void {
    this.info(message);
  }

  public error(message: string): void {
    const formattedMessage = this.formatMessage("ERROR", message);
    if (this.logToFile && this.logStream) {
      this.logStream.write(formattedMessage);
    }
    process.stderr.write(formattedMessage);
  }

  public warn(message: string): void {
    const formattedMessage = this.formatMessage("WARN", message);
    if (this.logToFile && this.logStream) {
      this.logStream.write(formattedMessage);
    }
    process.stderr.write(formattedMessage);
  }

  public debug(message: string): void {
    const formattedMessage = this.formatMessage("DEBUG", message);
    if (this.logToFile && this.logStream) {
      this.logStream.write(formattedMessage);
    }
    if (config.logging.debugConsole) {
      process.stderr.write(formattedMessage);
    }
  }

  public close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  public getLogPath(): string {
    return this.logFilePath;
  }

  public isFileLoggingEnabled(): boolean {
    return this.logToFile;
  }
}

export const logger = Logger.getInstance();
