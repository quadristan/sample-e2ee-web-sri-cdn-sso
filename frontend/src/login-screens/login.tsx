import { Button } from "@mui/material";
import { useAuth } from "react-oidc-context";

export const Login = () => {
  const auth = useAuth();
  return (
    <div>
      <h1>Please use your identity manager to login</h1>
      <Button onClick={() => void auth.signinRedirect()} variant="contained">
        Log in
      </Button>
    </div>
  );
};
