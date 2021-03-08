import { Airgram } from "@airgram/web";
import { pipe } from "fp-ts/lib/function";
import { createElement as r } from "react";
import { destination, Destination, useNavigation } from "./screen/nav";
import { Supergroup as SupergroupScreen } from "./screen/Supergroup";
import { Chats as ChatsScreen } from "./screen/Chats";
import { User as UserScreen } from "./screen/User";

export const App = ({ airgram }: { airgram: Airgram }) =>
  pipe(useNavigation(), ({ current, next, back }) =>
    pipe(
      current,
      destination.match(
        {
          main: () => r(ChatsScreen, { airgram, next }),
          user: ({ userId }) => r(UserScreen, { airgram, userId, next, back }),
          supergroup: ({ supergroupId }) =>
            r(SupergroupScreen, { airgram, supergroupId, next, back }),
        },
        (_) => "Not supported screen",
      ),
    ),
  );
