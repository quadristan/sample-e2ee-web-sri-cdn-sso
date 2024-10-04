import { Button, Input } from "@mui/material";
import { useBackend } from "../backend/use-backend-context";
import { useState } from "react";

export const Register = () => {
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginEndpoints } = useBackend();

  if (loading) {
    return <div>Loading session registering...</div>;
  }

  return (
    <div>
      <h1>Registration</h1>
      <p>
        You need to set up a password of at least 5 characters to enable access
        to sensitive data. Do not forget it, you'd have to register again
      </p>
      <p>{error}</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (pass.length <= 4) return;
          setLoading(true);
          try {
            await loginEndpoints.register(pass);
          } catch (e) {
            console.error(e);
            setError(String(e));
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
