import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "react-oidc-context";
import { useBackend } from "../backend/use-backend-context";
import { Login } from "./login";
import { Unactivated } from "./unactivated";
import { Register } from "./register";
import { OpenSession } from "./open-session";
import { BackendProvider } from "../backend/backend-provider";
import { WaitToken } from "./wait-token-wrapper";

const WithBackend = ({
  sub,
  children,
  tokenGetter,
}: PropsWithChildren<{
  sub: string;
  tokenGetter: () => string;
}>) => {
  return (
    <BackendProvider sub={sub} tokenGetter={tokenGetter}>
      {children}
    </BackendProvider>
  );
};

const LoggedWrapper = ({ children }: PropsWithChildren) => {
  const {
    backendUser: { isRegistered, isActivated, denied },
    userSession: { isSessionOpen },
  } = useBackend();

  return useMemo(() => {
    if (denied) {
      return (
        <div>
          <h1>
            You do not have the needed permission to access this application.
          </h1>
          <p>
            Ask your admin to give you the <i>user</i> role.
          </p>
        </div>
      );
    }

    if (!isRegistered) {
      return <Register />;
    }
    if (!isActivated) {
      return <Unactivated />;
    }
    if (!isSessionOpen) {
      return <OpenSession />;
    }

    return <>{children}</>;
  }, [isRegistered, isActivated, isSessionOpen, children]);
};

export const LoginWrapper = (props: PropsWithChildren) => {
  const auth = useAuth();
  const token = useRef<string>();

  const accessToken = auth.user?.access_token ?? "";

  useEffect(() => {
    token.current = accessToken;
  }, [accessToken]);

  const tokenGetter = useCallback(() => {
    return token.current ?? "";
  }, []);

  if (!auth.isAuthenticated || !auth?.user?.profile.sub) {
    return <Login />;
  }

  // the token may change too often

  return (
    <WaitToken tokenGetter={tokenGetter}>
      <WithBackend sub={auth.user.profile.sub} tokenGetter={tokenGetter}>
        <LoggedWrapper>{props.children}</LoggedWrapper>
      </WithBackend>
    </WaitToken>
  );
};
