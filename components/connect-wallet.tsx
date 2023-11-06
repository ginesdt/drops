import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";
import {Address} from "@/lib/types";
import Link from "next/link";
import {NotificationContext} from "@/components/context/notification-context";
import {OnboardButton} from "@/components/onboard-button";
import {CHAIN_ID, getInjectedProvider} from "@/lib/constants";


function cutAddress(address: Address) {
  return `${address.substring(0, 6)}...${address.substring(36)}`;
}

function Loading() {
  return <div className="flex m-1 w-52 bg-gray-300 text-black font-bold py-2 px-4 rounded-lg items-center justify-center">Loading...</div>
}

export function ConnectWallet() {

  const walletCtx = useContext(WalletContext);
  const notificationCtx = useContext(NotificationContext);

  const account = walletCtx.account

  async function connectAccount() {
    try {
      await walletCtx.web3?.eth.requestAccounts()
    } catch (error: any) {
      console.error(error)
      notificationCtx.error(error.message)
    }
  }

  async function switchChain() {
    try {
      await getInjectedProvider().request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: walletCtx.web3?.utils.toHex(CHAIN_ID) }]
      });
    } catch (error: any) {
      console.error(error)
      notificationCtx.error(error.message)
    }
  }

  // still loading
  if (!walletCtx)
    return <></>

  if (!walletCtx.walletConnected)
    return <Link className="flex m-1 w-52 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg items-center justify-center" target="_blank"
                 href="https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn" >Connect Wallet</Link>

  if (walletCtx.wrongChain)
    return <button onClick={() => switchChain()} className="m-1 w-52 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Switch chain</button>

  if (!walletCtx.account)
    return <button onClick={() => connectAccount()} className="m-1 w-52 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Connect Account</button>

  // still loading
  if (walletCtx.userRegistered === undefined){
    return <Loading />
  }

  if (!walletCtx.userRegistered)
    return <OnboardButton className="m-1 w-52 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg" text={"Onboard"} />

  return <Link href={`/profile/${walletCtx.account}`} className="flex m-1 w-52 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg items-center justify-center">
    {cutAddress(walletCtx.account)}
  </Link>

}
