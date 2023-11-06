import {Address, DBUser, OperationType} from "@/lib/types";
import Image from "next/image";
import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";
import {NotificationContext} from "@/components/context/notification-context";
import Link from "next/link";
import {sendControlMessage} from "@/lib/message-utils";



export function ProfileDetails({user, following, onFollow, isCard}: {user: DBUser, following?: boolean, onFollow: (user: Address, follow: boolean) => void, isCard: boolean}) {

  const walletCtx = useContext(WalletContext);
  const notificationCtx = useContext(NotificationContext);

  async function followUser(){
    const {web3, account} = walletCtx
    if (web3 && account) {
      const r = await sendControlMessage({web3, account, operation: OperationType.Follow, data: JSON.stringify({
          userAddress: user.address,
        }),
        origin: window.location.href
      })
      if (r.success)
        onFollow(user.address as Address, true)
    } else {
      notificationCtx.info("Connect your wallet to follow this user")
    }
  }

  async function unfollowUser(){
    const {web3, account} = walletCtx
    if (web3 && account) {
      const r = await sendControlMessage({web3, account, operation: OperationType.Unfollow, data: JSON.stringify({
          userAddress: user.address,
        }),
        origin: window.location.href
      })
      if (r.success)
        onFollow(user.address as Address, false)
    } else {
      notificationCtx.info("Connect your wallet to unfollow this user")
    }
  }

  if (isCard)
    return (
      <div className="bg-gray-200 w-40 rounded-xl shadow-2xl p-2">
        <Link className="" href={`/profile/${user.address}`}>
          <div className="w-full px-2">
            {user.backgroundImage &&
                <div className="h-20 w-full rounded absolute px-[inherit] right-0 left-0">
                    <Image className="m-auto rounded w-full h-full object-cover" src={user.backgroundImage} width={0} height={0} sizes="100vw" alt="avatar"/>
                </div>
            }
            <div className="h-20 z-10 flex align-middle relative">
              <Image className="relative m-auto rounded-full border-4 border-gray-200 " src={user.profileImage ?? "/img/placeholder_avatar.svg"} width={60} height={60} alt="avatar"/>
              {user.avatar &&
                <div className="h-20 z-10 flex align-middle">
                  <Image className="absolute m-auto rounded-full border border-gray-200 top-12 right-10" src={user.avatar} width={20} height={20} alt="avatar"/>
                </div>
              }
            </div>
          </div>
          <div className="text-center w-full text-xs py-1 overflow-ellipsis whitespace-nowrap	overflow-hidden font-medium">{user.name?.trim().length? user.name : "No Name"}</div>
        </Link>
        <div className="text-xs font-light" >Messages: <span className="font-normal">{user.messagesCount ?? "N/A"}</span></div>
        <div className="text-xs font-light" >Followers: <span className="font-normal">{user.followersCount ?? "N/A"}</span></div>
        {following !== undefined && <button onClick={() => following ? unfollowUser() : followUser() } className="w-full text-sm py-0 bg-blue-500 hover:bg-blue-700 text-white rounded" >{following ? "Unfollow" : "Follow"}</button>}
      </div>
    )

  const link = user.links && user.links.split(",")[0];

  return (
    <div className="bg-gray-200 w-full rounded-xl shadow-2xl p-2">
      <div className="w-full px-[inherit]">
        {user.backgroundImage &&
            <div className="h-60 w-full rounded absolute px-[inherit] right-0 left-0">
                <Image className="m-auto rounded w-full h-full object-cover" src={user.backgroundImage} width={0} height={0} sizes="100vw" alt="avatar"/>
            </div>
        }
        <div className="h-60 z-10 flex align-middle relative">
          <Image className="relative m-auto rounded-full border-4 border-gray-200 " src={user.profileImage ?? "/img/placeholder_avatar.svg"} width={120} height={120} alt="avatar"/>
          {user.avatar &&
              <div className="h-20 z-10 flex align-middle">
                  <Image className="absolute m-auto rounded-full border border-gray-200 top-[150px] right-[250px]" src={user.avatar ?? "/img/placeholder_avatar.svg"} width={30} height={30} alt="avatar"/>
              </div>
          }
        </div>
      </div>
      <div className="text-center w-full text-xl pt-1 overflow-ellipsis whitespace-nowrap	overflow-hidden font-bold">{user.name?.trim().length? user.name : "No Name"}</div>
      {link && <div className="text-center"><Link href={link} target="_blank" className="text-center text-sm text-blue-500 hover:text-blue-800 w-full py-1 overflow-ellipsis break-words">{link}</Link></div>}
      {user.description && <div className="text-center w-full py-1 overflow-ellipsis break-words">{user.description}</div>}
      {user.tags && <div className="flex space-x-1 justify-end">{user.tags.split(",").map((tag, i) =><div key={i} className="text-white bg-blue-700 py-0.5 px-1 rounded-2xl text-xs w-fit">{tag}</div>)} </div>}
      <div className="flex justify-between px-6 pb-2">
        <div className="font-normal" >Messages: <span className="font-medium">{user.messagesCount ?? "N/A"}</span></div>
        <div className="font-normal" >Followers: <span className="font-medium">{user.followersCount ?? "N/A"}</span></div>
      </div>
      {following !== undefined && <button onClick={() => following ? unfollowUser() : followUser() } className="w-full py-1 bg-blue-500 hover:bg-blue-700 text-white rounded" >{following ? "Unfollow" : "Follow"}</button>}
    </div>
  )
}