// import {NewMessage} from "@/components/new-message";
import {OnboardButton} from "@/components/onboard-button";
import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";
import {Address} from "@/lib/types";
import dynamic from 'next/dynamic'


function Loading() {
  return <div className="flex m-1 bg-gray-300 text-black font-bold py-2 px-4 rounded-lg items-center justify-center">Loading Universal Profile...</div>
}
// we don't render New Message in server side as it breaks the build
const NewMessageNoSSR = dynamic(() => import('@/components/new-message'), {
  ssr: false
})

export function OnboardOrNewMessage({onNewMessage, parent, category}: {onNewMessage: () => void, parent?: {user: Address, hash: string}, category?: string}) {
  const walletCtx = useContext(WalletContext);
  const {userRegistered, walletConnected, account} = walletCtx;

  // still loading
  if (walletConnected && account && userRegistered === undefined){
    return <Loading />
  }


  return (
    userRegistered?
      <NewMessageNoSSR onNewMessage={onNewMessage} parent={parent} category={category}/> :
      <div className="mb-5">
        <OnboardButton />
      </div>
  )
}