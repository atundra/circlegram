import { pipe } from "fp-ts/function";
import { DependencyList, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as RD from "./remoteData";
import { Eq } from "fp-ts/lib/Eq";

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

const emptyDeps: DependencyList = [];

export const useTEK = <I, E, A>(
  f: (i: I) => TE.TaskEither<E, A>,
  deps?: DependencyList,
  eq?: Eq<I>,
): ((i: I) => RD.RemoteData<E, A>) => {
  const memoizedF = useCallback(f, deps ?? emptyDeps);

  const { reducer, initialState, action } = useConst(() => RD.create<E, A>());
  const [state, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = useState<I | null>(null);
  useEffect(() => {
    if (input !== null) {
      dispatch(action.request());
    }
  }, [input, memoizedF]);
  useEffect(() => {
    if (state.state === "loading" && input !== null) {
      const task = pipe(
        memoizedF(input),
        TE.fold(
          T.fromIOK((err) => () => dispatch(action.error(err))),
          T.fromIOK((a) => () => dispatch(action.load(a))),
        ),
      );

      task();
    }
  }, [state.state, memoizedF]);
  return useCallback(
    (i) => {
      if (input === null) {
        setInput(i);
      } else {
        const equal = eq ? eq.equals(i, input) : i === input;
        if (!equal) {
          setInput(i);
        }
      }

      return state;
    },
    [setInput, input, state],
  );
};
