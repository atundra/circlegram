import { Airgram, Chat } from "@airgram/web";
import { constUndefined, flow, pipe } from "fp-ts/lib/function";
import {
  ClassAttributes,
  createElement as r,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import * as RD from "./remoteData";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { downloadFile, getChat, getChats, readFilePart } from "./tg";
import {
  Avatar,
  AvatarPropsStrict,
  Card,
  Headline,
  Layout,
  LayoutSection,
  Mask,
  ProgressBar,
  Stack,
  StackItem,
} from "@servicetitan/design-system";

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

const ChatCard = ({ chat, airgram }: { chat: Chat; airgram: Airgram }) =>
  pipe(
    O.fromNullable(chat.photo),
    O.fold(
      () => RD.idle,
      (cpi) =>
        useRemoteData(() =>
          pipe(
            cpi.small.local.canBeDownloaded && cpi.small.local.isDownloadingCompleted === false
              ? pipe(
                  downloadFile({
                    priority: 1,
                    offset: 0,
                    synchronous: true,
                    limit: 0,
                    fileId: cpi.small.id,
                  }),
                  RTE.chain(() => RTE.of(undefined)),
                )
              : RTE.of(undefined),
            RTE.chain(() => readFilePart({ fileId: cpi.small.id, count: 0, offset: 0 })),
          )(airgram),
        ),
    ),
    RD.foldNoIdle(
      () => O.none,
      () => O.none,
      (fp) => O.some(URL.createObjectURL(fp.data)),
    ),
    (image) =>
      r(
        Card,
        { key: chat.id },
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
          chat.title,
        ),
      ),
  );

// <Mask
// content={
//     <div className="m-t-1 m-b-1" style={{ textAlign: 'center' }}>
//         <ProgressBar indeterminate position='top' small />
//         <div className="m-b-2">
//             <img src="/images/pricebook-illustration.svg" />
//         </div>
//         <Headline size="small" className="m-b-1">Adding to Pricebook...</Headline>
//         <BodyText size="small">You can navigate away from this page and this process will continue.</BodyText>
//     </div>
// }
// >
// <div style={{ height: '300px' }}></div>
// </Mask>

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

export const App = ({ airgram }: { airgram: Airgram }) =>
  pipe(
    useRemoteData(() => getData()(airgram)),
    RD.foldNoIdle(
      (): ReactElement => r(AppInit, undefined, undefined),
      (err) => r("div", undefined, String(err)),
      flow(
        RA.map((chat) => r(ChatCard, { key: chat.id, chat, airgram }, undefined)),
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
