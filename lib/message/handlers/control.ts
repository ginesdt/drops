import {Address, ControlMessage, MessageProcessor, OperationType, SignedMessage} from "@/lib/types";
import {follow, hideMessage, updateLastHash, updateUser, vote} from "@/lib/db-manager";
import {addAndPin, buildIpfsUrl} from "@/lib/ipfs";
import {buildStorageInfo, fetchUPIndexUrl, isUserEnrolled} from "@/lib/up-manager";
import {logger} from "@/logger";
import {web3} from "@/lib/globals";

export class ControlMessageProcessor implements MessageProcessor<ControlMessage> {
  async postProcess(message: SignedMessage<ControlMessage>, {indexLink}: { indexLink: string }): Promise<void> {
    if (message.data.message.operation === OperationType.Onboard) {
      const cid = await addAndPin(buildStorageInfo(indexLink));

      await updateLastHash(message.data.message.sender, message.data.timestamp.data.hash);
      await updateUser(message.data.message.sender, {
        storageInfoLink: buildIpfsUrl(cid),
        indexLink: indexLink
      });
    }
  }

  async preProcess(message: SignedMessage<ControlMessage>): Promise<boolean> {
    switch (message.data.message.operation) {
      case OperationType.Onboard:
        return handleOnboardMessage(message);
      case OperationType.Like:
      case OperationType.Dislike:
        return handleVoteMessage(message);
      case OperationType.HideMessage:
        return handleHideMessage(message);
      case OperationType.Follow:
      case OperationType.Unfollow:
        return handleFollowMessage(message);
      default:
        logger.error("Unrecognized operation type");
        return false;
    }
  }
}

async function handleOnboardMessage(message: SignedMessage<ControlMessage>): Promise<boolean> {
  const user = message.data.message.sender;
  const indexUrl = await fetchUPIndexUrl(web3, user);
  if (indexUrl) {
    if (isUserEnrolled(indexUrl)) {
      // if user is already enrolled, we ignore this message
      return false;
    }
  }
  return true;
}

async function handleVoteMessage(message: SignedMessage<ControlMessage>): Promise<boolean> {
  if (!message.data.message.data)
    return false
  const data = JSON.parse(message.data.message.data) as { messageHash: string }
  if (data.messageHash) {
    await vote({sender: message.data.message.sender, messageHash: data.messageHash, isLike: message.data.message.operation === OperationType.Like});
    return true;
  }
  return false;
}

async function handleHideMessage(message: SignedMessage<ControlMessage>): Promise<boolean> {
  if (!message.data.message.data)
    return false
  const data = JSON.parse(message.data.message.data) as { messageHash: string }
  if (data.messageHash) {
    await hideMessage({sender: message.data.message.sender, messageHash: data.messageHash});
    return true
  }
  return false
}

async function handleFollowMessage(message: SignedMessage<ControlMessage>): Promise<boolean> {
  if (!message.data.message.data)
    return false
  const data = JSON.parse(message.data.message.data) as { userAddress: Address }
  if (data.userAddress) {
    await follow({follower: message.data.message.sender, following: data.userAddress, isFollow: message.data.message.operation === OperationType.Follow});
    return true;
  }
  return false;
}
