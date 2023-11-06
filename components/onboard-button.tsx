"use client"

import {OperationType} from "@/lib/types";
import {buildMetadata, setUPData} from "@/lib/up-manager";
import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";
import {NotificationContext} from "@/components/context/notification-context";
import {sendControlMessage} from "@/lib/message-utils";

export function OnboardButton({text, className}: {text?: string, className?: string}) {

  const walletCtx = useContext(WalletContext);
  const notificationCtx = useContext(NotificationContext);

  async function onboard(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    walletCtx.refresh()


    const {web3, account} = walletCtx

    if (web3 && account) {
      const response = await sendControlMessage({web3, account, operation: OperationType.Onboard, origin: window.location.href});
      if (response.success) {
        const user = response.userInfo;
        const metadata = buildMetadata(user);
        await setUPData(web3, account, metadata).then(() => {
          walletCtx.refresh()
        }).catch((error) =>
          notificationCtx.error("Failed to update profile: " + error.message))
      } else {
        notificationCtx.error(response.error);
        console.error(`ERROR: ${response.error}`)
      }
    } else {
      notificationCtx.info("Connect your wallet to onboard")
    }
  }

  return (
    <button onClick={onboard} className={className || "mt-1 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"}>{text || "Onboard to send messages"}</button>
  )
}