import { Button } from "@mui/material";
import { useBackend } from "../backend/use-backend-context";
import { useEffect } from "react";

export const Unactivated = () => {
  const { refreshUserInfo } = useBackend();
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUserInfo();
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [refreshUserInfo]);

  return (
    <div>
      <h1>Your account is not yet activated. Please contact an admin</h1>
      <Button type="button" onClick={refreshUserInfo}>
        Refresh
      </Button>
    </div>
  );
};
