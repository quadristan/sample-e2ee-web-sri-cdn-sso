import { Controller } from "../route-controller";

import { server, ready } from "@serenity-kit/opaque";
import { z } from "zod";

export const OpenPhaseParamSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal("start"),
    startLoginRequest: z.string(),
  }),
  z.object({
    phase: z.literal("complete"),
    finishLoginRequest: z.string(),
  }),
]);

export const UsersSessionOpenController: Controller = (route) => {
  route.post("/users/:id/open", async (req, response) => {
    const parsed = OpenPhaseParamSchema.safeParse(req.body);
    if (!parsed.success) {
      return response.status(400).send(parsed.error);
    }

    await ready;
    const id = req.oid.sub;
    if (id !== req.params.id) {
      return response
        .status(403)
        .send("You are not allowed to access this user");
    }
    const user = await req.dependencies.dataLayer.usersDb.getUserById(id);
    if (!user) {
      return response.status(404).send("No such user");
    }
    const registrationRecord = user?.encryptionRegistrationRecord ?? "";

    const STATE_KEY_STATE = `loginstate.${id}`;

    switch (parsed.data.phase) {
      case "start": {
        const { loginResponse, serverLoginState } = server.startLogin({
          serverSetup: req.dependencies.opaqueServerSetup,
          registrationRecord,
          startLoginRequest: parsed.data.startLoginRequest,
          userIdentifier: id,
          identifiers: {
            server: req.dependencies.settings.domain,
            client: id,
          },
        });
        await req.dependencies.stateLayer.set(
          STATE_KEY_STATE,
          serverLoginState
        );
        return response.status(200).send({ loginResponse });
      }
      case "complete": {
        const serverLoginState =
          (await req.dependencies.stateLayer.get(STATE_KEY_STATE)) ?? "";
        await req.dependencies.stateLayer.clear(STATE_KEY_STATE);
        const { sessionKey } = server.finishLogin({
          serverLoginState,
          finishLoginRequest: parsed.data.finishLoginRequest,
        });
        if (!sessionKey) {
          return response.status(403).send("Login failure");
        }

        return response.status(200).send(user);
      }
    }
  });
};
