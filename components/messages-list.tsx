import {Message} from "@/components/message";
import {DBMessage, Address} from "@/lib/types";


export function MessagesList({messages, onNewMessage, likes, onLike, onFollow, following, noMessagesText, showCategory, onRemove}:
                               {messages: DBMessage[], onNewMessage: () => void, likes: {[hash: string]: boolean | null}, onLike: (hash: string, like: boolean) => void,
                                 onRemove: (hash: string) => void, following: {[user: Address]: boolean}, onFollow: (user: Address, follow: boolean) => void, noMessagesText?: string, showCategory?: boolean}) {
  return (
    <>
      {messages && messages.length > 0 ?
        messages.map(m => {
          return <Message key={m.hash} message={m} onReply={onNewMessage} level={0} likes={likes} onLike={onLike} onRemove={onRemove} following={following} onFollow={onFollow} showCategory={showCategory} />
      }) :
      <div className="w-full bg-white p-6 rounded-xl"><p>{noMessagesText || "No messages in this category. Be the first one to drop one here."}</p></div>}
    </>
  )
}
