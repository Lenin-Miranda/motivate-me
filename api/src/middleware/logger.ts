import winston from "winston";

function colorStatus(status?: number): string {
  if (!status) return "";
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // rojo
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // amarillo
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // cyan
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`; // verde
  return `${status}`;
}

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize({ all: false }),
    winston.format.printf(({ timestamp, level, message, status }) => {
      const prettyStatus = colorStatus(
        typeof status === "number" ? status : undefined,
      );

      return `[${timestamp}] ${level.toUpperCase()} ${prettyStatus} ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});
