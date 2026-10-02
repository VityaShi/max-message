export type Credentials = {
  idInstance: string;
  apiTokenInstance: string;
};

export type SendMessageRequest = {
  chatId: string;
  message: string;
};

export type SendMessageResponse = {
  idMessage: string;
};

export type TextMessageData = {
  textMessage: string;
};

export type MessageData = {
  typeMessage: string;
  textMessageData?: TextMessageData;
};

export type SenderData = {
  chatId: string;
  chatName?: string;
  chatType?: string;
  sender?: string;
  senderName?: string;
  senderContactName?: string;
  senderPhoneNumber?: number | string;
};

export type NotificationBody = {
  typeWebhook:
    | 'incomingMessageReceived'
    | 'outgoingMessageReceived'
    | 'stateInstanceChanged'
    | (string & {});
  idMessage?: string;
  senderData?: SenderData;
  messageData?: MessageData;
};

export type Notification = {
  receiptId: number;
  body: NotificationBody;
};

export type InstanceSettings = {
  webhookUrl?: string;
  outgoingWebhook?: string;
  incomingWebhook?: string;
  delaySendMessagesMilliseconds?: number;
  markIncomingMessagesReaded?: 'yes' | 'no';
  markConversationAsReaded?: 'yes' | 'no';
  keepOnlineStatus?: 'yes' | 'no';
  pollInterval?: number;
  [key: string]: unknown;
};

export type GreenApiError = {
  error?: string;
  message?: string;
};