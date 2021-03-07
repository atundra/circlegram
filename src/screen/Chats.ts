import { flow, pipe } from "fp-ts/function";
import { ReactElement, createElement as r } from "react";
import { useRemoteData } from "../hook";
import * as RD from "../remoteData";
import * as RA from "fp-ts/ReadonlyArray";
import { Headline, Layout, LayoutSection, Stack } from "@servicetitan/design-system";
import { Airgram } from "@airgram/web";
import { Navigate } from "./nav";
import * as RTE from "fp-ts/ReaderTaskEither";
import { getChat, getChats } from "../tg";
import { AppInit } from "../components/AppInit";
import { ChatCard } from "../components/ChatCard";

export const Chats = ({ airgram, navigate }: { airgram: Airgram; navigate: Navigate }) =>
  pipe(
    useRemoteData(() =>
      pipe(
        getChats({ offsetOrder: "9223372036854775807", limit: 20 }),
        RTE.map((cs) => cs.chatIds),
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
            r(Headline, undefined, "Chats"),
            r(LayoutSection, undefined, r(Stack, { direction: "column", spacing: 1 }, el)),
          ),
      ),
    ),
  );
