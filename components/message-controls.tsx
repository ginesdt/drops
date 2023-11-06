import Image from "next/image";
import {DBMessage, OperationType} from "@/lib/types";
import {useContext, useState} from "react";
import {NotificationContext} from "@/components/context/notification-context";
import {WalletContext} from "@/components/context/wallet-context";
import {sendControlMessage} from "@/lib/message-utils";


export function MessageControls({message, openReplyDialog, like, onLike, onRemove, onCollapse}: {message: DBMessage, openReplyDialog: () => void, like?: boolean|null, onLike: (hash: string, like: boolean) => void, onRemove: (hash: string) => void, onCollapse: () => void}) {

  const notificationCtx = useContext(NotificationContext);
  const walletCtx = useContext(WalletContext);
  const [showShareMenu, setShowShareMenu] = useState(false)

  const isOwner = message.sender === walletCtx.account;

  async function shareMessage(permalink: boolean) {
    await navigator.clipboard.writeText(permalink ? message.url: `${window.location.origin}/message/${message.hash}`);
    notificationCtx.info('Link copied to clipboard');
  }

  async function upvote(){
    const {web3, account} = walletCtx
    if (web3 && account) {
      const r = await sendControlMessage({
        web3,
        account,
        operation: OperationType.Like,
        data: JSON.stringify({
          messageHash: message.hash,
          messageSender: message.sender
        }),
        origin: window.location.href
      })
      if (r.success)
        onLike(message.hash, true)
    } else {
      notificationCtx.info("Connect your wallet to upvote")
    }
  }

  async function downvote(){
    const {web3, account} = walletCtx
    if (web3 && account) {
      const r = await sendControlMessage({
        web3, account, operation: OperationType.Dislike, data: JSON.stringify({
          messageHash: message.hash,
          messageSender: message.sender
        }),
        origin: window.location.href
      })
      if (r.success)
        onLike(message.hash, false)
    } else {
      notificationCtx.info("Connect your wallet to downvote")
    }
  }

  async function removeMessage() {
    const {web3, account} = walletCtx
    if (web3 && account) {
      const r = await sendControlMessage({
        web3, account, operation: OperationType.HideMessage, data: JSON.stringify({
          messageHash: message.hash
        }),
        origin: window.location.href
      })
      if (r.success)
        onRemove(message.hash)
    }
  }

  return (
    <div className="w-full flex space-x-4">
      <button onClick={onCollapse} className="focus:outline-none border border-gray-300 text-black bg-white hover:bg-gray-300 font-medium rounded-lg text-md px-2 py-1">↑</button>
      <div onClick={openReplyDialog} className="flex items-center space-x-2 hover:bg-gray-300 w-fit pr-2 cursor-pointer">
        <Image className="" width="24" height="32" src={"/img/reply.svg"} alt="reply" />
        <div>Reply</div>
      </div>
      <div className="flex space-x-1">
        <div onClick={upvote} className={`flex items-center space-x-2 hover:bg-gray-300 w-fit ${like === true ? "pointer-events-none" : "cursor-pointer"}`}>
          {like === true ?
            <Image className="" width="24" height="24" src={"/img/vote_up_filled.svg"} alt="up_vote" />:
            <Image className="" width="24" height="24" src={"/img/vote_up.svg"} alt="up_vote" />
          }
        </div>
        <div className="flex items-center space-x-2">
          {message.likes ?? 0}
        </div>
        <div onClick={downvote} className={`flex items-center space-x-2 hover:bg-gray-300 w-fit ${like === false ? "pointer-events-none" : "cursor-pointer"}`}>
          {like === false ?
            <Image className="" width="24" height="24" src={"/img/vote_down_filled.svg"} alt="down_vote_filled" />:
            <Image className="" width="24" height="24" src={"/img/vote_down.svg"} alt="down_vote" />
          }
        </div>
      </div>
      <div className="flex items-center space-x-2 w-fit pr-2 cursor-pointer relative">
        {showShareMenu &&
        <div onMouseLeave={() => setShowShareMenu(false)} className="bg-white absolute top-0 z-20 w-24">
          <button onClick={() => shareMessage(true)} className="p-2 bg-gray-200 hover:bg-gray-300 w-full text-left" >Metadata</button>
          <button onClick={() => shareMessage(false)}className="p-2 bg-gray-200 hover:bg-gray-300 w-full text-left" >Link</button>
        </div>
        }
        <div onClick={() => setShowShareMenu(true)} className="flex hover:bg-gray-300" >
          <Image className="" width="24" height="32" src={"/img/share.svg"} alt="share" />
          <div>Share</div>
        </div>
      </div>
      {isOwner && <div onClick={removeMessage} className="!ml-auto flex items-center text-xs cursor-pointer hover:bg-gray-300 px-2">Remove Post</div>}
    </div>
  )
}
