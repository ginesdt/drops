import {NextApiRequest, NextApiResponse} from "next";
import Web3 from "web3";
import {SignTimestampResponseData, TimestampData} from "@/lib/types";


function getCurrentTime() : string {
  return new Date().getTime().toString();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignTimestampResponseData>
) {
  const timestamp = getCurrentTime();

  const data: TimestampData = {
    timestamp: timestamp,
    hash: req.body.hash,
  }

  const web3 = new Web3();
  const signature = web3.eth.accounts.sign(JSON.stringify(data), process.env.TIMESTAMP_KEY).signature;

  const timestampData = {
    data: data,
    signature: signature
  }

  res.status(200).json({
    success: true,
    timestampData: timestampData
  })
}
