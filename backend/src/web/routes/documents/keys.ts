import { checkIsAdmin } from "../../authentication/check-is-admin";
import { KeysSchema } from "../../schemas";
import { Controller } from "../route-controller";

export const DocumentsGetKeysController: Controller = (route) => {
  route.get("/documents/keys", async (req, response) => {
    const keys = await req.dependencies.dataLayer.documentsDb.getPublicKeys();
    return response.status(200).send(keys);
  });
};

export const DocumentsSetKeysController: Controller = (route) => {
  route.post("/documents/keys", checkIsAdmin(), async (req, response) => {
    const parsed = KeysSchema.safeParse(req.body);
    if (!parsed.success) {
      return response.status(400).send(parsed.error);
    }
    await req.dependencies.dataLayer.documentsDb.setPublicKeys(parsed.data);
    return response.status(204).send();
  });
};
