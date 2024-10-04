import * as opaque from "@serenity-kit/opaque";
import {
  AllKeys,
  AuthenticatedServerEndpoints,
  Keys,
  Me,
  PreLoginEndpoints,
  Result,
} from "./backend-context";
import { BACKEND_URL, BACKEND_DOMAIN } from "../constants";
import { generateKeys } from "../crypto/keys-generation";

import { v4 as uuid } from "uuid";
import {
  encryptKeys,
  getExportKeyForSending,
  decryptKeys,
  getExportKeyForReceiving,
} from "../crypto/keys-encryption";
import { useMemo } from "react";
import {
  decryptDocument,
  encryptandSign,
} from "../crypto/documents-encryption";
interface Props {
  sub: string;
  allKeys: undefined | AllKeys;
  onLogin: (allKeys: AllKeys) => void | Promise<void>;
  onRegister: () => void;
  tokenGetter: () => string;
}

export const useBackendEndpoints = ({
  sub,
  onLogin,
  allKeys,
  onRegister,
  tokenGetter,
}: Props) => {
  return useMemo(() => {
    async function backend<T>(
      method: "PUT" | "POST",
      path: string,
      body?: unknown
    ): Promise<Result<T, "UNAUTHORIZED" | "BAD_STATUS">>;
    async function backend<T>(
      method: "GET" | "DELETE",
      path: string
    ): Promise<Result<T, "UNAUTHORIZED" | "BAD_STATUS">>;
    async function backend<T>(
      method: "PUT" | "POST" | "GET" | "DELETE",
      path: string,
      body?: unknown
    ): Promise<Result<T, "UNAUTHORIZED" | "BAD_STATUS">> {
      const token = tokenGetter();
      if (!token) {
        throw new Error("No token :(");
      }
      const r = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.status === 403) {
        return {
          ok: false,
          error: "UNAUTHORIZED",
        } as const;
      }
      if (r.status < 200 || r.status >= 300) {
        return {
          ok: false,
          error: "BAD_STATUS",
        } as const;
      }
      if (r.status === 201 || r.status === 204 || r.status === 202) {
        return { ok: true, data: null as T };
      }
      return { ok: true, data: await r.json() };
    }

    async function throwIfError<T>(
      fn: () => Promise<Result<T, any>>
    ): Promise<T> {
      const r = await fn();
      if (r.ok) {
        return r.data;
      }
      throw Error(r.error);
    }

    const preloginEndpoints: PreLoginEndpoints = {
      getMe: async () => {
        const r = await backend<Me>("GET", `/users/me`);
        if (r.ok) {
          return { ok: true, data: r.data };
        }
        if (r.error === "BAD_STATUS") {
          throw new Error(r.error);
        }
        return {
          ok: false,
          error: "AUTH_FAILURE",
        };
      },
      register: async (password: string) => {
        await opaque.ready;

        const { clientRegistrationState, registrationRequest } =
          opaque.client.startRegistration({
            password,
          });

        const { registrationResponse } = await throwIfError(() =>
          backend<{
            registrationResponse: string;
          }>("POST", "/users", { phase: "start", registrationRequest })
        );

        const { exportKey, registrationRecord } =
          opaque.client.finishRegistration({
            clientRegistrationState,
            password,
            registrationResponse,
            identifiers: {
              server: BACKEND_DOMAIN,
              client: sub,
            },
          });

        const { privateKeys, publicKeys } = await generateKeys();

        const { keys, nonce } = await encryptKeys(privateKeys, exportKey);
        // encrypt the private keys with the schema
        await throwIfError(() =>
          backend("POST", "/users", {
            phase: "complete",
            registrationRecord,
            publicKeys,
            encryptedPrivateKeys: keys,
            userPrivateKeysNonce: nonce,
          })
        );

        if (
          (await throwIfError(() => backend<string[]>("GET", `/users`)))
            .length === 1
        ) {
          // first user to register is admin, let's activate it and g enerate all keys
          const docKeys = await generateKeys();
          const encryptedDocKeys = await encryptKeys(
            docKeys.privateKeys,
            await getExportKeyForSending(
              publicKeys.exchange,
              privateKeys.exchange,
              publicKeys.exchange
            )
          );
          await throwIfError(() =>
            backend("POST", `/documents/keys`, docKeys.publicKeys)
          );

          await throwIfError(() =>
            backend("POST", `/users/${sub}/activate`, {
              documentsPrivateKeys: encryptedDocKeys.keys,
              documentsPrivateKeysNonce: encryptedDocKeys.nonce,
            })
          );
        }

        onRegister();
      },
      login: async (password: string) => {
        await opaque.ready;
        const { clientLoginState, startLoginRequest } =
          opaque.client.startLogin({
            password,
          });
        const { loginResponse } = await throwIfError(() =>
          backend<{
            loginResponse: string;
          }>("POST", `/users/${sub}/open`, {
            phase: "start",
            startLoginRequest,
          })
        );
        const finishLoging = opaque.client.finishLogin({
          clientLoginState,
          loginResponse,
          password,
          identifiers: {
            client: sub,
            server: BACKEND_DOMAIN,
          },
        });
        if (!finishLoging) {
          throw new Error("incorrect pw");
        }
        const { exportKey, finishLoginRequest } = finishLoging;

        const {
          documentsPrivateKeys: documentsEncryptedPrivateKeys,
          documentsPrivateKeysNonce,
          publicKeys,
          userPrivateKeys: userEncryptedPrivateKeys,
          userPrivateKeysNonce,
          validerPublicExchangeKey,
        } = await throwIfError(() =>
          backend<{
            publicKeys: Keys;
            userPrivateKeys: Keys;
            userPrivateKeysNonce: string;
            validerPublicExchangeKey: string;
            documentsPrivateKeys: Keys;
            documentsPrivateKeysNonce: string;
          }>("POST", `/users/${sub}/open`, {
            phase: "complete",
            finishLoginRequest,
          })
        );
        if (!validerPublicExchangeKey) {
          throw new Error("account not yet activated - please ask admin");
        }

        const userPrivateKeys = await decryptKeys(
          userEncryptedPrivateKeys,
          exportKey,
          userPrivateKeysNonce
        );

        const documentPrivateKeys = await decryptKeys(
          documentsEncryptedPrivateKeys,
          await getExportKeyForReceiving(
            publicKeys.exchange,
            userPrivateKeys.exchange,
            validerPublicExchangeKey
          ),
          documentsPrivateKeysNonce
        );

        const documentPublicKeys = await throwIfError(() =>
          backend<Keys>("GET", `/documents/keys`)
        );

        await onLogin({
          doc: {
            privateKeys: documentPrivateKeys,
            publicKeys: documentPublicKeys,
          },
          user: {
            privateKeys: userPrivateKeys,
            publicKeys: publicKeys,
          },
        });
      },
    };

    const endpoints: AuthenticatedServerEndpoints | undefined = !!allKeys
      ? {
          clear: async () => {
            await throwIfError(() => backend("POST", "/admin/clear"));
          },
          deleteUser: async (id: string) => {
            await throwIfError(() => backend("DELETE", `/users/${id}`));
          },
          getAllDocumentsIds: () =>
            throwIfError(() => backend<string[]>("GET", `/documents`)),
          getAllUnvalidatedUserIds: () =>
            throwIfError(() => backend<string[]>("GET", `/users/unvalidated`)),
          getDocument: async (id) => {
            const doc = await backend<{
              encryptedContent: string;
              signature: string;
            }>("GET", `/documents/${id}`);
            if (!doc.ok) {
              return { ok: false, error: "NOT_FOUND" };
            }
            const decrypted = await decryptDocument(
              doc.data.encryptedContent,
              allKeys
            );
            return {
              ok: true,
              data: {
                content: decrypted,
                id,
                signature: doc.data.signature,
              },
            };
          },
          getOtherUser: async (id) => {
            return await throwIfError(() =>
              backend<{
                publicKeys: Keys;
                username: string;
                id: string;
                isAdmin: boolean;
              }>("GET", `/users/${id}`)
            );
          },

          updateDocument: () => {
            return Promise.resolve();
          },
          activateUser: async (id: string) => {
            if (!allKeys) {
              throw new Error("need keys");
            }
            const otherUser = await throwIfError(() =>
              backend<{
                publicKeys: Keys;
                username: string;
                id: string;
                isAdmin: boolean;
              }>("GET", `/users/${id}`)
            );

            const encryptedDocKeys = await encryptKeys(
              allKeys.doc.privateKeys,
              await getExportKeyForSending(
                allKeys.user.publicKeys.exchange,
                allKeys.user.privateKeys.exchange,
                otherUser.publicKeys.exchange
              )
            );

            await throwIfError(() =>
              backend("POST", `/users/${id}/activate`, {
                documentsPrivateKeys: encryptedDocKeys.keys,
                documentsPrivateKeysNonce: encryptedDocKeys.nonce,
              })
            );
          },

          createDocument: async (content) => {
            const id = uuid();
            const { encryptedContent, signature } = await encryptandSign(
              content,
              allKeys
            );
            await throwIfError(() =>
              backend("POST", `/documents/${id}`, {
                encryptedContent,
                signature,
              })
            );
            return id;
          },
          deleteDocument: async (id) => {
            await throwIfError(() => backend("DELETE", `/documents/${id}`));
          },
        }
      : undefined;

    return {
      preloginEndpoints,
      endpoints,
    };
  }, [sub, onLogin, allKeys, onRegister, tokenGetter]);
};
