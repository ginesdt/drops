"use client"

import {MessagesLayout} from "@/components/messages-layout";

import {DEFAULT_CATEGORY} from "@/lib/constants";


export default function Home() {

  return (
    <MessagesLayout category={DEFAULT_CATEGORY}/>
  )
}
