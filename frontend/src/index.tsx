import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "react-oidc-context";
import { FRONTEND_URL, OPENID_AUTHORITY } from "./constants";
import { WebStorageStateStore } from "oidc-client-ts";

const oidcConfig = {
  authority: OPENID_AUTHORITY,
  client_id: "e2esamplefrontend",
  redirect_uri: FRONTEND_URL,
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
const replaceHistory = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};
root.render(
  <React.StrictMode>
    <AuthProvider
      authority={oidcConfig.authority}
      client_id={oidcConfig.client_id}
      redirect_uri={oidcConfig.redirect_uri}
      onSigninCallback={replaceHistory}
      automaticSilentRenew={true}
      userStore={new WebStorageStateStore({ store: window.localStorage })}
    >
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
