import { Db } from "mongodb";
import { UsersDb } from "../users-db";
import { User } from "../../domain/types";

type ResolvedOf<T> = T extends Promise<infer U> ? U : never;

export async function createMongoUsersDb(database: Db): Promise<UsersDb> {
  const setup = database.collection<{ setup: string; id: "0" }>("setup");
  const users = database.collection<User>("users");
  await users.createIndex("id", { unique: true });
  await users.createIndex("username", { unique: true });
  await users.createIndex("validerPublicExchangeKey", { unique: false });
  await setup.createIndex("id", { unique: true });

  return {
    async getOrSetServerSetup(str) {
      await setup.updateOne(
        { id: "0" },
        { $setOnInsert: { id: "0", setup: str } },
        { upsert: true }
      );
      const v = await setup.findOne({ id: "0" });
      if (!v) {
        throw new Error("should have updated");
      }
      return v.setup;
    },
    async clearAllUsers() {
      await users.deleteMany({});
    },
    async createUser(user) {
      await users.insertOne(user);
    },
    async deleteUser(id) {
      await users.deleteOne({ id });
    },
    async getAllIdentifiers() {
      const allUsers = users.find();
      let user: ResolvedOf<ReturnType<typeof allUsers.next>>;
      const result = new Array<string>();
      while ((user = await allUsers.next())) {
        result.push(user.id);
      }
      return result;
    },
    async getUserById(id) {
      return await users.findOne({ id });
    },
    async getUserByPublicKsignKey(publicKey) {
      return await users.findOne({ publicKeys: { sign: publicKey } });
    },
    async getUserByUsername(username) {
      return await users.findOne({ username });
    },
    async updateUser(user) {
      await users.updateOne({ id: user.id }, { $set: user });
    },
    async getAllUnvalidated() {
      const query = users.find({ validerPublicExchangeKey: "" });
      let user: ResolvedOf<ReturnType<typeof query.next>>;
      const result = new Array<string>();
      while ((user = await query.next())) {
        result.push(user.id);
      }
      return result;
    },
  };
}
