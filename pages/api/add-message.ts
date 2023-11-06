import {NextApiRequest, NextApiResponse} from "next";
import {AddMessageResponseData, Address, Message, SignedMessage} from "@/lib/types";
import {getUserInfo, updateUserProfile} from "@/lib/db-manager";
import {handleMessage} from "@/lib/message/message-manager";
import {logger} from "@/logger";
import {fetchUPProfile} from "@/lib/up-manager";
import {web3} from "@/lib/globals";

export async function updateProfileMetadata(user: Address): Promise<void> {
  const userProfile = await fetchUPProfile(web3, user)
  await updateUserProfile(user, userProfile);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddMessageResponseData>
) {

  if (req.method === "OPTIONS"){
    // handle CORS
    res.status(200).json({success: false, error: "Not allowed"})
    return;
  }

  const signedMessage = req.body as SignedMessage<Message>

  try {
    await handleMessage(signedMessage)
  } catch (error: any) {
    res.status(400).json({success: false, error: error.message})
    return;
  }

  try {
    await updateProfileMetadata(signedMessage.data.message.sender)
  } catch (error: any) {
    logger.error(`Cannot update profile of user ${signedMessage.data.message.sender}. Reason: ${error.message}`)
  }

  const user = await getUserInfo(signedMessage.data.message.sender);
  if (!user) {
    res.status(400).json({success: false, error: "Cannot get user info"})
    return;
  }

  res.status(200).json({
    success: true,
    userInfo: user
  })
}
