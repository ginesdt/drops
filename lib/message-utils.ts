import {
  AddMessageResponseData,
  Address,
  BaseMessage,
  BroadcastMessage,
  ControlMessage,
  LastHashResponseData,
  Media,
  Message,
  MessageType,
  OperationType,
  SignedMessage,
  SignedTimestamp,
  SignTimestampResponseData,
  TimestampMessage
} from "@/lib/types";
import Web3 from "web3";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function isControlMessage(message: Message): message is ControlMessage {
  return message.type === MessageType.Control;
}

export function isBroadcastMessage(message: Message): message is BroadcastMessage {
  return message.type === MessageType.Broadcast;
}

export function isSignedControlMessage(message: SignedMessage<Message>): message is SignedMessage<ControlMessage> {
  return isControlMessage(message.data.message);
}

export function isSignedBroadcastMessage(message: SignedMessage<Message>): message is SignedMessage<BroadcastMessage> {
  return isBroadcastMessage(message.data.message);
}

export async function getPreviousMessageHash(account: string) {
  const response = await fetch(`/api/get-last-message-hash?user=${account}`);
  const responseJson = await response.json() as LastHashResponseData;
  if (!responseJson.success)
    throw Error("cannot get previous hash")
  return responseJson.hash
}

async function buildBaseMessage(account: Address, type: MessageType, origin?: string): Promise<BaseMessage> {
  const previousMessageHash = await getPreviousMessageHash(account);
  return {type, previousMessageHash, sender: account, origin}
}

export async function sendBroadcastMessage({web3, account, content, parent, category, tags, medias, origin}: { web3: Web3, account: Address, content: string, parent?: { user: Address, hash: string }, category: string, tags?: string[], medias?: Media[], origin?: string }): Promise<AddMessageResponseData> {
  const baseMessage = await buildBaseMessage(account, MessageType.Broadcast, origin);
  const messageData = {...baseMessage, ...{content, category, tags, medias, inReplyTo: parent}} as BroadcastMessage;
  return sendMessage(web3, messageData);
}

export async function sendControlMessage({web3, account, operation, data, origin}: { web3: Web3, account: Address, operation: OperationType, data?: string, origin?: string }): Promise<AddMessageResponseData> {
  const baseMessage = await buildBaseMessage(account, MessageType.Control, origin);
  const messageData = {...baseMessage, ...{operation, data}} as ControlMessage;
  return sendMessage(web3, messageData);
}

export async function sendMessage(web3: Web3, messageData: Message): Promise<AddMessageResponseData> {
  const hashedMessageData = web3.utils.sha3(JSON.stringify(messageData));

  if (hashedMessageData === null) {
    console.error("Cannot hash data");
    throw Error("Cannot hash data");
  }

  const signedTimestamp = await requestSignedTimestamp(hashedMessageData);

  const signedMessageDataWithTimestamp: TimestampMessage<Message> = {
    message: messageData,
    timestamp: signedTimestamp
  }

  const signedMessageDataWithTimestampStr = JSON.stringify(signedMessageDataWithTimestamp);

  try {
    const messageDataWithTimestampSignature = await web3.eth.sign(
      signedMessageDataWithTimestampStr,
      messageData.sender);

    const signedMessage: SignedMessage<Message> = {
      data: signedMessageDataWithTimestamp,
      signature: messageDataWithTimestampSignature
    }

    const response = await fetch('/api/add-message', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        signedMessage
      )
    })

    return await response.json() as AddMessageResponseData
  } catch (error: any) {
    if ("code" in error && error.code === 4100) {
      await web3.eth.requestAccounts();
      return await sendMessage(web3, messageData);
    }
    throw error;
  }

}

export async function requestSignedTimestamp(hashedData: string): Promise<SignedTimestamp> {
  const response = await fetch('/api/sign-timestamp', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"},
    body: JSON.stringify({
      hash: hashedData,
    })})
  const responseJson = await response.json() as SignTimestampResponseData;
  if (responseJson.success)
    return responseJson.timestampData;
  throw new Error("Cannot timestamp");
}
