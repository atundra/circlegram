import { Airgram } from "@airgram/web";
import { pipe } from "fp-ts/lib/function";
import { createElement as r, useState } from "react";
import { destination, Destination } from "./screen/nav";
import { Supergroup as SupergroupScreen } from "./screen/Supergroup";
import { Chats as ChatsScreen } from "./screen/Chats";
import { User as UserScreen } from "./screen/User";

export const App = ({ airgram }: { airgram: Airgram }) =>
  pipe(
    useState<Destination>({ type: "main" }),
    ([d, setD]) =>
      pipe(
        d,
        destination.match(
          {
            main: () => r(ChatsScreen, { airgram, navigate: (d) => () => setD(d) }),
            user: ({ userId }) =>
              r(UserScreen, { airgram, userId, navigate: (d) => () => setD(d) }),
            supergroup: ({ supergroupId }) =>
              r(SupergroupScreen, { airgram, supergroupId, navigate: (d) => () => setD(d) }),
          },
          (_) => "asdf",
        ),
      ),
  );
