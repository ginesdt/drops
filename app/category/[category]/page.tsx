"use client"

import {MessagesLayout} from "@/components/messages-layout";


export default function Page({ params }: { params: { category: string } }) {
  return (
    <MessagesLayout category={params.category}/>
  )
}
