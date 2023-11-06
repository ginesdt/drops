"use client"

import {MessagesLayout} from "@/components/messages-layout";
import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";


function Loading() {
  return <div className="flex m-1 w-52 bg-gray-300 text-black font-bold py-2 px-4 rounded-lg items-center justify-center">Loading Feeds...</div>
}

function NoAccount() {
  return <div className="flex m-1 w-full bg-gray-300 text-black font-bold py-2 px-4 rounded-lg items-center justify-center">Connect Wallet and Onboard to follow other users</div>
}

export default function Page() {
  const walletCtx = useContext(WalletContext)

  const hideMessages = !walletCtx.walletConnected || !walletCtx.account || !walletCtx.userRegistered

  if (walletCtx.walletConnected && walletCtx.userRegistered === undefined)
    return <Loading />

  if (!walletCtx.walletConnected || !walletCtx.account || !walletCtx.userRegistered )
    return <NoAccount />

  return <MessagesLayout sender={walletCtx.account} onlyFollowing={true} noMessagesText={"No messages found from any of your feeds."} hideNewMessage={true} />
}
