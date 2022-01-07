import { createElement as r } from "react";
import { render } from "react-dom";
import { Airgram } from "@airgram/web";
import { Auth } from "./auth"; // We borrow the component only for demonstration purposes.
// import { Auth } from "airgram";
import { App } from "./app";
import { Frame, Page } from "@servicetitan/design-system";
import "@servicetitan/design-system/dist/system.min.css";

// @ts-ignore
const apiId = parseInt(import.meta.env.VITE_PUBLIC_API_ID, 10);
if (!apiId) {
  throw new Error("Failed to obtain api_id");
}
// @ts-ignore
const apiHash = import.meta.env.VITE_PUBLIC_API_HASH;
if (!apiHash) {
  throw new Error("Failed to obtain api_hash");
}

const airgram = new Airgram({
  apiId,
  apiHash,
  jsLogVerbosityLevel: "warning",
  logVerbosityLevel: 2,
});

airgram.use(
  new Auth({
    code: () => window.prompt("Please enter the secret code:") || "",
    phoneNumber: () => window.prompt("Please enter your phone number:") || "",
    password: () => window.prompt("Please enter your password:") || "",
  }),
);

render(
  r(Frame, { style: { minHeight: 400 } }, r(Page, undefined, r(App, { airgram }, undefined))),
  document.getElementById("app"),
);
