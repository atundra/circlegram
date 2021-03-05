import { createElement as r } from "react";
import ReactDOM from "react-dom";
import { Airgram } from "@airgram/web";
import { Auth } from "./auth"; // We borrow the component only for demonstration purposes.
import { App } from "./app";
import { Frame, Page } from "@servicetitan/design-system";
import "@servicetitan/design-system/dist/system.min.css";

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

ReactDOM.render(
  r(Frame, { style: { minHeight: 400 } }, r(Page, undefined, r(App, { airgram }, undefined))),
  document.getElementById("app"),
);

window.ag = airgram;
