
export type Chat = {
  id: string,
  username: string | null,
  computerName: string | undefined,
  ip: string;
  lastSeen: Date | number,
  lastMessage?: string,
  lastMessageType?: string,
  lastMessageTime?: Date | number,
  unreadMessagesCount?: number,
  message?: Message[],
}

export type Message = {
  id: string,
  senderId: string,
  message: string,
  MessageType: string,
}

export type Inbox = Chat[]