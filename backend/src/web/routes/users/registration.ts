import { Controller } from "../route-controller";

import { server, ready } from "@serenity-kit/opaque";
import { z } from "zod";

import { KeysSchema } from "../../schemas";
import { Claims } from "../../web-server-settings";

export const RegistrationPhaseParamSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal("start"),
    registrationRequest: z.string(),
  }),
  z.object({
    phase: z.literal("complete"),
    registrationRecord: z.string(),
    publicKeys: KeysSchema,
    encryptedPrivateKeys: KeysSchema,
    userPrivateKeysNonce: z.string(),
  }),
]);

export const UsersRegistrationController: Controller = (route) => {
  route.post("/users", async (req, response) => {
    const parsed = RegistrationPhaseParamSchema.safeParse(req.body);
    if (!parsed.success) {
      response.status(400).send(parsed.error);
      return;
    }
    await ready;
    const { usersDb } = req.dependencies.dataLayer;
    if ((await usersDb.getAllIdentifiers()).length === 0) {
      // first user needs to be admin
      if (!req.oid.claims.has(Claims.Admin)) {
        return response.status(503).send("need an admin first");
      }
    }

    switch (parsed.data.phase) {
      case "start":
        {
          const { registrationRequest } = parsed.data;

          const { registrationResponse } = server.createRegistrationResponse({
            serverSetup: req.dependencies.opaqueServerSetup,
            registrationRequest,
            userIdentifier: req.oid.sub,
          });

          response.status(200).send({ registrationResponse });
        }
        return;
      case "complete":
        {
          const {
            registrationRecord,
            encryptedPrivateKeys,
            publicKeys,
            userPrivateKeysNonce,
          } = parsed.data;

          await usersDb.createUser({
            id: req.oid.sub,
            encryptionRegistrationRecord: registrationRecord,
            publicKeys,
            username: req.oid.name,
            userPrivateKeys: encryptedPrivateKeys,
            userPrivateKeysNonce,

            // following will be set upon activation
            documentsPrivateKeys: {
              encrypt: "",
              exchange: "",
              sign: "",
            },
            documentsPrivateKeysNonce: "",
            validerPublicExchangeKey: "",
          });
          response.set("location", `/users/${req.oid.sub}`);

          response.status(201).send();
        }
        return;
    }
    return;
  });
};
