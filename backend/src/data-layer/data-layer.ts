import { DocumentsDb, createMemoryDocumentDb } from "./documents-db";
import { UsersDb, createMemoryUsersDb } from "./users-db";

export interface DataLayer {
  readonly usersDb: UsersDb;
  readonly documentsDb: DocumentsDb;
  stop(): Promise<void>;
}

export function createMemoryDataLayer(): DataLayer {
  return {
    usersDb: createMemoryUsersDb(),
    documentsDb: createMemoryDocumentDb(),
    stop: () => Promise.resolve(),
  };
}
