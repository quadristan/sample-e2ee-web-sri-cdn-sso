import React from "react";

export interface Keys {
  readonly sign: string;
  readonly exchange: string;
  readonly encrypt: string;
}

export interface KeyPair {
  publicKeys: Keys;
  privateKeys: Keys;
}
export interface AllKeys {
  user: KeyPair;
  doc: KeyPair;
}
export interface OtherUser {
  readonly id: string;
  readonly username: string;
  readonly isAdmin: boolean;
  readonly publicKeys: Keys;
}

export interface Document {
  readonly id: string;
  readonly signature: string;
  readonly content: string; // here, decrypted
}

export interface BackendUserInfo {
  readonly userId: string;
  readonly userName: string;
  readonly isAdmin: boolean;
  readonly isRegistered: boolean;
  readonly publicKeys: Keys;

  readonly isActivated: boolean;
  readonly claims: string[];
  readonly denied: boolean;
}

export type UserSessionInfo =
  | {
      isSessionOpen: true;
      allKeys: AllKeys;
    }
  | {
      isSessionOpen: false;
    };

export type Me = {
  id: string;
  name: string;
  claims: string[];
} & (
  | {
      registered: true;
      user: {
        publicKeys: Keys;
        userPrivateKeys: Keys;
        validerPublicExchangeKey: string;
        documentsPrivateKeys: Keys;
      };
    }
  | { registered: false }
);

export type Result<V, E extends string> =
  | { ok: true; data: V }
  | { ok: false; error: E };

export interface PreLoginEndpoints {
  register: (password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  getMe: () => Promise<Result<Me, "AUTH_FAILURE">>;
}

export interface AuthenticatedServerEndpoints {
  // admin functions
  clear: () => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;

  getAllUnvalidatedUserIds: () => Promise<string[]>;
  getOtherUser: (id: string) => Promise<OtherUser>;

  getAllDocumentsIds: () => Promise<string[]>;
  getDocument: (id: string) => Promise<Result<Document, "NOT_FOUND">>;
  updateDocument: (
    id: string,
    previousSignature: string,
    signature: string,
    content: string
  ) => Promise<void>;

  createDocument: (content: string) => Promise<string>;
  deleteDocument: (id: string) => Promise<void>;
}
export interface BackendContextValue {
  readonly backendUser: BackendUserInfo;
  readonly userSession: UserSessionInfo;
  readonly loginEndpoints: PreLoginEndpoints;
  readonly endpoints?: AuthenticatedServerEndpoints;
  // indicate if the user cant use the app
  refreshUserInfo: () => Promise<void>;
}
export const BackendContext = React.createContext<
  BackendContextValue | undefined
>(undefined);
