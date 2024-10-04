import { z } from "zod";
import sodium, { from_base64 } from "libsodium-wrappers";

import { Controller } from "../route-controller";

export const EditDocumentSchema = z.object({
  encryptedContent: z.string(),
  signature: z.string(),
  previousSignature: z.string(),
});

export const DocumentsEditController: Controller = (route) => {
  route.put("/documents/:uuid", async (req, response) => {
    await sodium.ready;
    const { uuid } = req.params;
    const parsed = EditDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return response.status(400).send(parsed.error);
    }
    const { encryptedContent, signature, previousSignature } = parsed.data;
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

    await req.dependencies.dataLayer.documentsDb.updateDocument(
      {
        uuid,
        encryptedContent,
        signature,
        signaturePublicKey: sign,
      },
      previousSignature
    );

    return response.status(202).send();
  });
};
