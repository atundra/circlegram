import { pipe } from "fp-ts/function";
import { useEffect, useMemo, useReducer, useState } from "react";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as RD from "./remoteData";

export const useConst = <T>(f: () => T): T => useMemo(f, []);

export const useRemoteData = <E, A>(f: () => TE.TaskEither<E, A>): RD.RemoteData<E, A> => {
  const { reducer, initialState, action } = useConst(() => RD.create<E, A>());
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    if (state.state === "idle") {
      const task = pipe(
        () => dispatch(action.request()),
        TE.fromIO,
        TE.chain(() => f()),
        TE.fold(
          T.fromIOK((err) => () => {
            if (mounted) {
              dispatch(action.error(err));
            }
          }),
          T.fromIOK((a) => () => {
            if (mounted) {
              dispatch(action.load(a));
            }
          }),
        ),
      );

      task();
    }

    return () => {
      setMounted(false);
    };
  }, [state.state]);
  return state;
};
