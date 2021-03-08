import { Airgram } from "@airgram/web";
import { pipe } from "fp-ts/function";
import { Navigate } from "../screen/nav";
import { useRemoteData } from "../hook";
import * as RD from "../remoteData";
import { getChat, getGroupsInCommon, getUser } from "../tg";
import { createElement as r, Fragment, ReactElement } from "react";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import { AppInit } from "../components/AppInit";
import { ChatCard } from "../components/ChatCard";
import { HiddenErrorButton } from "../components/HiddenErrorButton";
import { BaseList } from "./BaseList";

const constString = (s: string) => () => r("span", undefined, s);

export const User = ({
  airgram,
  userId,
  next,
  back,
}: {
  airgram: Airgram;
  userId: number;
  next: Navigate;
  back: O.Option<IO.IO<void>>;
}) =>
  r(BaseList, {
    back,
    header: pipe(
      useRemoteData(() => getUser({ userId })(airgram)),
      RD.foldNoIdle(
        constString("User"),
        (err) =>
          r(
            "span",
            {},
            "User",
            " ",
            r(HiddenErrorButton, { title: "User loading error", text: JSON.stringify(err) }),
          ),
        (user) => r("span", undefined, `User ${user.firstName} ${user.lastName}`),
      ),
    ),
    content: pipe(
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
        (chats) =>
          r(
            Fragment,
            {},
            pipe(
              chats,
              RA.map((chat) =>
                r(
                  ChatCard,
                  {
                    key: chat.id,
                    chat,
                    airgram,
                    next,
                  },
                  undefined,
                ),
              ),
            ),
          ),
      ),
    ),
  });
