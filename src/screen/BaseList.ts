import { constUndefined, pipe } from "fp-ts/function";
import { createElement as r, ReactNode } from "react";
import { Button, Headline, Layout, LayoutSection, Stack } from "@servicetitan/design-system";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";

const Header = ({ back, content }: { back: O.Option<IO.IO<void>>; content: ReactNode }) =>
  r(
    Stack,
    { spacing: 2, alignItems: "center" },
    pipe(
      back,
      O.fold(constUndefined, (io) =>
        r(Button, { iconName: "arrow_back", onClick: () => io() }, undefined),
      ),
    ),
    content,
  );

export const BaseList = ({
  back,
  header,
  content,
}: {
  back: O.Option<IO.IO<void>>;
  header: ReactNode;
  content: ReactNode;
}) =>
  r(
    Layout,
    { type: "island" },
    r(Headline, undefined, r(Header, { back, content: header })),
    r(LayoutSection, undefined, r(Stack, { direction: "column", spacing: 1 }, content)),
  );
