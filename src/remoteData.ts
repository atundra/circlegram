import { Lazy, absurd, pipe, flow } from "fp-ts/lib/function";
import { Functor2 } from "fp-ts/lib/Functor";
import { Monad2 } from "fp-ts/lib/Monad";
import { Applicative2 } from "fp-ts/lib/Applicative";

/* eslint-disable @typescript-eslint/naming-convention */
// fp-ts uses nonconvential naming so disable the rule

/**
 * @category instances
 */
export const URI = "RemoteData";

/**
 * @category instances
 */
export type URI = typeof URI;

declare module "fp-ts/lib/HKT" {
  interface URItoKind2<E, A> {
    readonly [URI]: RemoteData<E, A>;
  }
}

type Idle = {
  state: "idle";
};

type Loading = {
  state: "loading";
};

type Fail<E> = {
  state: "error";
  error: E;
};

type Loaded<A> = {
  state: "loaded";
  data: A;
};

export type RemoteData<E, A> = Idle | Loading | Fail<E> | Loaded<A>;

const empty: Idle = {
  state: "idle",
};

const loaded = <A>(a: A): RemoteData<never, A> => ({
  state: "loaded",
  data: a,
});

export const idle = empty;

/**
 * @category Functor
 */
export const map: <E, A, B>(f: (a: A) => B) => (rd: RemoteData<E, A>) => RemoteData<E, B> = (f) => (
  rd,
) =>
  rd.state === "loaded"
    ? {
        state: "loaded",
        data: f(rd.data),
      }
    : rd;

/**
 * Application rule
 *
 * |fa       |fb       |ap fa fb         |
 * |---------|---------|-----------------|
 * |idle     |error eb |error eb         |
 * |idle     |*        |idle             |
 * |loading  |idle     |idle             |
 * |loading  |error eb |error eb         |
 * |loading  |*        |loading          |
 * |error ea |error eb |error eb         |
 * |error ea |*        |error ea         |
 * |loaded ta|loaded tb|loaded (ap ta tb)|
 * |loaded ta|idle     |idle             |
 * |loaded ta|loading  |loading          |
 * |loaded ta|error eb |error eb         |
 */

/**
 * Less strict version of [`ap`](#ap).
 *
 * @category Apply
 */
export const apW = <D, A>(fa: RemoteData<D, A>) => <E, B>(
  fab: RemoteData<E, (a: A) => B>,
): RemoteData<D | E, B> => {
  switch (fab.state) {
    case "idle":
      return fa.state === "error" ? fa : idle;
    case "loading":
      return fa.state === "loading" ? fa : fa.state === "loaded" ? fab : fa;
    case "error":
      return fa.state === "error" ? fa : fab;
    case "loaded":
      return fa.state === "loaded" ? pipe(fa, map(fab.data)) : fa;
    default:
      return absurd(fab);
  }
};

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 */
export const ap: <E, A>(
  fa: RemoteData<E, A>,
) => <B>(fab: RemoteData<E, (a: A) => B>) => RemoteData<E, B> = apW;

/**
 * Wrap a value into the type constructor.
 *
 * @category Applicative
 */
export const of: Applicative2<URI>["of"] = loaded;

/**
 * Less strict version of [`chain`](#chain).
 *
 * @category Monad
 */
export const chainW = <D, A, B>(f: (a: A) => RemoteData<D, B>) => <E>(
  ma: RemoteData<E, A>,
): RemoteData<D | E, B> => (ma.state === "loaded" ? f(ma.data) : ma);

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation.
 *
 * @category Monad
 */
export const chain: <E, A, B>(
  f: (a: A) => RemoteData<E, B>,
) => (ma: RemoteData<E, A>) => RemoteData<E, B> = chainW;

// -------------------------------------------------------------------------------------
// do notation
// -------------------------------------------------------------------------------------

export const Do: RemoteData<never, {}> = of({});

export const bindTo = <N extends string>(
  name: N,
): (<E, A>(fa: RemoteData<E, A>) => RemoteData<E, { [K in N]: A }>) => map(bindTo_(name));

/**
 * @since 2.8.0
 */
export const bindW = <N extends string, A, D, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => RemoteData<D, B>,
): (<E>(
  fa: RemoteData<E, A>,
) => RemoteData<D | E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }>) =>
  chainW((a) =>
    pipe(
      f(a),
      map((b) => bind_(a, name, b)),
    ),
  );

/**
 * @since 2.8.0
 */
export const bind: <N extends string, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => RemoteData<E, B>,
) => (
  fa: RemoteData<E, A>,
) => RemoteData<E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bindW;

// -------------------------------------------------------------------------------------
// pipeable sequence S
// -------------------------------------------------------------------------------------

/**
 * @since 2.8.0
 */
export const apSW = <A, N extends string, D, B>(
  name: Exclude<N, keyof A>,
  fb: RemoteData<D, B>,
): (<E>(
  fa: RemoteData<E, A>,
) => RemoteData<D | E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }>) =>
  flow(
    map((a) => (b: B) => bind_(a, name, b)),
    apW(fb),
  );

/**
 * @since 2.8.0
 */
export const apS: <A, N extends string, E, B>(
  name: Exclude<N, keyof A>,
  fb: RemoteData<E, B>,
) => (
  fa: RemoteData<E, A>,
) => RemoteData<E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = apSW;

/**
 * @category destructors
 */
export const fold = <E, A, T>(
  onIdle: Lazy<T>,
  onLoading: Lazy<T>,
  onError: (e: E) => T,
  onLoaded: (a: A) => T,
) => (rd: RemoteData<E, A>): T => {
  switch (rd.state) {
    case "idle":
      return onIdle();
    case "loading":
      return onLoading();
    case "error":
      return onError(rd.error);
    case "loaded":
      return onLoaded(rd.data);
    default:
      return absurd(rd);
  }
};

export const foldNoIdle = <E, A, T>(
  onLoading: Lazy<T>,
  onError: (e: E) => T,
  onLoaded: (a: A) => T,
) => fold(onLoading, onLoading, onError, onLoaded);

// non-pipable
const map_: Monad2<URI>["map"] = (fa, f) => pipe(fa, map(f));
const ap_: Monad2<URI>["ap"] = (fab, fa) => pipe(fab, ap(fa));

/**
 * @category instances
 */
export const Functor: Functor2<URI> = {
  URI,
  map: map_,
};

/**
 * @category instances
 * @since 2.7.0
 */
export const Applicative: Applicative2<URI> = {
  URI,
  map: map_,
  ap: ap_,
  of,
};

const bind_ = <A, N extends string, B>(
  a: A,
  name: Exclude<N, keyof A>,
  b: B,
): { [K in keyof A | N]: K extends keyof A ? A[K] : B } =>
  Object.assign({}, a, { [name]: b }) as any;

const bindTo_ = <N extends string>(name: N) => <B>(b: B): { [K in N]: B } => ({ [name]: b } as any);

// flux
type RequestAction = {
  type: "request";
};

type LoadAction<T> = {
  type: "load";
  payload: T;
};

type ErrorAction<E> = {
  type: "error";
  payload: E;
};

type CleanAction = {
  type: "clean";
};

type Action<E, A> = RequestAction | LoadAction<A> | ErrorAction<E> | CleanAction;

export const reducer = <E, A>() => (
  state: RemoteData<E, A>,
  action: Action<E, A>,
): RemoteData<E, A> => {
  switch (action.type) {
    case "request":
      return {
        state: "loading",
      };

    case "load":
      return {
        state: "loaded",
        data: action.payload,
      };

    case "error":
      return {
        state: "error",
        error: action.payload,
      };
    case "clean":
      return {
        state: "idle",
      };

    default:
      return state;
  }
};

const action = <E, T>() => ({
  request: (): RequestAction => ({
    type: "request",
  }),
  load: (t: T): LoadAction<T> => ({
    type: "load",
    payload: t,
  }),
  error: (e: E): ErrorAction<E> => ({
    type: "error",
    payload: e,
  }),
  clean: (): CleanAction => ({
    type: "clean",
  }),
});

export const initial = idle;

export const create = <E, A>() => ({
  reducer: reducer<E, A>(),
  initialState: idle,
  action: action<E, A>(),
});
