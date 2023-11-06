import {Address, DBMessage} from "@/lib/types";
import TimeAgo from 'timeago-react'
import {MessageControls} from "@/components/message-controls";
import {useState} from "react";
import Image from "next/image";
import {OnboardOrNewMessage} from "@/components/onboard-or-new-message";
import {ProfileDetails} from "@/components/profile-details";
import Link from "next/link";
import {MAX_LEVEL_THREADLINE} from "@/lib/constants";


export function Message({message, onReply, level, likes, onLike, onRemove, following, onFollow, showCategory}:
                          {message: DBMessage, onReply: () => void, level: number, likes: {[hash: string]: boolean | null}, onLike: (hash: string, like: boolean) => void,
                            onRemove: (hash: string) => void, following: {[user: Address]: boolean}, onFollow: (user: Address, follow: boolean) => void, showCategory?: boolean}) {
  const [replyDialogOpen, switchDialogOpen] = useState<boolean>(false);
  const [isShowProfile, setIsShowProfile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [delayHandler, setDelayHandler] = useState<any>()

  function handleMouseEnter(){
    setDelayHandler(setTimeout(() => {
        setIsShowProfile(true)
    }, 350))
  }

  function handleMouseLeave() {
    clearTimeout(delayHandler)
  }

  function openReplyDialog() {
    switchDialogOpen(true);
  }

  function onReplyCb() {
    switchDialogOpen(false);
    onReply();
  }

  if (isCollapsed) {
    return (
      <div className="flex">
        <div className="flex">
          {[...Array(Math.min(level, MAX_LEVEL_THREADLINE))].map((_,i) => {
            return <div key={i} className="w-4 h-full ml-[5px] inline-block" >
              <i className="border-r-2 border-r-gray-400 h-full w-1/2 block"></i>
            </div>
          })}
        </div>
        <div className="relative rounded-xl border border-gray-200 bg-white shadow-md px-5 py-1 mt-1 w-full">
          <div className="w-full">
            <div className="">
              <div className="flex space-x-3 w-full">
                <button onClick={() => setIsCollapsed(false)} className="focus:outline-none border border-gray-300 text-black bg-white hover:bg-gray-300 font-medium rounded-lg text-md px-2 py-1">↓</button>
                <div className="flex justify-between w-full pt-2">
                  <Link href={`/profile/${message.user?.address}`} className="text-sm font-bold">{message.user?.name?.trim().length? message.user.name: message.sender}</Link>
                  <TimeAgo title={new Date(message.timestamp).toUTCString()} className="text-sm" datetime={message.timestamp} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex">
        <div className="flex">
          {[...Array(Math.min(level, MAX_LEVEL_THREADLINE))].map((_,i) => {
            return <div key={i} className="w-4 h-full ml-[5px] inline-block" >
              <i className="border-r-2 border-r-gray-400 h-full w-1/2 block"></i>
            </div>
          })}
        </div>
        <div className="relative rounded-xl border border-gray-200 bg-white shadow-md px-5 py-3 mt-1 w-full">
          {message.user &&
              <div className={`${isShowProfile ? "z-20" : "opacity-0 -z-10"} absolute transition-opacity duration-300` }
                   onMouseLeave={()=> setIsShowProfile(false)}>
                  <ProfileDetails user={message.user} following={following[message.sender as Address]} onFollow={onFollow} isCard={true} />
              </div>}
          <div className="grid grid-cols-[10%_90%] w-full">
            <div className="w-full">
              <Image onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
                     className="rounded-full border border-black z-10 relative" src={message.user?.profileImage ?? "/img/placeholder_avatar.svg"} width={40} height={40} alt="avatar"/>
            </div>
            <div className="pb-2">
              <div className="flex justify-between">
                <Link href={`/profile/${message.user?.address}`} className="text-sm font-bold">{message.user?.name?.trim().length? message.user.name: message.sender}</Link>
                <TimeAgo title={new Date(message.timestamp).toUTCString()} className="text-sm" datetime={message.timestamp} />
              </div>
              <h2>{message.content}</h2>
              <div>
                {message.medias?.map((m, i) => <div key={i} className="pt-6">
                  {(m.type === "video" && <video src={m.url} controls={true} width="100%" />) || <img src={m.url} width="100%"/>}
                </div>)}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            {showCategory?
                <Link href={`/category/${message.category}`} className="text-xs text-white bg-blue-900 py-0.5 px-1 mb-1" >
                  {message.category}
                </Link>
              : <div />
            }
            <div className="flex justify-end space-x-1 flex-wrap max-w-sm">
              {message.tags?.map(tag => <div className="text-xs text-white bg-blue-700 py-0.5 px-1 rounded-2xl " key={tag}>{tag}</div>)}
            </div>
          </div>
          <div className="flex align-bottom">
            <MessageControls message={message} openReplyDialog={openReplyDialog} like={likes[message.hash]} onLike={onLike} onRemove={onRemove} onCollapse={() => setIsCollapsed(true)}/>
          </div>
        </div>
      </div>
      {replyDialogOpen &&
        <div>
          <OnboardOrNewMessage onNewMessage={onReplyCb} parent={{user: message.sender as Address, hash: message.hash}} category={message.category}/>
        </div>}
      {message.replies?.map(m => {
        return <Message key={m.hash} message={m} onReply={onReply} level={level+1} likes={likes} onLike={onLike} onRemove={onRemove} following={following} onFollow={onFollow} showCategory={showCategory}/>
      })}
    </>
  )
}
