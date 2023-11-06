import {BroadcastMessage, MessageProcessor, SignedMessage} from "@/lib/types";
import {addMessage as addMessageToDB, updateLastHash} from "@/lib/db-manager";

export class BroadcastMessageProcessor implements MessageProcessor<BroadcastMessage> {
  async preProcess(message: SignedMessage<BroadcastMessage>): Promise<boolean> {
    return true;
  }

  async postProcess(message: SignedMessage<BroadcastMessage>, {newMessageUrl} : {newMessageUrl: string}): Promise<void> {
    await addMessageToDB({
      hash: message.data.timestamp.data.hash,
      sender: message.data.message.sender,
      content: message.data.message.content,
      category: message.data.message.category,
      tags: message.data.message.tags,
      medias: message.data.message.medias,
      timestamp: parseInt(message.data.timestamp.data.timestamp),
      inReplyTo: message.data.message.inReplyTo?.hash,
      url: newMessageUrl,
      origin: message.data.message.origin
    })
    await updateLastHash(message.data.message.sender, message.data.timestamp.data.hash);
  }
}