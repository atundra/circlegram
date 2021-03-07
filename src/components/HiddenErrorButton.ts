import { Button, Dialog } from "@servicetitan/design-system";
import { pipe } from "fp-ts/function";
import { createElement as r, useState } from "react";

export const HiddenErrorButton = ({ title, text }: { title: string; text: string }) =>
  pipe(useState(false), ([open, setOpen]) =>
    r(
      "div",
      {},
      r(Button, { negative: true, iconName: "error", onClick: () => setOpen((open) => !open) }),
      r(
        Dialog,
        {
          open,
          title,
          onPrimaryActionClick: () => setOpen((open) => !open),
          primaryActionName: "Ok",
        },
        text,
      ),
    ),
  );
