import {
  Message,
  MessageProcessor,
  MessagesIndex,
  MessageType,
  OperationType,
  SignedMessage
} from "@/lib/types";
import {fetchUPIndexUrl, isUserEnrolled, isValidSignature} from "@/lib/up-manager";
import {logger} from "@/logger";
import {ipfsClient, web3} from "@/lib/globals";
import {addAndPin, buildIpfsUrl, buildIpnsAddress, getOrCreateUserKey, updateIpnsLink} from "@/lib/ipfs";
import {isSignedBroadcastMessage, isSignedControlMessage} from "@/lib/message-utils";
import {MAX_INDEX_MESSAGES, SERVICE_ID} from "@/lib/constants";
import last from "it-last";
import {concat as uint8ArrayConcat, toString as uint8ArrayToString} from "uint8arrays";
import all from "it-all";
import {BroadcastMessageProcessor} from "@/lib/message/handlers/broadcast";
import {ControlMessageProcessor} from "@/lib/message/handlers/control";

const broadcastMessageProcessor = new BroadcastMessageProcessor();
const controlMessageProcessor = new ControlMessageProcessor();

function buildServiceLink(signedMessage: SignedMessage<any>): string | undefined {
  if (signedMessage.data.message.type === MessageType.Broadcast)
    return `${process.env.SERVICE_MESSAGES_URL}${process.env.SERVICE_MESSAGES_URL.endsWith("/") ? "" : "/"}${signedMessage.data.timestamp.data.hash}`
}

async function addMessageToIndex(signedMessage: SignedMessage<any>, newMessageCid: string): Promise<{ oldIndexCid?: string, newIndex: MessagesIndex }> {
  const key = await getOrCreateUserKey(signedMessage.data.message.sender);

  const messageRef = {
    link: buildIpfsUrl(newMessageCid),
    hash: signedMessage.data.timestamp.data.hash,
    metadata: {
      publishedAt: new Date().getTime(),
      publishedBy: SERVICE_ID,
      link: buildServiceLink(signedMessage)
    }
  }

  const ipfsCid = await last(ipfsClient.name.resolve(buildIpnsAddress(key)))
  if (ipfsCid) {
    // ipns exists, read and append message
    try {
      const source = ipfsClient.cat(ipfsCid, {timeout: 5000});
      const data = uint8ArrayToString(uint8ArrayConcat(await all(source)));
      const index = JSON.parse(data) as MessagesIndex;
      if (index.messages === undefined)
        index.messages = []
      index.totalCount++;

      if (index.messages.length >= MAX_INDEX_MESSAGES) {
        index.previousPage = buildIpfsUrl(ipfsCid);
        index.messages = [messageRef]
        return {
          newIndex: index
        }
      }

      index.messages.push(messageRef);
      return {
        newIndex: index,
        oldIndexCid: ipfsCid
      };
    } catch (e) {
      console.error(`Failed to read ipfs file content: ${ipfsCid}. Reason: ${e}`)
      throw e;
    }
  } else {
    // create new
    return {
      newIndex: {
        messages: [messageRef],
        totalCount: 1
      }
    }
  }
}


/**
 * Stores message in IPFS and update IPNS index record
 * @param signedMessage message to append
 */
async function storeAndLinkMessage(signedMessage: SignedMessage<any>): Promise<{ indexLink: string, newMessageUrl: string }> {

  const newMessageCid = await addAndPin(JSON.stringify(signedMessage));

  const {oldIndexCid, newIndex} = await addMessageToIndex(signedMessage, newMessageCid);

  const cid = await addAndPin(JSON.stringify(newIndex));

  // update the IPNS record to point to the latest index
  const indexLink = await updateIpnsLink(cid, signedMessage.data.message.sender);

  // unpin old index
  if (oldIndexCid)
    try {
      await ipfsClient.pin.rm(oldIndexCid);
    } catch(error : any) {
      logger.warn(`Failed to delete old index (${oldIndexCid}): ${error.message}`)
    }

  const newMessageUrl = buildIpfsUrl(newMessageCid);

  return {indexLink, newMessageUrl};
}


function getMessageProcessor(signedMessage: SignedMessage<Message>) : MessageProcessor<any> {
  if (isSignedControlMessage(signedMessage)) {
    return controlMessageProcessor;
  } else if (isSignedBroadcastMessage(signedMessage)) {
    return broadcastMessageProcessor;
  }
  logger.error("Unrecognized message type: " + signedMessage.data.message.type);
  throw new Error("unrecognized message");
}

async function validateSignature(signedMessage: SignedMessage<Message>) {
  const data = JSON.stringify(signedMessage.data);

  const validSignature = await isValidSignature(web3, signedMessage.data.message.sender, data, signedMessage.signature);
  if (!validSignature) {
    throw new Error("signature not valid");
  }
}

async function validateTimestamp(signedMessage: SignedMessage<Message>) {
  const hash = web3.utils.sha3(JSON.stringify(signedMessage.data.message));

  if (hash === null) {
    throw new Error("cannot hash data")
  }

  if (hash !== signedMessage.data.timestamp.data.hash) {
    throw new Error("Timestamp hash and message content do not match")
  }

  const data = JSON.stringify(signedMessage.data.timestamp.data);

  const validSignature = web3.eth.accounts.recover(data, signedMessage.data.timestamp.signature) === process.env.TIMESTAMP_ADDRESS

  if (!validSignature) {
    throw new Error("signature not valid");
  }
}

async function validateController(signedMessage: SignedMessage<Message>) {
  const indexUrl = await fetchUPIndexUrl(web3, signedMessage.data.message.sender);
  if ((!indexUrl || !isUserEnrolled(indexUrl))
    && (signedMessage.data.message.type !== MessageType.Control || signedMessage.data.message.operation !== OperationType.Onboard)) {
    throw new Error("User not registered with this service")
  }
}

/**
 * Check if message data and signatures are valid. Throws an error otherwise
 * @param signedMessage message to validate
 */
async function validateMessage(signedMessage: SignedMessage<Message>): Promise<void> {
  await validateSignature(signedMessage)
  await validateTimestamp(signedMessage)
  await validateController(signedMessage)
}

/**
 * Validates and process a new message
 * @param signedMessage message to handle
 */
export async function handleMessage(signedMessage: SignedMessage<Message>) {
  await validateMessage(signedMessage);

  const processor = getMessageProcessor(signedMessage)
  const store = await processor.preProcess(signedMessage);
  if (store) {
    const {indexLink, newMessageUrl} = await storeAndLinkMessage(signedMessage);
    await processor.postProcess(signedMessage, {indexLink, newMessageUrl});
  }
}
