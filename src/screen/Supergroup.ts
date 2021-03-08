import { Airgram } from "@airgram/web";
import { flow, pipe } from "fp-ts/function";
import { useRemoteData } from "../hook";
import { getChat, getSupergroup, getSupergroupFullInfo, getSupergroupMembers } from "../tg";
import { Navigate } from "./nav";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as RD from "../remoteData";
import { ReactElement, createElement as r, Fragment } from "react";
import { Headline, Layout, LayoutSection, ProgressBar, Stack } from "@servicetitan/design-system";
import { UserCard } from "../components/UserCard";
import { BaseList } from "./BaseList";
import { HiddenErrorButton } from "../components/HiddenErrorButton";

const constString = (s: string) => () => r("span", undefined, s);

type Props = {
  airgram: Airgram;
  supergroupId: number;
  next: Navigate;
  back: O.Option<IO.IO<void>>;
};

export const Supergroup = ({ airgram, supergroupId, next, back }: Props) =>
  r(BaseList, {
    back,
    header: pipe(
      useRemoteData(() => getSupergroup({ supergroupId })(airgram)),
      RD.foldNoIdle(
        constString("Supergroup"),
        (err) =>
          r(
            "span",
            {},
            "Supergroup",
            " ",
            r(HiddenErrorButton, { title: "Supergroup loading error", text: JSON.stringify(err) }),
          ),
        (s) => r("span", undefined, `Supergroup ${s.username}`),
      ),
    ),
    content: pipe(
      useRemoteData(() =>
        pipe(
          getSupergroupMembers({ supergroupId, offset: 0, limit: 200 }),
          RTE.map((a) => a.members),
          RTE.map(RA.map((a) => a.userId)),
        )(airgram),
      ),
      RD.foldNoIdle(
        (): ReactElement => r(ProgressBar, { indeterminate: true, position: "top" }, undefined),
        (err) => r("div", undefined, JSON.stringify(err)),
        flow(
          RA.map((userId) =>
            r(UserCard, {
              key: userId,
              userId,
              airgram,
              next,
            }),
          ),
          (el) => r(Fragment, {}, el),
        ),
      ),
    ),
  });
