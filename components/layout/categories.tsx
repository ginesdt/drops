"use client"

import {usePathname} from "next/navigation";
import Link from "next/link";
import {useContext} from "react";
import {WalletContext} from "@/components/context/wallet-context";
import {CATEGORIES, DEFAULT_CATEGORY} from "@/lib/constants";


export function Categories({className}: {className?: string}) {
  const pathname = usePathname()
  const walletCtx = useContext(WalletContext)

  const enableFeed = walletCtx.walletConnected && walletCtx.account && walletCtx.userRegistered

  const isFeeds = pathname === "/feeds";
  let category : string|undefined;
  if (pathname && pathname.startsWith("/category/")) {
    category = pathname.substring("/category/".length)
  } else if (pathname === "/"){
    category = DEFAULT_CATEGORY
  }

  return (
    <div className={className}>
      <div className="p-3 bg-white rounded-xl">
        <Link href="/feeds/" className={`block my-1 w-full hover:bg-blue-300 text-black font-bold py-2 px-4 rounded-lg text-left ${isFeeds ? "border-2 border-blue-500 text-blue-500" : ""} ${!enableFeed? "text-gray-400 pointer-events-none" : ""}`}>Feeds</Link>
        <div className="w-full border-b border-black" />
        {CATEGORIES.map(c => <Link href={`/category/${c.value}`} key={c.value} className={`block my-1 w-full hover:bg-blue-300 text-black font-bold py-2 px-4 rounded-lg text-left ${category === c.value ? "border-2 border-blue-500 text-blue-500" : ""}`}>{c.name}</Link>)}
      </div>
    </div>
  )
}