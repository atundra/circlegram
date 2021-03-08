import { Chat } from "@airgram/core";
import { Airgram } from "@airgram/web";
import { constUndefined, pipe } from "fp-ts/function";
import { createElement as r, FunctionComponentElement } from "react";
import { chatType } from "../adts";
import { useRemoteData } from "../hook";
import { Navigate } from "../screen/nav";
import { getBasicGroupFullInfo, getChat, getGroupsInCommon, getSupergroupFullInfo } from "../tg";
import * as RD from "../remoteData";
import { Button, Stack } from "@servicetitan/design-system";
import { HiddenErrorButton } from "./HiddenErrorButton";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as O from "fp-ts/Option";
import { UserAction } from "./UserAction";

const constButton = (s: string) => () => r(Button, { inactive: true }, s);

export const ChatAction = ({
  chat,
  airgram,
  next,
}: {
  chat: Chat;
  airgram: Airgram;
  next: Navigate;
}) =>
  pipe(
    chat.type,
    chatType.match({
      chatTypePrivate: ({ userId }) => r(UserAction, { airgram, userId, next }),
      chatTypeBasicGroup: ({ basicGroupId }) =>
        pipe(
          useRemoteData(() => getBasicGroupFullInfo({ basicGroupId })(airgram)),
          RD.foldNoIdle(
            () => r(Button, { loading: true }, "0 members"),
            (err): FunctionComponentElement<any> =>
              r(HiddenErrorButton, { title: "Error", text: String(err) }),
            (bgfi) =>
              r(
                Button,
                { primary: bgfi.members.length !== 0, inactive: bgfi.members.length === 0 },
                `${bgfi.members.length} members`,
              ),
          ),
        ),
      chatTypeSupergroup: ({ supergroupId, isChannel }) =>
        pipe(
          useRemoteData(() =>
            pipe(
              RTE.Do,
              RTE.bind("sfi", () => getSupergroupFullInfo({ supergroupId })),
              RTE.bind("linkedChat", ({ sfi }) =>
                pipe(
                  isChannel ? O.some(sfi.linkedChatId) : O.none,
                  O.filter((id) => id !== 0),
                  O.fold(
                    () => RTE.of(O.none),
                    (chatId) =>
                      pipe(
                        getChat(chatId),
                        RTE.chain((chat) =>
                          pipe(
                            chat.type,
                            chatType.match(
                              {
                                chatTypeBasicGroup: ({ basicGroupId }) =>
                                  pipe(
                                    getBasicGroupFullInfo({ basicGroupId }),
                                    RTE.map((bgfi) => O.some(bgfi.members.length)),
                                  ),
                                chatTypeSupergroup: ({ supergroupId }) =>
                                  pipe(
                                    getSupergroupFullInfo({ supergroupId }),
                                    RTE.map((sfi) => O.some(sfi.memberCount)),
                                  ),
                              },
                              () => RTE.of(O.none),
                            ),
                          ),
                        ),
                      ),
                  ),
                ),
              ),
            )(airgram),
          ),
          RD.foldNoIdle(
            () => r(Button, { loading: true }, "0 members"),
            (err): FunctionComponentElement<any> =>
              // REPLACE STRINGIFY WITH SHOOW INSTANCE
              r(HiddenErrorButton, { title: "Error", text: JSON.stringify(err) }),
            ({ sfi, linkedChat }) =>
              r(
                Stack,
                { spacing: 1 },
                r(
                  Button,
                  {
                    primary: sfi.canGetMembers,
                    inactive: !sfi.canGetMembers,
                    onClick: () => next({ type: "supergroup", supergroupId })(),
                  },
                  `${sfi.memberCount} members`,
                ),
                pipe(
                  linkedChat,
                  O.fold(constUndefined, (members) =>
                    r(
                      Button,
                      {
                        primary: true,
                        iconName: "comment",
                        onClick: () =>
                          next({ type: "supergroup", supergroupId: sfi.linkedChatId })(),
                      },
                      members,
                    ),
                  ),
                ),
              ),
          ),
        ),
      chatTypeSecret: constButton("Secret chat"),
    }),
  );
