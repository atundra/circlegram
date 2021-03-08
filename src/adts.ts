import type {
  MessageText,
  MessageAnimation,
  MessageAudio,
  MessageDocument,
  MessagePhoto,
  MessageExpiredPhoto,
  MessageSticker,
  MessageVideo,
  MessageExpiredVideo,
  MessageVideoNote,
  MessageVoiceNote,
  MessageLocation,
  MessageVenue,
  MessageContact,
  MessageDice,
  MessageGame,
  MessagePoll,
  MessageInvoice,
  MessageCall,
  MessageBasicGroupChatCreate,
  MessageSupergroupChatCreate,
  MessageChatChangeTitle,
  MessageChatChangePhoto,
  MessageChatDeletePhoto,
  MessageChatAddMembers,
  MessageChatJoinByLink,
  MessageChatDeleteMember,
  MessageChatUpgradeTo,
  MessageChatUpgradeFrom,
  MessagePinMessage,
  MessageScreenshotTaken,
  MessageChatSetTtl,
  MessageCustomServiceAction,
  MessageGameScore,
  MessagePaymentSuccessful,
  MessagePaymentSuccessfulBot,
  MessageContactRegistered,
  MessageWebsiteConnected,
  MessagePassportDataSent,
  MessagePassportDataReceived,
  MessageProximityAlertTriggered,
  MessageUnsupported,
  MessageSenderUser,
  MessageSenderChat,
  ChatTypePrivate,
  ChatTypeBasicGroup,
  ChatTypeSupergroup,
  ChatTypeSecret,
} from "@airgram/web";
import { makeADT, ofType } from "@morphic-ts/adt";

export const messageSender = makeADT("_")({
  messageSenderUser: ofType<MessageSenderUser>(),
  messageSenderChat: ofType<MessageSenderChat>(),
});

export const messageContent = makeADT("_")({
  messageText: ofType<MessageText>(),
  messageAnimation: ofType<MessageAnimation>(),
  messageAudio: ofType<MessageAudio>(),
  messageDocument: ofType<MessageDocument>(),
  messagePhoto: ofType<MessagePhoto>(),
  messageExpiredPhoto: ofType<MessageExpiredPhoto>(),
  messageSticker: ofType<MessageSticker>(),
  messageVideo: ofType<MessageVideo>(),
  messageExpiredVideo: ofType<MessageExpiredVideo>(),
  messageVideoNote: ofType<MessageVideoNote>(),
  messageVoiceNote: ofType<MessageVoiceNote>(),
  messageLocation: ofType<MessageLocation>(),
  messageVenue: ofType<MessageVenue>(),
  messageContact: ofType<MessageContact>(),
  messageDice: ofType<MessageDice>(),
  messageGame: ofType<MessageGame>(),
  messagePoll: ofType<MessagePoll>(),
  messageInvoice: ofType<MessageInvoice>(),
  messageCall: ofType<MessageCall>(),
  messageBasicGroupChatCreate: ofType<MessageBasicGroupChatCreate>(),
  messageSupergroupChatCreate: ofType<MessageSupergroupChatCreate>(),
  messageChatChangeTitle: ofType<MessageChatChangeTitle>(),
  messageChatChangePhoto: ofType<MessageChatChangePhoto>(),
  messageChatDeletePhoto: ofType<MessageChatDeletePhoto>(),
  messageChatAddMembers: ofType<MessageChatAddMembers>(),
  messageChatJoinByLink: ofType<MessageChatJoinByLink>(),
  messageChatDeleteMember: ofType<MessageChatDeleteMember>(),
  messageChatUpgradeTo: ofType<MessageChatUpgradeTo>(),
  messageChatUpgradeFrom: ofType<MessageChatUpgradeFrom>(),
  messagePinMessage: ofType<MessagePinMessage>(),
  messageScreenshotTaken: ofType<MessageScreenshotTaken>(),
  messageChatSetTtl: ofType<MessageChatSetTtl>(),
  messageCustomServiceAction: ofType<MessageCustomServiceAction>(),
  messageGameScore: ofType<MessageGameScore>(),
  messagePaymentSuccessful: ofType<MessagePaymentSuccessful>(),
  messagePaymentSuccessfulBot: ofType<MessagePaymentSuccessfulBot>(),
  messageContactRegistered: ofType<MessageContactRegistered>(),
  messageWebsiteConnected: ofType<MessageWebsiteConnected>(),
  messagePassportDataSent: ofType<MessagePassportDataSent>(),
  messagePassportDataReceived: ofType<MessagePassportDataReceived>(),
  messageProximityAlertTriggered: ofType<MessageProximityAlertTriggered>(),
  messageUnsupported: ofType<MessageUnsupported>(),
});

export const chatType = makeADT("_")({
  chatTypePrivate: ofType<ChatTypePrivate>(),
  chatTypeBasicGroup: ofType<ChatTypeBasicGroup>(),
  chatTypeSupergroup: ofType<ChatTypeSupergroup>(),
  chatTypeSecret: ofType<ChatTypeSecret>(),
});