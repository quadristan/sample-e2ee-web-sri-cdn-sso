import { PropsWithChildren, useEffect, useState } from "react";

export const WaitToken = ({
  tokenGetter,
  children,
}: PropsWithChildren<{
  tokenGetter: () => string;
}>) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      return;
    }
    const interval = setInterval(() => {
      const token = tokenGetter();
      if (token) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 300);
    return () => {
      clearInterval(interval);
    };
  }, [loading]);
  if (loading) {
    return null;
  }

  return <>{children}</>;
};
