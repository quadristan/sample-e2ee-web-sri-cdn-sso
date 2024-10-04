import express from "express";
// import { auth } from "express-openid-connect";
import cors from "cors";
import { Dependencies } from "./dependencies";
import { Controller } from "./routes/route-controller";

import { AdminResetController } from "./routes/admin/reset";
import { UsersActivateController } from "./routes/users/activate";
import { UsersDeleteController } from "./routes/users/delete";
import {
  UsersGetAllController,
  UsersGetAllUnvalidatedController,
} from "./routes/users/get";
import { UsersGetController } from "./routes/users/get";
import { UsersSessionOpenController } from "./routes/users/open";
import { UsersRegistrationController } from "./routes/users/registration";
import { DocumentsAddController } from "./routes/documents/add";
import { DocumentsDeleteController } from "./routes/documents/delete";
import { DocumentsEditController } from "./routes/documents/edit";
import {
  DocumentsGetAllController,
  DocumentsGetController,
} from "./routes/documents/get";
import { UsersMeController } from "./routes/users/me";
import { openIdMiddleware } from "./authentication/openid-middleware";
import {
  DocumentsGetKeysController,
  DocumentsSetKeysController,
} from "./routes/documents/keys";

const Controllers: Controller[] = [
  // admin
  AdminResetController,

  UsersMeController,

  // users
  UsersActivateController,
  UsersDeleteController,
  UsersGetAllController,
  UsersGetAllUnvalidatedController,
  UsersGetController,
  UsersSessionOpenController,
  UsersRegistrationController,

  // documents
  DocumentsSetKeysController,
  DocumentsGetKeysController,
  DocumentsAddController,
  DocumentsDeleteController,
  DocumentsEditController,
  DocumentsGetController,
  DocumentsGetAllController,
];

export interface WebServer {
  start(): { stop: () => Promise<void> };
}

export async function createWebServer(
  dependencies: Dependencies
): Promise<WebServer> {
  const app = express();
  app.use(express.json());

  app.use(
    cors({
      origin(requestOrigin, callback) {
        // allow requests with no origin
        // (like mobile apps or curl requests)
        if (!requestOrigin || requestOrigin === "null")
          return callback(null, true);
        if (requestOrigin !== dependencies.settings.frontendOrigin) {
          return callback(
            new Error(
              requestOrigin +
                " Not allowed by CORS " +
                dependencies.settings.frontendOrigin
            ),
            false
          );
        }
        return callback(null, true);
      },
    })
  );

  app.use(await openIdMiddleware(dependencies));

  app.use((req, _res, next) => {
    req.dependencies = dependencies;
    return next();
  });

  for (const controller of Controllers) {
    controller(app);
  }

  return {
    start() {
      const listener = app.listen(8000);
      return {
        stop() {
          return new Promise((resolve) => listener.close(() => resolve()));
        },
      };
    },
  };
}
