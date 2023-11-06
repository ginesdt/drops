"use client"

import {MessagesLayout} from "@/components/messages-layout";
import {ProfileDetails} from "@/components/profile-details";
import useSWR from "swr";
import {fetcher} from "@/lib/message-utils";
import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";
import {GetStatsResponseData, GetUserResponseData} from "@/lib/types";

export default function Page({ params }: { params: { address: string } }) {

  const {data, error, isLoading} = useSWR<GetUserResponseData>(`/api/get-user?user=${params.address}`, fetcher);

  const walletCtx = useContext(WalletContext)

  const {data: followingData, error: followingError, isLoading: followingIsLoading, mutate: mutateFollowing} = useSWR<GetStatsResponseData>(walletCtx.account ? `/api/get-stats?type=following&address=${walletCtx.account}&user=${params.address}` : null, fetcher);

  let following;
  if (!followingIsLoading && followingData?.success && followingData.stats.following) {
    following = followingData.stats.following[params.address]
  }

  let user;
  if (data?.success) {
    user = data.user
  }

  async function handleOnFollow() {
    await mutateFollowing()
  }

  return <>
    <MessagesLayout sender={params.address} noMessagesText={"No messages found for user."} hideNewMessage={true} >
      {user &&
          <div className="relative mb-3">
              <ProfileDetails user={user} following={following?? undefined} onFollow={() => handleOnFollow} isCard={false} />
          </div>
      }
    </MessagesLayout>
  </>

}