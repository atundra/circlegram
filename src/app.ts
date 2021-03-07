import {
  Airgram,
  Chat,
  ChatPhotoInfo,
  ChatTypeBasicGroup,
  ChatTypePrivate,
  ChatTypeSecret,
  ChatTypeSupergroup,
  ChatTypeUnion,
  Error as TgError,
  File,
  FilePart,
  MessageContentUnion,
  MessageText,
} from "@airgram/web";
import { absurd, constUndefined, flow, pipe } from "fp-ts/lib/function";
import {
  ClassAttributes,
  createElement as r,
  FunctionComponent,
  FunctionComponentElement,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import * as RD from "./remoteData";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as IO from "fp-ts/IO";
import {
  downloadFile,
  getBasicGroupFullInfo,
  getChat,
  getChats,
  getGroupsInCommon,
  getSupergroupFullInfo,
  getSupergroupMembers,
  getUser,
  getUserFullInfo,
  readFilePart,
} from "./tg";
import {
  Avatar,
  AvatarPropsStrict,
  BodyText,
  Button,
  Card,
  Dialog,
  Headline,
  Layout,
  LayoutSection,
  Mask,
  ProgressBar,
  Spinner,
  Stack,
  StackItem,
} from "@servicetitan/design-system";
import { messageContent } from "./adts";
import { inspect } from "./utils";
import { makeADT, ofType } from "@morphic-ts/adt";
import { sequenceS } from "fp-ts/lib/Apply";

export const useConst = <T>(f: () => T): T => useMemo(f, []);

export const useRemoteData = <E, A>(f: () => TE.TaskEither<E, A>): RD.RemoteData<E, A> => {
  const { reducer, initialState, action } = useConst(() => RD.create<E, A>());
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    if (state.state === "idle") {
      const task = pipe(
        () => dispatch(action.request()),
        TE.fromIO,
        TE.chain(() => f()),
        TE.fold(
          T.fromIOK((err) => () => dispatch(action.error(err))),
          T.fromIOK((a) => () => dispatch(action.load(a))),
        ),
      );

      task();
    }
  }, [state.state]);
  return state;
};

const div = (a?: HTMLAttributes<"div"> & ClassAttributes<"div">) => (...c: ReactNode[]) =>
  r("div", a, ...c);

const matchChatType = <A>(
  onPrivate: (c: ChatTypePrivate) => A,
  onBasicGroup: (c: ChatTypeBasicGroup) => A,
  onSuperGroup: (c: ChatTypeSupergroup) => A,
  onSecret: (c: ChatTypeSecret) => A,
) => (type: ChatTypeUnion): A => {
  switch (type._) {
    case "chatTypePrivate":
      return onPrivate(type);
    case "chatTypeBasicGroup":
      return onBasicGroup(type);
    case "chatTypeSupergroup":
      return onSuperGroup(type);
    case "chatTypeSecret":
      return onSecret(type);
    default:
      return absurd(type);
  }
};

const constButton = (s: string) => () => r(Button, { inactive: true }, s);

const HiddenErrorButton = ({ title, text }: { title: string; text: string }) =>
  pipe(useState(false), ([open, setOpen]) =>
    r(
      "div",
      {},
      r(Button, { negative: true, iconName: "error", onClick: () => setOpen((open) => !open) }),
      r(
        Dialog,
        {
          open,
          title,
          onPrimaryActionClick: () => setOpen((open) => !open),
          primaryActionName: "Ok",
        },
        text,
      ),
    ),
  );

type DestinationMain = { type: "main" };

type DestinationUser = {
  type: "user";
  userId: number;
};

type DestinationSupergroup = {
  type: "supergroup";
  supergroupId: number;
};

type Destination = DestinationUser | DestinationMain | DestinationSupergroup;

type Navigate = (d: Destination) => IO.IO<void>;

const ChatAction = ({
  chat,
  airgram,
  navigate,
}: {
  chat: Chat;
  airgram: Airgram;
  navigate: Navigate;
}) =>
  pipe(
    chat.type,
    matchChatType<ReactElement>(
      ({ userId }) =>
        pipe(
          useRemoteData(() => getGroupsInCommon({ userId, offsetChatId: 0, limit: 100 })(airgram)),
          RD.foldNoIdle(
            () => r(Button, { loading: true }, "0 common groups"),
            (err): FunctionComponentElement<any> =>
              r(HiddenErrorButton, { title: "Error", text: String(err) }),
            (chats) =>
              r(
                Button,
                { primary: true, onClick: () => navigate({ type: "user", userId })() },
                `${chats.totalCount} common groups`,
              ),
          ),
        ),
      ({ basicGroupId }) =>
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
      ({ supergroupId, isChannel }) =>
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
                            matchChatType(
                              () => RTE.of(O.none),
                              ({ basicGroupId }) =>
                                pipe(
                                  getBasicGroupFullInfo({ basicGroupId }),
                                  RTE.map((bgfi) => O.some(bgfi.members.length)),
                                ),
                              ({ supergroupId }) =>
                                pipe(
                                  getSupergroupFullInfo({ supergroupId }),
                                  RTE.map((sfi) => O.some(sfi.memberCount)),
                                ),
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
                    onClick: () => navigate({ type: "supergroup", supergroupId })(),
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
                          navigate({ type: "supergroup", supergroupId: sfi.linkedChatId })(),
                      },
                      members,
                    ),
                  ),
                ),
              ),
          ),
        ),
      constButton("Secret chat"),
    ),
  );

const readFile = (file: File): RTE.ReaderTaskEither<Airgram, Error | TgError, FilePart> =>
  pipe(
    // Download chat photo if needed
    file.local.canBeDownloaded && file.local.isDownloadingCompleted === false
      ? pipe(
          downloadFile({
            priority: 1,
            offset: 0,
            synchronous: true,
            limit: 0,
            fileId: file.id,
          }),
          RTE.chain(() => RTE.of(undefined)),
        )
      : RTE.of(undefined),

    // And read it from fs
    RTE.chain(() => readFilePart({ fileId: file.id, count: 0, offset: 0 })),
  );

const cropText = (s: string) => (s.length > 32 ? s.slice(0, 31) + "…" : s);

const ChatCard = ({
  chat,
  airgram,
  navigate,
}: {
  chat: Chat;
  airgram: Airgram;
  navigate: Navigate;
}) =>
  pipe(
    O.fromNullable(chat.photo),
    (a) => {
      console.log(chat);
      return a;
    },
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
          r(ChatAction, { airgram, chat, navigate }, undefined),
        ),
      ),
  );

const AppInit = () =>
  r(
    Mask,
    {
      content: div({ className: "m-t-1 m-b-1", style: { textAlign: "center" } })(
        r(ProgressBar, { indeterminate: true, position: "top", small: true }, undefined),
        r(Headline, { size: "small", className: "m-b-1" }, "Initializing the app..."),
      ),
    },
    r("div", { style: { height: "100vh" } }),
  );

const getData = () =>
  pipe(
    getChats({ offsetOrder: "9223372036854775807", limit: 20 }),
    RTE.map((cs) => cs.chatIds),
    RTE.chain(RTE.traverseArray(getChat)),
  );

const destination = makeADT("type")({
  main: ofType<DestinationMain>(),
  user: ofType<DestinationUser>(),
  supergroup: ofType<DestinationSupergroup>(),
});

export const Main = ({ airgram, navigate }: { airgram: Airgram; navigate: Navigate }) =>
  pipe(
    useRemoteData(() => getData()(airgram)),
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
    inspect,
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

const UserAction = ({
  airgram,
  userId,
  navigate,
}: {
  airgram: Airgram;
  userId: number;
  navigate: Navigate;
}) =>
  pipe(
    useRemoteData(() => getGroupsInCommon({ userId, offsetChatId: 0, limit: 100 })(airgram)),
    RD.foldNoIdle(
      () => r(Button, { loading: true }, "0 common groups"),
      (err): FunctionComponentElement<any> =>
        r(HiddenErrorButton, { title: "Error", text: String(err) }),
      (chats) =>
        r(
          Button,
          { primary: true, onClick: () => navigate({ type: "user", userId })() },
          `${chats.totalCount} common groups`,
        ),
    ),
  );

const UserCard = ({
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
        RTE.Do,
        RTE.apS("userFullInfo", getUserFullInfo({ userId })),
        RTE.apS("user", getUser({ userId })),
        RTE.apS("commonGroups", getGroupsInCommon({ userId, offsetChatId: 0, limit: 100 })),
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
            r(UserAction, { userId, navigate, airgram }),
          ),
        ),
    ),
  );

//     r(
//       Card,
//       { key: chat.id, padding: "thin" },
//       r(
//         Stack,
//         { alignItems: "center", spacing: 4 },
//         r(
//           Avatar,
//           pipe(
//             image,
//             O.fold<string, AvatarPropsStrict>(
//               () => ({ name: chat.title }),
//               (image) => ({ image }),
//             ),
//           ),
//         ),
//         r(
//           StackItem,
//           { fill: true },
//           r(Headline, { size: "small" }, chat.title),
//           r(
//             BodyText,
//             { subdued: true, size: "small" },
//             pipe(
//               chat.lastMessage,
//               O.fromNullable,
//               O.fold(
//                 () => "No messages",
//                 (m) =>
//                   pipe(
//                     m.content,
//                     messageContent.match(
//                       { messageText: (mt) => cropText(mt.text.text) },
//                       (_) => "Media",
//                     ),
//                   ),
//               ),
//             ),
//           ),
//         ),
//         r(ChatAction, { airgram, chat, navigate }, undefined),
//       ),
//     ),
// )

export const Supergroup = ({
  airgram,
  supergroupId,
  navigate,
}: {
  airgram: Airgram;
  supergroupId: number;
  navigate: Navigate;
}) =>
  pipe(
    useRemoteData(() =>
      pipe(
        getSupergroupMembers({ supergroupId, offset: 0, limit: 200 }),
        RTE.map((a) => a.members),
        RTE.map(RA.map((a) => a.userId)),
      )(airgram),
    ),
    inspect,
    RD.foldNoIdle(
      (): ReactElement => r(AppInit, undefined, undefined),
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

export const App = ({ airgram }: { airgram: Airgram }) =>
  pipe(
    useState<Destination>({ type: "main" }),
    ([d, setD]) =>
      pipe(
        d,
        destination.match({
          main: () => r(Main, { airgram, navigate: (d) => () => setD(d) }),
          user: ({ userId }) => r(User, { airgram, userId, navigate: (d) => () => setD(d) }),
          supergroup: ({ supergroupId }) =>
            r(Supergroup, { airgram, supergroupId, navigate: (d) => () => setD(d) }),
        }),
      ),
  );
