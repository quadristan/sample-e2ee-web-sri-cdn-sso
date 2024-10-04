export interface Document {
  readonly uuid: string;
  readonly encryptedContent: string;
  readonly signaturePublicKey: string;
  readonly signature: string;
}

export interface Keys {
  readonly sign: string;
  readonly exchange: string;
  readonly encrypt: string;
}

export interface User {
  /**
   * Id of the user
   */
  readonly id: string;

  /**
   * Username of the user to be displayed
   */
  readonly username: string;

  /**
   * Public keys for the user
   */
  readonly publicKeys: Keys;

  /**
   * Regigstration record for encryption (opaque)
   */
  readonly encryptionRegistrationRecord: string;

  /**
   * User private keys, but encrypted using OPAQUE export key + nonce
   */
  readonly userPrivateKeys: Keys;
  readonly userPrivateKeysNonce: string;

  /**
   * Public exchange key of an admin which validated this user.
   * Used to transmit the document private keys
   */
  readonly validerPublicExchangeKey: string;

  /**
   * Document private keys, encrypted with a diffie-hellman exchange
   */
  readonly documentsPrivateKeys: Keys;
  readonly documentsPrivateKeysNonce: string;
}
