"use client"

import {MessagesLayout} from "@/components/messages-layout";


export default function Page({ params }: { params: { message: string } }) {
  return (
    <MessagesLayout message={params.message} hideNewMessage={true} noMessagesText="Message not found." />
  )
}
