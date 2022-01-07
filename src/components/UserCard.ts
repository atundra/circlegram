import { Airgram } from "@airgram/web";
import { pipe } from "fp-ts/function";
import { Navigate } from "../screen/nav";
import * as O from "fp-ts/Option";
import { useRemoteData } from "../hook";
import * as RD from "../remoteData";
import { getGroupsInCommon, getMe, getUser, getUserFullInfo, readFile } from "../tg";
import { createElement as r, FunctionComponentElement } from "react";
import {
  Avatar,
  AvatarPropsStrict,
  BodyText,
  Card,
  Headline,
  Spinner,
  Stack,
  StackItem,
} from "@servicetitan/design-system";
import * as RTE from "fp-ts/ReaderTaskEither";
import { HiddenErrorButton } from "./HiddenErrorButton";
import { UserAction } from "./UserAction";

export const UserCard = ({
  airgram,
  userId,
  next,
}: {
  airgram: Airgram;
  userId: number;
  next: Navigate;
}) =>
  pipe(
    useRemoteData(() =>
      pipe(
        RTE.Do,
        RTE.apS("userFullInfo", getUserFullInfo({ userId })),
        RTE.apS("user", getUser({ userId })),
        RTE.apS("me", getMe()),
        RTE.bind("photoUrl", ({ user }) =>
          pipe(
            user.profilePhoto,
            O.fromNullable,
            O.fold(
              () => RTE.of(O.none),
              (p) =>
                pipe(
                  p.small,
                  readFile,
                  RTE.map(({ data }) => URL.createObjectURL(data)),
                  RTE.map(O.some),
                ),
            ),
          ),
        ),
      )(airgram),
    ),
    RD.foldNoIdle(
      () => r(Spinner, { size: "tiny" }),
      (err): FunctionComponentElement<any> =>
        r(HiddenErrorButton, { title: "Error", text: JSON.stringify(err) }),
      (data) =>
        r(
          Card,
          { padding: "thin" },
          r(
            Stack,
            { alignItems: "center", spacing: 4 },
            r(
              Avatar,
              pipe(
                data.photoUrl,
                O.fold<string, AvatarPropsStrict>(
                  () => ({ name: `${data.user.firstName} ${data.user.lastName}` }),
                  (image) => ({ image }),
                ),
              ),
            ),
            r(
              StackItem,
              { fill: true },
              r(Headline, { size: "small" }, `${data.user.firstName} ${data.user.lastName}`),
              r(BodyText, { subdued: true, size: "small" }, data.userFullInfo.bio),
            ),
            data.me.id !== userId && r(UserAction, { userId, next, airgram }),
          ),
        ),
    ),
  );
