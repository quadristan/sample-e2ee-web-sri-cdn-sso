import { MongoClient } from "mongodb";
import { DataLayer } from "../data-layer";
import { createMongoDocumentsDb } from "./documents-db-mongo";
import { createMongoUsersDb } from "./users-db-mongo";
import { Dependencies } from "../../web/dependencies";

export interface MongoDbSettings {
  readonly url: string; // "mongodb://localhost:27017/mydb";
  readonly username: string;
  readonly password: string;
}
export async function createMongoDbDataLayer({
  password,
  url,
  username,
}: MongoDbSettings): Promise<DataLayer> {
  const client = await MongoClient.connect(url, {
    auth: { username, password },
  });

  const backendDb = client.db("backend");

  return {
    documentsDb: await createMongoDocumentsDb(backendDb),
    usersDb: await createMongoUsersDb(backendDb),
    stop: async () => {
      await client.close(true);
    },
  };
}
