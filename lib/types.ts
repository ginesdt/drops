export type DBMessage = {
  hash: string
  sender: string
  content: string
  timestamp: number
  tags?: string[]
  category?: string
  medias?: Media[]
  inReplyTo?: string
  hidden?: boolean
  likes?: number,
  replies?: DBMessage[]
  url: string,
  user?: DBUser
  origin?: string
}

export type DBUser = {
  address: string,
  lastHash: string,
  indexLink: string,
  storageInfoLink: string,
  name?: string,
  description?: string,
  avatar?: string,
  profileImage?: string,
  backgroundImage?: string,
  tags?: string,
  links?: string,
  followersCount?: number,
  messagesCount?: number
}

export type StorageInfo = {
  ipnsIndexLink: string,
  ipfsJsonUrl: string,
  ipfsJsonContent: {
    index: string
  }
}

export enum MessageType {
  Control,
  Broadcast
}

export enum OperationType {
  Onboard,
  Offboard,
  Reserved1,
  Reserved2,
  Reserved3,
  HideMessage,
  Like,
  Dislike,
  Follow,
  Unfollow
}

export type BaseMessage = {
  type: MessageType,
  previousMessageHash: string,
  sender: Address,
  origin?: string
}

export type ControlMessage = BaseMessage & {
  type: MessageType.Control,
  operation: OperationType,
  data?: string
}

export type Media = {
  url: string,
  type: string
}

export type BroadcastMessage = BaseMessage & {
  type: MessageType.Broadcast,
  content: string,
  category?: string,
  tags?: string[],
  medias?: Media[],
  inReplyTo?: {
    user: Address,
    hash: string
  }
}

export type Message = ControlMessage | BroadcastMessage;

export type TimestampData = {
  timestamp: string,
  hash: string
}

export type SignedTimestamp = {
  data: TimestampData,
  signature: string
}

export type TimestampMessage<T extends Message> = {
  message: T,
  timestamp: SignedTimestamp
}

export type SignedMessage<T extends Message> = {
  data: TimestampMessage<T>,
  signature: string
}

export type MessageRef = {
  link: string,
  hash: string,
  metadata?: {}
}

export type MessagesIndex = {
  messages?: MessageRef[],
  previousPage?: string,
  totalCount: number
}


export type Address = `0x${string}`

export type Metadata = {
  key: string,
  value: string
}


export type Stats = {
  likes?: {
    [hash: string]: boolean | null
  },
  following?: {
    [user: string]: boolean | null
  }
}


export interface MessageProcessor<T extends Message> {
  preProcess: (message: SignedMessage<T>) => Promise<boolean>
  postProcess: (message: SignedMessage<T>, {indexLink, newMessageUrl}: {indexLink: string, newMessageUrl: string}) => Promise<void>
}


// **************
// Services types
// **************

export interface ErrorResponse {
  success: false,
  error: string
}

export interface SignTimestampSuccessResponse {
  success: true,
  timestampData: SignedTimestamp,
}
export type SignTimestampResponseData = SignTimestampSuccessResponse | ErrorResponse

export interface AddMessageSuccessResponse {
  success: true,
  userInfo: DBUser
}
export type AddMessageResponseData = AddMessageSuccessResponse | ErrorResponse


export interface LastHashSuccessResponse {
  success: true,
  hash: string,
}
export type LastHashResponseData = LastHashSuccessResponse | ErrorResponse



export interface GetMessagesSuccessResponse {
  success: true,
  messages: DBMessage[],
}
export type GetMessagesResponseData = GetMessagesSuccessResponse | ErrorResponse



export interface GetStatsSuccessResponse {
  success: true,
  stats: Stats,
}
export type GetStatsResponseData = GetStatsSuccessResponse | ErrorResponse

export interface GetUserSuccessResponse {
  success: true,
  user: DBUser,
}
export type GetUserResponseData = GetUserSuccessResponse | ErrorResponse
