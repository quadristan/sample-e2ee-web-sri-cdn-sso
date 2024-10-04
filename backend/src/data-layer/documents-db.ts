import { Document, Keys } from "../domain/types";

export interface DocumentsDb {
  getDocumentById(uuid: string): Promise<Document | null>;
  createDocument(document: Document): Promise<void>;
  /**
   * Signature is used to make sure that two ppl are not updating the same document at the same time
   */
  updateDocument(document: Document, previousSignature: string): Promise<void>;
  deleteDocument(uuid: string): Promise<void>;
  clearAllDocuments(): Promise<void>;
  getAllIdentifiers(): Promise<string[]>;

  setPublicKeys(keys: Keys): Promise<void>;
  getPublicKeys(): Promise<Keys>;
}

export function createMemoryDocumentDb(): DocumentsDb {
  const idMaps = new Map<string, Document>();
  let keys: Keys = {
    encrypt: "",
    exchange: "",
    sign: "",
  };
  return {
    getPublicKeys() {
      return Promise.resolve(keys);
    },
    setPublicKeys(newKeys) {
      keys = newKeys;
      return Promise.resolve();
    },
    clearAllDocuments() {
      idMaps.clear();
      return Promise.resolve();
    },
    createDocument(document) {
      idMaps.set(document.uuid, document);
      return Promise.resolve();
    },
    deleteDocument(uuid) {
      idMaps.delete(uuid);
      return Promise.resolve();
    },
    getAllIdentifiers() {
      return Promise.resolve(Array.from(idMaps.keys()));
    },
    getDocumentById(uuid) {
      return Promise.resolve(idMaps.get(uuid) ?? null);
    },
    updateDocument(document, previousSignature) {
      const existing = idMaps.get(document.uuid);
      if (existing?.signature !== previousSignature) {
        return Promise.reject("Signature mismatch");
      }
      idMaps.set(document.uuid, document);
      return Promise.resolve();
    },
  };
}
