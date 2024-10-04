import { User } from "../domain/types";

export interface UsersDb {
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  deleteUser(id: string): Promise<void>;

  getUserByPublicKsignKey(publicKey: string): Promise<User | null>;
  clearAllUsers(): Promise<void>;

  getAllIdentifiers(): Promise<string[]>;
  getAllUnvalidated(): Promise<string[]>;

  getOrSetServerSetup(str: string): Promise<string>;
}

export function createMemoryUsersDb(): UsersDb {
  const idMaps = new Map<string, User>();
  const usernameMaps = new Map<string, User>();
  const publicKeyMaps = new Map<string, User>();
  let serverSetup: string | undefined = undefined;

  return {
    getOrSetServerSetup(val: string) {
      if (serverSetup) {
        return Promise.resolve(serverSetup);
      }
      serverSetup = val;
      return Promise.resolve(val);
    },
    clearAllUsers() {
      idMaps.clear();
      usernameMaps.clear();
      publicKeyMaps.clear();
      return Promise.resolve();
    },
    createUser(user) {
      idMaps.set(user.id, user);
      usernameMaps.set(user.username, user);
      publicKeyMaps.set(user.publicKeys.sign, user);
      return Promise.resolve();
    },
    deleteUser(id) {
      const user = idMaps.get(id);
      if (user) {
        idMaps.delete(id);
        usernameMaps.delete(user.username);
        publicKeyMaps.delete(user.publicKeys.sign);
      }
      return Promise.resolve();
    },
    getAllIdentifiers() {
      return Promise.resolve(Array.from(idMaps.keys()));
    },
    getUserById(id) {
      return Promise.resolve(idMaps.get(id) ?? null);
    },
    getUserByPublicKsignKey(publicKey) {
      return Promise.resolve(publicKeyMaps.get(publicKey) ?? null);
    },
    getUserByUsername(username) {
      return Promise.resolve(usernameMaps.get(username) ?? null);
    },
    updateUser(user) {
      idMaps.set(user.id, user);
      usernameMaps.set(user.username, user);
      publicKeyMaps.set(user.publicKeys.sign, user);
      return Promise.resolve();
    },
    getAllUnvalidated() {
      return Promise.resolve(
        [...idMaps.values()]
          .filter((v) => v.validerPublicExchangeKey === "")
          .map((v) => v.id)
      );
    },
  };
}
