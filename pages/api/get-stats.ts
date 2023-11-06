import {NextApiRequest, NextApiResponse} from "next";
import {getFollowing, getLikes} from "@/lib/db-manager";
import {Address, GetStatsResponseData} from "@/lib/types";


export function parseRequest(req: NextApiRequest): { error: string } |
  { address: Address, type: "likes", hashes: string[] } | { address: Address, type: "following", users: Address[] } {

  let address = req.query["address"] as Address;
  if (!address){
    return {error: "Missing address"}
  }
  let type = req.query["type"] as string;
  if (!type){
    return {error: "Missing type"}
  }
  if (type === "likes") {
    let hashes = req.query["hash"] as string | string[]
    if (!hashes){
      return {error: "Missing hash"}
    }
    if (!Array.isArray(hashes))
      hashes = [hashes];
    return {address, type, hashes};

  } else if (type === "following") {
    let users = req.query["user"] as Address | Address[];
    if (!users){
      return {error: "Missing user"}
    }
    if (!Array.isArray(users))
      users = [users];
    return {address, type, users};
  }
  return {error: "unrecognized type"}
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetStatsResponseData>
) {

  const reqParams = parseRequest(req);
  if ("error" in reqParams) {
    res.status(400).json({success: false, error: reqParams.error})
    return;
  }

  let stats;
  if (reqParams.type === "likes") {
    stats = {likes: await getLikes(reqParams)}
  } else {
    stats = {following: await getFollowing(reqParams)}
  }

  res.status(200).json({
    success: true,
    stats
  })
}
