import { Airgram } from "@airgram/web";
import { flow, pipe } from "fp-ts/function";
import { Navigate } from "../screen/nav";
import { useRemoteData } from "../hook";
import * as RD from "../remoteData";
import { getChat, getGroupsInCommon } from "../tg";
import { createElement as r, ReactElement } from "react";
import { Headline, Layout, LayoutSection, Stack } from "@servicetitan/design-system";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import { AppInit } from "../components/AppInit";
import { ChatCard } from "../components/ChatCard";

export const User = ({
  airgram,
  userId,
  navigate,
}: {
  airgram: Airgram;
  userId: number;
  navigate: Navigate;
}) =>
  pipe(
    useRemoteData(() =>
      pipe(
        getGroupsInCommon({ userId, offsetChatId: 0, limit: 100 }),
        RTE.map(({ chatIds }) => chatIds),
        RTE.chain(RTE.traverseArray(getChat)),
      )(airgram),
    ),
    RD.foldNoIdle(
      (): ReactElement => r(AppInit, undefined, undefined),
      (err) => r("div", undefined, JSON.stringify(err)),
      flow(
        RA.map((chat) =>
          r(
            ChatCard,
            {
              key: chat.id,
              chat,
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
            r(Headline, undefined, "User"),
            r(LayoutSection, undefined, r(Stack, { direction: "column", spacing: 1 }, el)),
          ),
      ),
    ),
  );
