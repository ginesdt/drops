import {NextApiRequest, NextApiResponse} from "next";
import {getUserInfo} from "@/lib/db-manager";
import {Address, GetUserResponseData} from "@/lib/types";

export function parseRequest(req: NextApiRequest): { error: string } | { user: Address } {
  let user = req.query["user"] as Address | undefined
  if (!user)
    return {error: "Missing parameter: user"}
  if (!user.startsWith("0x")) {
    return {error: "Wrong sender address format"}
  }

  return {user}
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetUserResponseData>
) {

  const reqParams = parseRequest(req);
  if ("error" in reqParams) {
    res.status(400).json({success: false, error: reqParams.error})
    return;
  }

  let {user} = reqParams;
  const dbUser = await getUserInfo(user);

  if (!dbUser) {
    res.status(404).json({
      success: false,
      error: "User not found"
    })
    return
  }

  res.status(200).json({
    success: true,
    user: dbUser
  })
}
