import { flow, pipe } from "fp-ts/function";
import { ReactElement, createElement as r, useState } from "react";
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
import * as IO from "fp-ts/IO";
// import InfiniteLoader from "react-window-infinite-loader";
// import { FixedSizeList } from "react-window";

export const Chats = ({ airgram, next }: { airgram: Airgram; next: Navigate }) =>
  pipe(
    useRemoteData(() =>
      pipe(
        getChats({ /* offsetOrder: "9223372036854775807", */ limit: 20 }),
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
              next,
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

// export const Chats1 = ({ airgram, next }: { airgram: Airgram; next: Navigate }) =>
//   pipe(
//     RD.Do,
//     RD.apS("items", RD.of(useState([]))),
//     RD.apS(
//       "chats",
//       useRemoteData(() =>
//         getChats({ /* offsetOrder: "9223372036854775807", */ limit: 20 })(airgram),
//       ),
//     ),
//     RD.foldNoIdle(
//       (): ReactElement => r(AppInit, undefined, undefined),
//       (err) => r("div", undefined, JSON.stringify(err)),
//       ({ items, chats }) =>
//         r(InfiniteLoader, {
//           isItemLoaded: (index) => index <= items[0].length,
//           itemCount: chats.totalCount,
//           loadMoreItems: (startIndex, stopIndex) => {
//             console.log(startIndex, stopIndex);
//             console.log(chats);
//             return Promise.resolve();
//           },
//           children: ({ onItemsRendered, ref }) =>
//             r(FixedSizeList, {
//               itemCount: chats.totalCount,
//               onItemsRendered,
//               height: 123,
//               itemSize: 24,
//               width: 300,
//               ref,
//               children: ({ style, index }) => r("div", { style }, JSON.stringify(index)),
//             }),
//         }),
//     ),
//   );

// // const lazyStore =
// type LazyStore<A> = {
//   items: A[];
//   load: (start: number, end: number) => Promise<void>;
// };
