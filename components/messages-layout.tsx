import {DEFAULT_LIMIT} from "@/lib/constants";
import {MessagesList} from "@/components/messages-list";
import InfiniteScroll from "react-swr-infinite-scroll";
import {useContext, useEffect, useState} from "react";
import {
  Address, DBMessage,
  GetMessagesResponseData,
  GetStatsResponseData,
} from "@/lib/types";
import useSWRInfinite from "swr/infinite";
import {fetcher} from "@/lib/message-utils";
import {WalletContext} from "@/components/context/wallet-context";
import {OnboardOrNewMessage} from "@/components/onboard-or-new-message";


function Loading() {
  return <div className="flex m-1 w-full bg-gray-300 text-black font-bold py-2 px-4 rounded-lg items-center justify-center">Loading...</div>
}

function Error() {
  return <div className="flex m-1 w-full bg-gray-300 text-black font-bold py-2 px-4 rounded-lg items-center justify-center">There were an error loading messages</div>
}

export function MessagesLayout({children, className, sender, onlyFollowing, category, noMessagesText, hideNewMessage, message} : {children?: React.ReactNode, className?: string, sender?: string, onlyFollowing?: boolean, category?: string, noMessagesText?: string, hideNewMessage?: boolean, message?: string}) {
  const [likes, setLikes] = useState<{[hash: string]: boolean | null}>({});
  const [following, setFollowing] = useState<{[user: Address]: boolean}>({});

  const origin = process.env.NEXT_PUBLIC_DROPS_BASE_URL

  const apiUrl = `/api/get-messages?origin=${origin}&limit=${DEFAULT_LIMIT}&${category?`category=${category}`:""}&${sender?`sender=${sender}`:""}&${onlyFollowing?`onlyFollowing=1`:""}&${message?`messageHash=${message}&onlyParentComments=0`:""}`;

  const swr = useSWRInfinite<GetMessagesResponseData>(
    (index, prev: GetMessagesResponseData) => {
      if (index === 0)
        return apiUrl;
      if (prev.success && prev.messages.length > 0) {
        const lastMessage = prev.messages[prev.messages.length - 1]
        return `${apiUrl}&before=${lastMessage.timestamp}&beforeId=${lastMessage.hash}`;
      }
    },
    fetcher,
    { revalidateAll: true }
  );

  const walletCtx = useContext(WalletContext);

  const {account} = walletCtx


  const { data: responses, error, mutate, size, setSize, isValidating } = swr

  useEffect(()=> {
      if (account && responses) {
        updateLikes(responses)
        updateFollowing(responses)
      }},
    [responses, account]
  )

  function getAllHashesRec(messages: DBMessage[]): string[] {
    return messages.map(m => {
      const hashes: string[] = [];
      hashes.push(m.hash)
      if (m.replies) {
        hashes.push(...getAllHashesRec(m.replies))
      }
      return hashes
    }).flat()
  }

  function updateLikes(responses: GetMessagesResponseData[]) {
    const allHashes = new Set(responses.map(r => {
      if (r.success) {
        return getAllHashesRec(r.messages)
      }
    }).flat())

    if (allHashes.size === 0)
      return;

    const newHashes = Array.from(allHashes).filter(hash => hash && !likes[hash]) as string[];
    fetch(`/api/get-stats?type=likes&address=${account}&${newHashes.map(h => `hash=${h}`).join('&')}`).then(async result => {
      const jsonResult = await result.json() as GetStatsResponseData;
      if(jsonResult.success && jsonResult.stats.likes) {
        const likes = jsonResult.stats.likes;
        setLikes(prevLikes => {
          const currentLikes = {...prevLikes};
          newHashes.forEach(h => currentLikes[h] = likes[h]);
          return currentLikes;
        })
      }
    })
  }

  function getAllUsersRec(messages: DBMessage[]) : Address[] {
    return messages.map(m => {
      const senders: Address[] = [];
      senders.push(m.sender as Address)
      if (m.replies) {
        senders.push(...getAllUsersRec(m.replies))
      }
      return senders
    }).flat()
  }

  function updateFollowing(responses: GetMessagesResponseData[]) {
    const allUsers = new Set(responses.map(r => {
      if (r.success) {
        return getAllUsersRec(r.messages);
      }
    }).flat())

    if (allUsers.size === 0)
      return;

    const newUsers = Array.from(allUsers).filter(user => user && !following[user]) as Address[];
    fetch(`/api/get-stats?type=following&address=${account}&${newUsers.map(h => `user=${h}`).join('&')}`).then(async result => {
      const jsonResult = await result.json() as GetStatsResponseData;
      if(jsonResult.success && jsonResult.stats.following) {
        const following = jsonResult.stats.following;
        setFollowing(prevFollowing => {
          const currentFollowing = {...prevFollowing};
          newUsers.forEach(h => currentFollowing[h] = following[h] === true);
          return currentFollowing;
        })
      }
    })
  }


  function handleNewMessage(){
    mutate();
  }

  function handleOnRemove(){
    mutate();
  }

  function handleOnLike(hash: string, like: boolean){
    setLikes(prevLikes => {
      return {...prevLikes, [hash] : like};
    })
    mutate();
  }

  function handleOnFollow(user: string, follow: boolean){
    setFollowing(prevFollowing => {
      return {...prevFollowing, [user]: follow};
    })
    mutate();
  }

  const isLoadingInitialData = !responses && !error;

  return (
    <>
      <div className={className || "w-[600px] ml-[290px]"}>
        {children}
        {!hideNewMessage && <OnboardOrNewMessage onNewMessage={handleNewMessage} category={category}/>}

        {(error && <Error />) ||
          isLoadingInitialData && <Loading /> ||
            <InfiniteScroll
              swr={swr}
              loadingIndicator={<Loading />}
              isReachingEnd={(swr) => {
                if (!responses || responses.length === 0)
                  return false;
                const lastResponse = responses[responses.length -1];
                return lastResponse.success === false || lastResponse.messages.length < DEFAULT_LIMIT
              }
              }>
              <div>
                {responses?.map((response, i) => {
                  if (response.success) {
                    return <MessagesList key={i} messages={response.messages} onNewMessage={handleNewMessage} likes={likes} onLike={handleOnLike} onRemove={handleOnRemove} following={following} onFollow={handleOnFollow} noMessagesText={noMessagesText} showCategory={!category}/>
                  }
                  return <Error key={i} />
                })}
              </div>
            </InfiniteScroll>
        }
      </div>
    </>)
}
