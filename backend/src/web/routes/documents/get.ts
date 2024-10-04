import { Controller } from "../route-controller";

export const DocumentsGetAllController: Controller = (route) => {
  route.get("/documents", async (req, response) => {
    const allIds =
      await req.dependencies.dataLayer.documentsDb.getAllIdentifiers();

    return response.status(200).send(allIds);
  });
};

export const DocumentsGetAllUnvalidatedController: Controller = (route) => {
  route.get("/documents", async (req, response) => {
    const allIds =
      await req.dependencies.dataLayer.documentsDb.getAllIdentifiers();

    return response.status(200).send(allIds);
  });
};

export const DocumentsGetController: Controller = (route) => {
  route.get("/documents/:id", async (req, response) => {
    const { id } = req.params;
    const document =
      await req.dependencies.dataLayer.documentsDb.getDocumentById(id);
    if (!document) {
      response.status(404).send("Document not found");
      return;
    }

    return response.status(200).send(document);
  });
};
