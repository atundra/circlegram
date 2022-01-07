import * as IO from "fp-ts/IO";
import { makeADT, ofType } from "@morphic-ts/adt";
import * as RA from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import { pipe } from "fp-ts/lib/function";
import { useState } from "react";
import { Chat } from "@airgram/web";

type DestinationMain = { type: "main" };

type DestinationUser = {
  type: "user";
  userId: number;
};

type DestinationSupergroup = {
  type: "supergroup";
  supergroupId: number;
  chatId: number;
};

export type Destination = DestinationUser | DestinationMain | DestinationSupergroup;

export type Navigate = (d: Destination) => IO.IO<void>;

export const destination = makeADT("type")({
  main: ofType<DestinationMain>(),
  user: ofType<DestinationUser>(),
  supergroup: ofType<DestinationSupergroup>(),
});

export const useNavigation = (): {
  current: Destination;
  back: O.Option<IO.IO<void>>;
  next: Navigate;
} =>
  pipe(
    useState<RNEA.ReadonlyNonEmptyArray<Destination>>(RNEA.of({ type: "main" })),
    ([navStack, setNavStack]) => ({
      current: RNEA.head(navStack),
      back: pipe(
        navStack,
        RNEA.tail,
        RNEA.fromReadonlyArray,
        O.fold(
          () => O.none,
          (newNavStack) => O.some(() => setNavStack(newNavStack)),
        ),
      ),
      next: (d) => () => setNavStack((navStack) => RNEA.cons(d, navStack)),
    }),
  );
