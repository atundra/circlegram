import { Chat } from "@airgram/core";
import { Airgram } from "@airgram/web";
import { pipe } from "fp-ts/function";
import { Navigate } from "../screen/nav";
import * as O from "fp-ts/Option";
import { useRemoteData } from "../hook";
import * as RD from "../remoteData";
import { readFile } from "../tg";
import { createElement as r } from "react";
import {
  Avatar,
  AvatarPropsStrict,
  BodyText,
  Card,
  Headline,
  Stack,
  StackItem,
} from "@servicetitan/design-system";
import { messageContent } from "../adts";
import { ChatAction } from "./ChatAction";

const cropText = (s: string) => (s.length > 32 ? s.slice(0, 31) + "…" : s);

export const ChatCard = ({
  chat,
  airgram,
  next,
}: {
  chat: Chat;
  airgram: Airgram;
  next: Navigate;
}) =>
  pipe(
    O.fromNullable(chat.photo),
    O.fold(
      () => RD.idle,
      (cpi) => useRemoteData(() => readFile(cpi.small)(airgram)),
    ),
    RD.foldNoIdle(
      () => O.none,
      () => O.none,
      (fp) => O.some(URL.createObjectURL(fp.data)),
    ),
    (image) =>
      r(
        Card,
        { key: chat.id, padding: "thin" },
        r(
          Stack,
          { alignItems: "center", spacing: 4 },
          r(
            Avatar,
            pipe(
              image,
              O.fold<string, AvatarPropsStrict>(
                () => ({ name: chat.title }),
                (image) => ({ image }),
              ),
            ),
          ),
          r(
            StackItem,
            { fill: true },
            r(Headline, { size: "small" }, chat.title),
            r(
              BodyText,
              { subdued: true, size: "small" },
              pipe(
                chat.lastMessage,
                O.fromNullable,
                O.fold(
                  () => "No messages",
                  (m) =>
                    pipe(
                      m.content,
                      messageContent.match(
                        { messageText: (mt) => cropText(mt.text.text) },
                        (_) => "Media",
                      ),
                    ),
                ),
              ),
            ),
          ),
          r(ChatAction, { airgram, chat, next }, undefined),
        ),
      ),
  );
