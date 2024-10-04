import { Db, ObjectId } from "mongodb";
import { DocumentsDb } from "../documents-db";
import { Document, Keys } from "../../domain/types";

type ResolvedOf<T> = T extends Promise<infer U> ? U : never;

export async function createMongoDocumentsDb(
  database: Db
): Promise<DocumentsDb> {
  const keys = database.collection<{ keys: Keys; id: "0" }>("keys");
  const documents = database.collection<Document>("documents");
  await documents.createIndex("uuid", { unique: true });
  await keys.createIndex("id", { unique: true });

  return {
    async getPublicKeys() {
      const r = await keys.findOne();
      if (!r) {
        return {
          encrypt: "",
          exchange: "",
          sign: "",
        };
      }
      return r.keys;
    },
    async setPublicKeys(newKeys) {
      await keys.replaceOne(
        { id: "0" },
        { id: "0", keys: newKeys },
        { upsert: true }
      );
    },
    async clearAllDocuments() {
      await documents.deleteMany({});
    },
    async createDocument(document) {
      await documents.insertOne(document);
    },
    async deleteDocument(uuid) {
      await documents.deleteOne({ uuid });
    },
    async getAllIdentifiers() {
      const allDocuments = documents.find();
      let document: ResolvedOf<ReturnType<typeof allDocuments.next>>;
      const result = new Array<string>();
      while ((document = await allDocuments.next())) {
        result.push(document.uuid);
      }
      return result;
    },
    async getDocumentById(uuid) {
      return await documents.findOne({ uuid });
    },
    async updateDocument(document, previousSignature) {
      await documents.updateOne(
        { uuid: document.uuid, signature: previousSignature },
        { $set: document }
      );
    },
  };
}
