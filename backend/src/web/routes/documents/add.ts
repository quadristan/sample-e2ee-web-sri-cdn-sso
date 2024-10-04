import sodium, { from_base64 } from "libsodium-wrappers";
import { z } from "zod";

import { Controller } from "../route-controller";

export const AddDocumentSchema = z.object({
  encryptedContent: z.string(),
  signature: z.string(),
});
export const DocumentsAddController: Controller = (route) => {
  route.post("/documents/:uuid", async (req, response) => {
    await sodium.ready;

    const { uuid } = req.params;
    const parsed = AddDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return response.status(400).send(parsed.error);
    }
    const { encryptedContent, signature } = parsed.data;
    const user = await req.dependencies.dataLayer.usersDb.getUserById(
      req.oid.sub
    );
    if (!user) {
      return response.status(400).send("User not found");
    }
    const { sign } = user.publicKeys;

    // check signature
    const signatureOk = sodium.crypto_sign_verify_detached(
      from_base64(signature),
      from_base64(encryptedContent),
      from_base64(sign)
    );

    if (!signatureOk) {
      return response.status(400).send("Invalid signature");
    }

    await req.dependencies.dataLayer.documentsDb.createDocument({
      uuid,
      encryptedContent,
      signature,
      signaturePublicKey: sign,
    });

    return response.status(201).send(`/documents/${uuid}`);
  });
};
