import { Airgram } from "@airgram/web";
import { flow, pipe } from "fp-ts/function";
import { useRemoteData } from "../hook";
import { getSupergroupMembers } from "../tg";
import { Navigate } from "./nav";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as RD from "../remoteData";
import { ReactElement, createElement as r } from "react";
import { Headline, Layout, LayoutSection, ProgressBar, Stack } from "@servicetitan/design-system";
import { UserCard } from "../components/UserCard";

type Props = {
  airgram: Airgram;
  supergroupId: number;
  navigate: Navigate;
};

export const Supergroup = ({ airgram, supergroupId, navigate }: Props) =>
  pipe(
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
          r(
            UserCard,
            {
              key: userId,
              userId,
              airgram,
              navigate,
            },
            undefined,
          ),
        ),
        (el) =>
          r(
            Layout,
            { type: "island" },
            r(Headline, undefined, "Supergroup"),
            r(LayoutSection, undefined, r(Stack, { direction: "column", spacing: 1 }, el)),
          ),
      ),
    ),
  );
