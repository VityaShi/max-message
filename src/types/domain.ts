export type Message = {
  id: string;
  text: string;
  ts: number;
  direction: 'in' | 'out';
  status: 'sending' | 'sent' | 'failed';
};

export type Chat = {
  chatId: string;
  title: string;
  createdAt: number;
  messages: Message[];
};

export type Session = {
  idInstance: string;
  apiTokenInstance: string;
};

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'online'
  | 'reconnecting'
  | 'offline';