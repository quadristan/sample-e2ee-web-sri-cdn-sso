import {
  crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
  crypto_kdf_KEYBYTES,
  crypto_secretbox_easy,
  randombytes_buf,
  ready,
  from_base64,
  crypto_kdf_derive_from_key,
  crypto_secretbox_open_easy,
  crypto_kx_client_session_keys,
  crypto_kx_server_session_keys,
  crypto_secretbox_NONCEBYTES,
} from "libsodium-wrappers";

import { Keys } from "../backend/backend-context";

export async function getExportKeyForSending(
  senderPubKey: string,
  senderPrivKey: string,
  receiverPubKey: string
) {
  // key to be able to encrypt keys for this very oen user
  const { sharedTx } = crypto_kx_client_session_keys(
    from_base64(senderPubKey),
    from_base64(senderPrivKey),
    from_base64(receiverPubKey),
    "base64"
  );
  return sharedTx;
}

export async function getExportKeyForReceiving(
  receiverPubKey: string,
  receiverPrivKey: string,
  senderPubKey: string
) {
  // key to be able to encrypt keys for this very oen user
  const { sharedRx } = crypto_kx_server_session_keys(
    from_base64(receiverPubKey),
    from_base64(receiverPrivKey),
    from_base64(senderPubKey),
    "base64"
  );
  return sharedRx;
}

export async function encryptKeys(
  base: Keys,
  exportKey: string
): Promise<{ keys: Keys; nonce: string }> {
  await ready;
  const exportKeyAsUint8Array = from_base64(exportKey);
  const secretKey = crypto_kdf_derive_from_key(
    crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    1, // publicly available subkey_id
    "encryptedKeys",
    exportKeyAsUint8Array.subarray(0, crypto_kdf_KEYBYTES)
  );
  const nonce = randombytes_buf(crypto_secretbox_NONCEBYTES, "base64");
  return {
    nonce,
    keys: {
      encrypt: crypto_secretbox_easy(
        from_base64(base.encrypt),
        from_base64(nonce),
        secretKey,
        "base64"
      ),
      exchange: crypto_secretbox_easy(
        from_base64(base.exchange),
        from_base64(nonce),
        secretKey,
        "base64"
      ),
      sign: crypto_secretbox_easy(
        from_base64(base.sign),
        from_base64(nonce),
        secretKey,
        "base64"
      ),
    },
  };
}

export async function decryptKeys(
  base: Keys,
  exportKey: string,
  nonce: string
): Promise<Keys> {
  await ready;
  const exportKeyAsUint8Array = from_base64(exportKey);
  const secretKey = crypto_kdf_derive_from_key(
    crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    1, // publicly available subkey_id
    "encryptedKeys",
    exportKeyAsUint8Array.subarray(0, crypto_kdf_KEYBYTES)
  );

  return {
    encrypt: crypto_secretbox_open_easy(
      from_base64(base.encrypt),
      from_base64(nonce),
      secretKey,
      "base64"
    ),
    exchange: crypto_secretbox_open_easy(
      from_base64(base.exchange),
      from_base64(nonce),
      secretKey,
      "base64"
    ),
    sign: crypto_secretbox_open_easy(
      from_base64(base.sign),
      from_base64(nonce),
      secretKey,
      "base64"
    ),
  };
}
