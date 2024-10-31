
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
  messages?: Message[],
}

export type Message = {
  id: string,
  chatId: string,
  senderId: string,
  message: string,
  MessageType: string,
  sentAt?: Date | number,
  receivedAt: Date | number,
  seenAt?: Date | number,
  senderComputerName?: string,
  senderIP?: string,
}

export type Inbox = Chat[]
