import {NextApiRequest, NextApiResponse} from "next";
import {getLastMessageHash} from "@/lib/db-manager";
import {Address, LastHashResponseData} from "@/lib/types";
import {FIRST_HASH} from "@/lib/constants";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LastHashResponseData>
) {

  const user = req.query["user"] as Address;

  if (!user) {
    res.status(400).json({success: false, error: "Missing parameter: user"})
    return
  }

  const hash = await getLastMessageHash(user);

  if (!hash) {
    res.status(200).json({
      success: true,
      hash: FIRST_HASH
    })
    return;
  }

  res.status(200).json({
    success: true,
    hash
  })
}
