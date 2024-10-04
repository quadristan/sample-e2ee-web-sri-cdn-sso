import { z } from "zod";

import { Controller } from "../route-controller";
import { KeysSchema } from "../../schemas";
import { checkIsAdmin } from "../../authentication/check-is-admin";

export const ActivateUserSchema = z.object({
  documentsPrivateKeys: KeysSchema,
  documentsPrivateKeysNonce: z.string(),
});

export const UsersActivateController: Controller = (route) => {
  route.post("/users/:id/activate", checkIsAdmin(), async (req, response) => {
    const parsed = ActivateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      response.status(400).send(parsed.error);
      return;
    }
    const { usersDb } = req.dependencies.dataLayer;
    const { id } = req.params;
    const user = await usersDb.getUserById(id);
    const adminUser = await usersDb.getUserById(req.oid.sub);

    if (!user) {
      response.status(404).send("User not found");
      return;
    }
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    await usersDb.updateUser({
      ...user,
      validerPublicExchangeKey: adminUser.publicKeys.exchange,
      documentsPrivateKeys: parsed.data.documentsPrivateKeys,
      documentsPrivateKeysNonce: parsed.data.documentsPrivateKeysNonce,
    });
    response.status(204).send();
  });
};
