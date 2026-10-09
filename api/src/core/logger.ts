type Meta = Record<string, unknown> | undefined;

const stamp = () => new Date().toISOString();

const write = (level: "INFO" | "WARN" | "ERROR" | "DEBUG", msg: string, meta?: Meta) => {
  const line = `[${stamp()}] ${level} ${msg}`;
  if (level === "ERROR") console.error(line, meta ?? "");
  else if (level === "WARN") console.warn(line, meta ?? "");
  else console.log(line, meta ?? "");
};

export const logger = {
  info: (msg: string, meta?: Meta) => write("INFO", msg, meta),
  warn: (msg: string, meta?: Meta) => write("WARN", msg, meta),
  error: (msg: string, meta?: Meta) => write("ERROR", msg, meta),
  debug: (msg: string, meta?: Meta) => {
    if (process.env.LOG_LEVEL === "debug") write("DEBUG", msg, meta);
  },
};
