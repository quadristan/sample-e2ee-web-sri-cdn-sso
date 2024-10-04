import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AllKeys,
  BackendContext,
  BackendContextValue,
  BackendUserInfo,
  Keys,
  Result,
} from "./backend-context";
import { useBackendEndpoints } from "./user-backend-endpoints";

interface Props {
  sub: string;
  tokenGetter: () => string;
}

const EMPTY_KEYS: Keys = {
  encrypt: "",
  exchange: "",
  sign: "",
};

// we assume the user is logged here
export const BackendProvider = ({
  sub,
  children,
  tokenGetter,
}: PropsWithChildren<Props>) => {
  const [backendValue, setBackendValue] = useState<
    BackendContextValue | undefined
  >(undefined);

  const onLogin = useCallback((allKeys: AllKeys) => {
    setBackendValue((backend) => {
      if (!backend) return backend;
      return {
        ...backend,
        userSession: {
          isSessionOpen: true,
          allKeys,
        },
      };
    });
  }, []);

  const onRegister = useCallback(() => {
    setBackendValue((backend) => {
      if (!backend) return backend;
      return {
        ...backend,
        backendUser: { ...backend.backendUser, isRegistered: true },
      };
    });
  }, []);

  const { endpoints, preloginEndpoints } = useBackendEndpoints({
    tokenGetter,
    onLogin,
    onRegister,
    sub,
    allKeys: backendValue?.userSession.isSessionOpen
      ? backendValue?.userSession.allKeys
      : undefined,
  });

  const getUserInfo = useMemo(
    () =>
      async (): Promise<
        Result<BackendUserInfo, "AUTH_FAILURE" | "NOT_LOADED">
      > => {
        const meResult = await preloginEndpoints.getMe();
        if (!meResult.ok) {
          return meResult;
        }
        const meJson = meResult.data;

        const isAdmin = meJson.claims.includes("admin");
        const user: BackendUserInfo = meJson.registered
          ? {
              isRegistered: true,
              isAdmin,
              publicKeys: meJson.user.publicKeys,
              userId: meJson.id,
              userName: meJson.name,
              claims: meJson.claims,
              isActivated: !!meJson.user.validerPublicExchangeKey,
              denied: false,
            }
          : {
              isAdmin,
              claims: meJson.claims,
              userId: meJson.id,
              userName: meJson.name,
              isActivated: false,
              isRegistered: false,
              publicKeys: EMPTY_KEYS,
              denied: false,
            };
        return { ok: true, data: user };
      },
    [preloginEndpoints]
  );

  const refreshUserInfo = useMemo(() => {
    return async () => {
      const info = await getUserInfo();
      setBackendValue((value) => {
        if (!value || !info.ok) return value;
        return {
          ...value,
          backendUser: info.data,
        };
      });
    };
  }, [getUserInfo]);

  // update endpoints when needed
  useEffect(() => {
    setBackendValue((old) => {
      if (!old) return;
      return { ...old, endpoints, loginEndpoints: preloginEndpoints };
    });
  }, [preloginEndpoints, endpoints]);

  // initial loading
  useEffect(() => {
    async function load() {
      const backendUser = await getUserInfo();
      setBackendValue((backend) => {
        if (backend) {
          return backend;
        }
        if (!backendUser.ok) {
          return {
            backendUser: {
              claims: [],
              denied: true,
              isActivated: false,
              isAdmin: false,
              isRegistered: false,
              userId: "",
              publicKeys: { encrypt: "", exchange: "", sign: "" },
              userName: "",
            },
            endpoints,
            refreshUserInfo,
            loginEndpoints: preloginEndpoints,
            userSession: { isSessionOpen: false },
            denied: false,
          };
        }
        return {
          backendUser: backendUser.data,
          endpoints,
          refreshUserInfo,
          loginEndpoints: preloginEndpoints,
          userSession: { isSessionOpen: false },
          denied: false,
        };
      });
    }

    load();
  }, [
    sub,
    backendValue,
    endpoints,
    preloginEndpoints,
    getUserInfo,
    refreshUserInfo,
  ]);

  if (!backendValue) {
    return null;
  }

  return (
    <BackendContext.Provider value={backendValue}>
      {children}
    </BackendContext.Provider>
  );
};
