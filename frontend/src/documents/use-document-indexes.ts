import { useContext } from "react";
import { DocumentsIndexContext } from "./documents-index-context";

export const useDocumentIndexes = () => {
  return useContext(DocumentsIndexContext);
};
