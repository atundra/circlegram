import { Airgram, Chat, Chats, MessageSenderUser } from "@airgram/web";
import { flow, pipe } from "fp-ts/function";
import { useRemoteData, useTEK } from "../hook";
import {
  getChat,
  getGroupsInCommon,
  getMe,
  getSupergroup,
  getSupergroupFullInfo,
  getSupergroupMembers,
} from "../tg";
import { Navigate } from "./nav";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as RM from "fp-ts/ReadonlyMap";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as Ord from "fp-ts/Ord";
import * as RD from "../remoteData";
import { ReactElement, createElement as r, Fragment, useState, useCallback, useRef } from "react";
import { Headline, Layout, LayoutSection, ProgressBar, Stack } from "@servicetitan/design-system";
import { UserCard } from "../components/UserCard";
import { BaseList } from "./BaseList";
import { HiddenErrorButton } from "../components/HiddenErrorButton";
import { messageSender } from "../adts";
import { Eq as EqNumber, Ord as OrdNumber } from "fp-ts/lib/number";

const constString = (s: string) => () => r("span", undefined, s);

type Props = {
  airgram: Airgram;
  supergroupId: number;
  next: Navigate;
  back: O.Option<IO.IO<void>>;
  chatId: number;
};

export const Supergroup = ({ airgram, supergroupId, chatId, next, back }: Props) => {
  const getChatRD = useTEK((chatId: number) => getChat(chatId)(airgram));
  const getSupergroupMembersRD = useTEK((supergroupId: number) =>
    getSupergroupMembers({ supergroupId, offset: 0, limit: 200 })(airgram),
  );
  const getChatsRD = useTEK(
    (chatIds: number[]) => TE.sequenceSeqArray(chatIds.map((chatId) => getChat(chatId)(airgram))),
    [],
    RA.getEq(EqNumber),
  );
  const getGroupsInCommonRD = useTEK(
    (userIds: number[]) =>
      TE.sequenceSeqArray(
        userIds.map((userId) =>
          getGroupsInCommon({ userId, limit: 100, offsetChatId: 0 })(airgram),
        ),
      ),
    [],
    RA.getEq(EqNumber),
  );

  const membersRD = getSupergroupMembersRD(supergroupId);

  const membersWithoutMeAndChatRD = pipe(
    RD.Do,
    RD.apS(
      "me",
      useRemoteData(() => getMe()(airgram)),
    ),
    RD.apS("chatMembers", membersRD),
    RD.map(({ me: { id: myId }, chatMembers: { members } }) =>
      members
        .map(({ memberId }) => memberId)
        .filter((a): a is MessageSenderUser => a._ === "messageSenderUser")
        .filter((cm) => cm.userId !== myId),
    ),
  );

  const groupIntersectionChats = (groupsInCommon: readonly Chats[]) =>
    pipe(
      groupsInCommon,
      RA.map((chats) => chats.chatIds),
      RA.reduce<number[], ReadonlyMap<number, number>>(new Map(), (acc, ids) =>
        pipe(
          ids,
          RA.reduce(acc, (acc, id) =>
            pipe(
              acc,
              RM.upsertAt(EqNumber)(
                id,
                pipe(
                  acc,
                  RM.lookup(EqNumber)(id),
                  O.getOrElse(() => 0),
                ) + 1,
              ),
            ),
          ),
        ),
      ),
      RM.collect(OrdNumber)((id, count) => ({ id, count })),
      RA.sort(
        pipe(
          OrdNumber,
          Ord.contramap(({ count }: { count: number }) => count),
          Ord.reverse,
        ),
      ),
    );

  const top3Intersections = pipe(
    membersWithoutMeAndChatRD,
    RD.chain((members) => getGroupsInCommonRD(members.map(({ userId }) => userId))),
    RD.map(groupIntersectionChats),
    RD.map((chats) => chats.filter((chat) => chat.id !== chatId)),
    RD.map((chats) => chats.slice(0, 3)),
    RD.bindTo("groupsInCommon"),
    RD.bind("commonChats", ({ groupsInCommon }) => getChatsRD(groupsInCommon.map(({ id }) => id))),
    RD.map(({ groupsInCommon, commonChats }) =>
      RA.zipWith(commonChats, groupsInCommon, (chat, { count }) => ({ chat, count })),
    ),
  );

  const firstItem = pipe(
    top3Intersections,
    RD.foldNoIdle(
      () => r("div", {}, "loading..."),
      (err) => r("div", undefined, JSON.stringify(err)),
      (chatsWithCounts) =>
        r(
          "div",
          {},
          chatsWithCounts.map(({ chat, count }) =>
            r("div", { key: chat.id }, `${chat.title}: ${count} members`),
          ),
        ),
    ),
  );

  return r(BaseList, {
    back,
    header: pipe(
      getChatRD(chatId),
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
        (chat) => r("span", undefined, `Supergroup ${chat.title}`),
      ),
    ),
    content: pipe(
      membersRD,
      RD.map(({ members }) => members.map((m) => m.memberId)),
      RD.foldNoIdle(
        (): ReactElement => r(ProgressBar, { indeterminate: true, position: "top" }, undefined),
        (err) => r("div", undefined, JSON.stringify(err)),
        flow(
          RA.map((sender) =>
            pipe(
              sender,
              messageSender.match({
                messageSenderChat: ({ chatId }) => r("div", {}, "Sender is a chat"),
                messageSenderUser: ({ userId }) =>
                  r(
                    "div",
                    { key: userId },
                    r(UserCard, {
                      key: userId,
                      userId,
                      airgram,
                      next,
                    }),
                  ),
              }),
            ),
          ),
          (el) => r(Fragment, {}, RA.prepend(r("div", { key: "top3" }, firstItem))(el)),
        ),
      ),
    ),
  });
};
