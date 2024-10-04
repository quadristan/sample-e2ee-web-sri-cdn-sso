import { RequestHandler } from "express";

import { Claims } from "../web-server-settings";

export function checkIsAdmin(): RequestHandler {
  return (req, res, next) => {
    if (!req.oid.claims.has(Claims.Admin)) {
      return res.status(404).send();
    }
    next();
  };
}
