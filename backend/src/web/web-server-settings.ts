export interface OpenIdSettings {
  clientID: string;
  issuer: string;
  fetchKeys: string;
}

export interface WebServerSettings {
  readonly openIdSettings: OpenIdSettings;
  readonly port: number;
  readonly baseURL: string;
  readonly domain: string;
  readonly frontendOrigin: string;
}

export const Claims = {
  Admin: "admin",
  User: "user",
};
