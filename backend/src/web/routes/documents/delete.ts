import { Controller } from "../route-controller";

export const DocumentsDeleteController: Controller = (route) => {
  route.delete("/documents/:id", async (req, response) => {
    const { id } = req.params;
    await req.dependencies.dataLayer.documentsDb.deleteDocument(id);

    return response.status(202).send();
  });
};
