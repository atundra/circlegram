import { Headline, Mask, ProgressBar } from "@servicetitan/design-system";
import { createElement as r } from "react";
import { div } from "../dom";

export const AppInit = () =>
  r(
    Mask,
    {
      content: div({ className: "m-t-1 m-b-1", style: { textAlign: "center" } })(
        r(ProgressBar, { indeterminate: true, position: "top", small: true }, undefined),
        r(Headline, { size: "small", className: "m-b-1" }, "Initializing the app..."),
      ),
    },
    r("div", { style: { height: "100vh" } }),
  );
