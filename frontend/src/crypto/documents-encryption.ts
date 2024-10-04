import {
  ready,
  crypto_sign_detached,
  from_base64,
  crypto_box_seal,
  crypto_box_seal_open,
} from "libsodium-wrappers";
import { AllKeys } from "../backend/backend-context";

export async function encryptandSign(
  document: string,
  allKeys: AllKeys
): Promise<{ encryptedContent: string; signature: string }> {
  await ready;

  const encryptedContent = crypto_box_seal(
    new TextEncoder().encode(document),
    from_base64(allKeys.doc.publicKeys.encrypt),
    "base64"
  );

  const signature = crypto_sign_detached(
    from_base64(encryptedContent),
    from_base64(allKeys.user.privateKeys.sign),
    "base64"
  );

  return {
    encryptedContent,
    signature,
  };
}

export async function decryptDocument(
  document: string,
  allKeys: AllKeys
): Promise<string> {
  await ready;
  return new TextDecoder().decode(
    crypto_box_seal_open(
      from_base64(document),
      from_base64(allKeys.doc.publicKeys.encrypt),
      from_base64(allKeys.doc.privateKeys.encrypt)
    )
  );
}
