import { Button, Input } from "@mui/material";
import { useBackend } from "../backend/use-backend-context";
import { useState } from "react";

export const OpenSession = () => {
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const backend = useBackend();
  if (!backend || loading) {
    return null;
  }

  return (
    <div>
      <h1>Enter the password you used to register.</h1>
      <p>{error}</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (pass.length <= 4) return;
          try {
            setLoading(true);
            await backend.loginEndpoints.login(pass);
          } catch (e) {
            setError(String(e));
            console.error(e);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <Button type="submit" disabled={pass.length <= 4}>
          Okay
        </Button>
      </form>
    </div>
  );
};
