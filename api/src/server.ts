import { createApp } from "./app";
import { config } from "./core/config";
import { logger } from "./core/logger";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Octave Chime API listening on http://localhost:${config.port}`);
  logger.info(`Termii mode: ${config.termii.mode}`);
});
