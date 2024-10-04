import { useBackend } from "../../backend/use-backend-context";
import { useDocumentIndexes } from "../use-document-indexes";

interface Hook {
  onProcessFile: (file: File) => void;
  dialog: JSX.Element | null;
}

export const useImporter = (): Hook => {
  const { endpoints } = useBackend();
  const { indexNewDocuments, addOrUpdateDocument } = useDocumentIndexes();
  if (!endpoints) {
    throw new Error("not loaded");
  }

  return {
    onProcessFile: async (file) => {
      try {
        const json = JSON.parse(
          new TextDecoder().decode(await file.arrayBuffer())
        );
        if (!Array.isArray(json)) {
          throw new Error("Invalid json");
        }
        for (const doc of json) {
          const docContent = JSON.stringify(doc);
          const id = await endpoints.createDocument(docContent);
          addOrUpdateDocument(id, docContent);
        }
        await indexNewDocuments();
      } catch (e) {
        console.error(e);
      }
    },
    dialog: null,
  };
};
