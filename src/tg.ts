import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as C from "fp-ts/Console";
import { pipe } from "fp-ts/function";
import {
  Airgram,
  Chat,
  Chats,
  DownloadFileParams,
  Error as TgError,
  File,
  FilePart,
  GetChatsParams,
  ReadFilePartParams,
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
