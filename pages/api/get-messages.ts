import {NextApiRequest, NextApiResponse} from "next";
import {getMessages} from "@/lib/db-manager";
import {Address, GetMessagesResponseData} from "@/lib/types";
import {DEFAULT_LIMIT, MAX_LIMIT} from "@/lib/constants";


export function parseRequest(req: NextApiRequest): { error: string } |
  { sender: Address | undefined, before: number|undefined, beforeId: string|undefined, limit: number, onlyParentComments: boolean, includeReplies: boolean, category?: string, onlyFollowing: boolean, messageHash?: string, origin?: string } {

  let limit = req.query["limit"] ? parseInt(req.query["limit"] as string) : DEFAULT_LIMIT;
  if (limit > MAX_LIMIT)
    limit = MAX_LIMIT;
  let before = req.query["before"] ? parseInt(req.query["before"] as string) : undefined;
  let beforeId = req.query["beforeId"] as string|undefined;
  let sender = req.query["sender"] as string | undefined
  if (sender && sender.trim().length === 0)
    sender = undefined;
  if (sender && !sender.startsWith("0x")) {
    return {error: "Wrong sender address format"}
  }

  const onlyParentComments = req.query["onlyParentComments"] ? parseInt(req.query["onlyParentComments"] as string) === 1 : true

  const includeReplies = req.query["includeReplies"] ? parseInt(req.query["includeReplies"] as string) === 1 : true

  const category = req.query["category"] as string|undefined

  const onlyFollowing = req.query["onlyFollowing"] ? parseInt(req.query["onlyFollowing"] as string) === 1 : false

  const messageHash = req.query["messageHash"] as string|undefined

  const origin = req.query["origin"] as string|undefined

  return {limit, before, beforeId, sender: sender as Address|undefined, onlyParentComments, includeReplies, category, onlyFollowing, messageHash, origin};
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetMessagesResponseData>
) {

  const reqParams = parseRequest(req);
  if ("error" in reqParams) {
    res.status(400).json({success: false, error: reqParams.error})
    return;
  }

  const messages = await getMessages({...reqParams});

  res.status(200).json({
    success: true,
    messages
  })
}
