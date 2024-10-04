import { z } from "zod";

export const KeysSchema = z.object({
  sign: z.string(),
  exchange: z.string(),
  encrypt: z.string(),
});
