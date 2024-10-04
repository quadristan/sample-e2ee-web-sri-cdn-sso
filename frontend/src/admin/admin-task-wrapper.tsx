import { PropsWithChildren, useEffect, useState } from "react";
import { useBackend } from "../backend/use-backend-context";
import { AcceptNewMembers } from "./accept-new-members";

export const AdminTaskWrapper = ({ children }: PropsWithChildren) => {
  const { endpoints, backendUser } = useBackend();
  const [unvalidatedUsers, setUnvalidatedUsers] = useState<
    Record<string, string>
  >({});

  const { isAdmin } = backendUser;
  const hasUnvalidatedUsers = Object.keys(unvalidatedUsers).length > 0;

  useEffect(() => {
    if (!isAdmin || hasUnvalidatedUsers) {
      return;
    }
    async function load() {
      if (!endpoints) {
        return;
      }
      const unvalidatedIds = await endpoints.getAllUnvalidatedUserIds();
      const allUserNames = await Promise.all(
        unvalidatedIds.map((id) => endpoints.getOtherUser(id))
      );
      setUnvalidatedUsers((oldValue) => {
        for (let i = 0; i < unvalidatedIds.length; ++i) {
          oldValue[unvalidatedIds[i]] = allUserNames[i].username;
        }
        return { ...oldValue };
      });
    }
    load();
  }, [endpoints, isAdmin, hasUnvalidatedUsers, setUnvalidatedUsers]);

  if (!endpoints) {
    return null;
  }

  if (isAdmin && hasUnvalidatedUsers) {
    return (
      <AcceptNewMembers
        accept={(id) => {
          endpoints.activateUser(id);
          setUnvalidatedUsers((oldUsers) => {
            delete oldUsers[id];
            return { ...oldUsers };
          });
        }}
        reject={(id) => {
          endpoints.deleteUser(id);
          setUnvalidatedUsers((oldUsers) => {
            delete oldUsers[id];
            return { ...oldUsers };
          });
        }}
        unvalidated={unvalidatedUsers}
      />
    );
  }

  return <>{children}</>;
};
