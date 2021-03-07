import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as C from "fp-ts/Console";
import { Lazy, pipe } from "fp-ts/function";
import {
  Airgram,
  ApiMethods,
  ApiResponse,
  BaseTdObject,
  BasicGroupFullInfo,
  Chat,
  ChatMembers,
  Chats,
  DownloadFileParams,
  Error as TgError,
  File,
  FilePart,
  GetBasicGroupFullInfoParams,
  GetChatsParams,
  GetGroupsInCommonParams,
  GetSupergroupFullInfoParams,
  GetSupergroupMembersParams,
  GetUserFullInfoParams,
  GetUserParams,
  ReadFilePartParams,
  SupergroupFullInfo,
  User,
  UserFullInfo,
  Users,
} from "@airgram/web";
import { inspect } from "./utils";

export const getChats = (
  p: GetChatsParams,
): RTE.ReaderTaskEither<Airgram, Error | TgError, Chats> => ({ api }) =>
  pipe(
    TE.tryCatch(() => api.getChats(p), E.toError),
    TE.chainW((a) => (a.response._ === "error" ? TE.left(a.response) : TE.right(a.response))),
  );

export const getChat = (chatId: number): RTE.ReaderTaskEither<Airgram, Error | TgError, Chat> => ({
  api,
}) =>
  pipe(
    TE.tryCatch(() => api.getChat({ chatId }), E.toError),
    TE.chainW((a) => (a.response._ === "error" ? TE.left(a.response) : TE.right(a.response))),
  );

export const getContacts = (): RTE.ReaderTaskEither<Airgram, Error | TgError, Users> => ({ api }) =>
  pipe(
    TE.tryCatch(() => api.getContacts(), E.toError),
    TE.chainW((a) => (a.response._ === "error" ? TE.left(a.response) : TE.right(a.response))),
  );

export const readFilePart = (
  p: ReadFilePartParams,
): RTE.ReaderTaskEither<Airgram, Error | TgError, FilePart> => ({ api }) =>
  pipe(
    TE.tryCatch(() => api.readFilePart(p), E.toError),
    TE.chainW((a) => (a.response._ === "error" ? TE.left(a.response) : TE.right(a.response))),
  );

export const downloadFile = (
  p: DownloadFileParams,
): RTE.ReaderTaskEither<Airgram, Error | TgError, File> => ({ api }) =>
  pipe(
    TE.tryCatch(() => api.downloadFile(p), E.toError),
    TE.chainW((a) => (a.response._ === "error" ? TE.left(a.response) : TE.right(a.response))),
  );

const isError = (a: any): a is TgError => a._ === "error";

const apiMethod = <P, R extends BaseTdObject>(
  f: (api: ApiMethods, p: P) => Promise<ApiResponse<P, R>>,
) => (p: P): RTE.ReaderTaskEither<Airgram, Error | TgError, R> => ({ api }) =>
  pipe(
    TE.tryCatch(() => f(api, p), E.toError),
    TE.map((a) => a.response),
    TE.chain((a) => (isError(a) ? TE.left(a) : TE.right<TgError | Error, R>(a))),
  );

export const getGroupsInCommon = apiMethod<GetGroupsInCommonParams, Chats>((api, p) =>
  api.getGroupsInCommon(p),
);

export const getSupergroupFullInfo = apiMethod<GetSupergroupFullInfoParams, SupergroupFullInfo>(
  (api, p) => api.getSupergroupFullInfo(p),
);

export const getBasicGroupFullInfo = apiMethod<GetBasicGroupFullInfoParams, BasicGroupFullInfo>(
  (api, p) => api.getBasicGroupFullInfo(p),
);

export const getSupergroupMembers = apiMethod<GetSupergroupMembersParams, ChatMembers>((api, p) =>
  api.getSupergroupMembers(p),
);

export const getUserFullInfo = apiMethod<GetUserFullInfoParams, UserFullInfo>((api, p) =>
  api.getUserFullInfo(p),
);

export const getUser = apiMethod<GetUserParams, User>((api, p) => api.getUser(p));
