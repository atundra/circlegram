import { Airgram } from "@airgram/web";
import { pipe } from "fp-ts/function";
import { Navigate } from "../screen/nav";
import { useRemoteData } from "../hook";
import * as RD from "../remoteData";
import { getGroupsInCommon } from "../tg";
import { createElement as r, FunctionComponentElement } from "react";
import { Button } from "@servicetitan/design-system";
import { HiddenErrorButton } from "./HiddenErrorButton";

export const UserAction = ({
  airgram,
  userId,
  next,
}: {
  airgram: Airgram;
  userId: number;
  next: Navigate;
}) =>
  pipe(
    useRemoteData(() => getGroupsInCommon({ userId, offsetChatId: 0, limit: 100 })(airgram)),
    RD.foldNoIdle(
      () => r(Button, { loading: true }, "0 common groups"),
      (err): FunctionComponentElement<any> =>
        r(HiddenErrorButton, { title: "Error", text: JSON.stringify(err) }),
      (chats) =>
        r(
          Button,
          {
            primary: chats.totalCount > 0,
            inactive: chats.totalCount === 0,
            onClick: () => next({ type: "user", userId })(),
          },
          `${chats.totalCount} common groups`,
        ),
    ),
  );
