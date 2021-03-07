import * as IO from "fp-ts/IO";
import { makeADT, ofType } from "@morphic-ts/adt";

type DestinationMain = { type: "main" };

type DestinationUser = {
  type: "user";
  userId: number;
};

type DestinationSupergroup = {
  type: "supergroup";
  supergroupId: number;
};

export type Destination = DestinationUser | DestinationMain | DestinationSupergroup;

export type Navigate = (d: Destination) => IO.IO<void>;

export const destination = makeADT("type")({
  main: ofType<DestinationMain>(),
  user: ofType<DestinationUser>(),
  supergroup: ofType<DestinationSupergroup>(),
});
