import winston from "winston";

import { createMemoryDataLayer } from "./data-layer/data-layer";
import { createMongoDbDataLayer } from "./data-layer/mongodb/data-layer";
import { createMemoryStateLayer } from "./web/dependencies";
import { createWebServer } from "./web/web-server";

import { ready, server } from "@serenity-kit/opaque";

export interface EnvVariables {
  DOMAIN?: string;
  PORT?: string;
  BASE_URL?: string;
  OPENID_CLIENT_ID?: string;
  MONGODB_URL?: string;
  MONGODB_USERNAME?: string;
  MONGODB_PASSWORD?: string;
  FRONTEND_ORIGIN?: string;
  OPENID_ISSUER?: string;
  OPENID_ISSUER_FETCH_KEYS?: string;
  SERVER_SETUP?: string;
}

async function main() {
  const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
  });

  logger.info("Starting app");
  const env = process.env as unknown as EnvVariables;

  const {
    PORT = "8000",
    DOMAIN = `localhost:${PORT}`,
    BASE_URL = `http://${DOMAIN}`,
    OPENID_CLIENT_ID = "e2esamplefrontend",
    OPENID_ISSUER = "http://localhost:8080/realms/master",
    OPENID_ISSUER_FETCH_KEYS = OPENID_ISSUER,
    MONGODB_PASSWORD = "password",
    MONGODB_URL, // = "mongodb://localhost:27017/mydb",
    MONGODB_USERNAME = "username",
    FRONTEND_ORIGIN = "http://localhost:3000",
    SERVER_SETUP,
  } = env;

  await ready;

  const dataLayer = !MONGODB_URL
    ? createMemoryDataLayer()
    : await createMongoDbDataLayer({
        password: MONGODB_PASSWORD,
        url: MONGODB_URL,
        username: MONGODB_USERNAME,
      });

  dataLayer.documentsDb;
  const setup =
    env.SERVER_SETUP ??
    (await dataLayer.usersDb.getOrSetServerSetup(server.createSetup()));

  logger.info("Starting server");
  const webServer = await createWebServer({
    logger,
    dataLayer,
    opaqueServerSetup: setup,
    settings: {
      baseURL: BASE_URL,
      domain: DOMAIN,
      openIdSettings: {
        clientID: OPENID_CLIENT_ID,
        issuer: OPENID_ISSUER,
        fetchKeys: OPENID_ISSUER_FETCH_KEYS,
      },
      port: Number(PORT),
      frontendOrigin: FRONTEND_ORIGIN,
    },
    // TODO: Redis
    stateLayer: createMemoryStateLayer(),
  });

  const started = webServer.start();
  logger.info("Started !");

  async function terminate() {
    logger.info("Stopping...");
    await started.stop();
    await dataLayer.stop();
    logger.info("Stopped!");
    // some other closing procedures go here
    process.exit(0);
  }

  process.on("SIGINT", terminate);
  process.on("SIGTERM", terminate);
}

main();
