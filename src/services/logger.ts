import { addOfflineLog } from "./db";

export async function logError(type: string, error: any, context?: any) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  const stack = error instanceof Error ? error.stack : undefined;
  
  await addOfflineLog({
    level: "error",
    message: `[${type.toUpperCase()}] ${message}`,
    context: {
      ...context,
      stack,
      rawError: error
    }
  });
  
  console.error(`[Logger:${type}]`, message, error, context);
}

export async function logInfo(type: string, message: string, context?: any) {
  await addOfflineLog({
    level: "info",
    message: `[${type.toUpperCase()}] ${message}`,
    context
  });
  console.log(`[Logger:${type}]`, message, context);
}

export async function logWarn(type: string, message: string, context?: any) {
  await addOfflineLog({
    level: "warn",
    message: `[${type.toUpperCase()}] ${message}`,
    context
  });
  console.warn(`[Logger:${type}]`, message, context);
}
