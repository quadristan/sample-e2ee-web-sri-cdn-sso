import {
  ready,
  crypto_kx_keypair,
  crypto_sign_keypair,
  crypto_box_keypair,
} from "libsodium-wrappers";
import { Keys } from "../backend/backend-context";

export async function generateKeys(): Promise<{
  publicKeys: Keys;
  privateKeys: Keys;
}> {
  await ready;
  const kx = crypto_kx_keypair("base64");
  const sign = crypto_sign_keypair("base64");
  const encrypt = crypto_box_keypair("base64");

  return {
    publicKeys: {
      encrypt: encrypt.publicKey,
      exchange: kx.publicKey,
      sign: sign.publicKey,
    },
    privateKeys: {
      encrypt: encrypt.privateKey,
      exchange: kx.privateKey,
      sign: sign.privateKey,
    },
  };
}
