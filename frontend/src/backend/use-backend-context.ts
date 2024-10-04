import { useContext } from "react";
import { BackendContext } from "./backend-context";

export const useBackend = () => {
  const r = useContext(BackendContext);
  if (!r) {
    throw new Error("Backend should be ready at this point");
  }
  return r;
};
