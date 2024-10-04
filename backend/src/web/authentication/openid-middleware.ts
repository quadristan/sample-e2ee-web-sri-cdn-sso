import { RequestHandler } from "express";
import { TextDecoder } from "util";

import { expressjwt, Request as JWTRequest } from "express-jwt";
import jwksClient from "jwks-rsa";

import { Claims } from "../web-server-settings";
import winston from "winston";
import { Dependencies } from "../dependencies";

const RETRY_SETTINGS = {
  nbTries: 3,
  pauseBetween: 10_000,
};

interface MiddlewareOptions {
  issuerUrl: string;
  logger: winston.Logger;
}

async function retry<T>(
  logger: winston.Logger,
  fn: () => Promise<T>
): Promise<T> {
  let remainingTries = RETRY_SETTINGS.nbTries;
  let lastError = new Error();
  while (remainingTries-- > 0) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      logger.log("error", e);
    }
    if (remainingTries > 0) {
      logger.log(
        "error",
        `Error trying to fetch key.. ${remainingTries} tries left`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_SETTINGS.pauseBetween)
      );
    }
  }
  throw lastError;
}

async function getPublicKey(
  issuer: string,
  logger: winston.Logger
): Promise<string> {
  const response = await retry(
    logger,
    async () => await fetch(`${issuer}/.well-known/openid-configuration`)
  );
  const responseJson = await response.json();

  if (
    !responseJson ||
    typeof responseJson !== "object" ||
    !("jwks_uri" in responseJson) ||
    typeof responseJson.jwks_uri !== "string"
  ) {
    throw new Error("Unknown configuration type");
  }
  const { jwks_uri } = responseJson;
  const client = jwksClient({ jwksUri: jwks_uri });
  const keys = await client.getSigningKey();
  return keys.getPublicKey();
}

export async function openIdMiddleware({
  logger,
  settings,
}: Dependencies): Promise<RequestHandler> {
  const key = await getPublicKey(settings.openIdSettings.fetchKeys, logger);

  const jwtMiddleware = expressjwt({
    algorithms: ["RS256"],
    secret: key,
    issuer: settings.openIdSettings.issuer,
  });

  return (req, res, next) => {
    // ensure tokens are valid
    jwtMiddleware(req, res, () => {
      const { auth } = req as JWTRequest;
      if (!auth?.sub) {
        return res.status(403).send("Not authorized to use this app " + auth);
      }
      const userName = auth.preferred_username ?? auth.sub;
      const roles = auth.resource_access.e2esamplefrontend?.roles ?? [];

      req.oid = {
        sub: auth?.sub ?? "",
        name: userName,
        claims: new Set(roles),
      };

      if (!req.oid.claims.has(Claims.User)) {
        return res
          .status(403)
          .send("Has no user user claim. Found: " + [...req.oid.claims]);
      }
      return next();
    });
  };
}

declare global {
  namespace Express {
    interface Request {
      oid: {
        sub: string;
        name: string;
        claims: Set<string>;
      };
    }
  }
}
