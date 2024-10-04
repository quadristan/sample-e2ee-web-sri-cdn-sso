import winston from "winston";
import { DataLayer } from "../data-layer/data-layer";
import { WebServerSettings } from "./web-server-settings";

export interface StateLayer {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  clear(key: string): Promise<void>;
}

export function createMemoryStateLayer(): StateLayer {
  const memory = new Map<string, string>();
  return {
    get(key: string) {
      return Promise.resolve(memory.get(key));
    },
    clear(key: string) {
      memory.delete(key);
      return Promise.resolve();
    },
    set(key: string, value: string) {
      memory.set(key, value);
      return Promise.resolve();
    },
  };
}
export interface Dependencies {
  readonly logger: winston.Logger;
  readonly dataLayer: DataLayer;
  readonly stateLayer: StateLayer;

  readonly settings: WebServerSettings;
  readonly opaqueServerSetup: string;
}

declare global {
  namespace Express {
    interface Request {
      dependencies: Dependencies;
    }
  }
}
