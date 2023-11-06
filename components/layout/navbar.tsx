"use client";

import Image from "next/image";
import Link from "next/link";
import {ConnectWallet} from "@/components/connect-wallet";
import {useContext} from "react";
import useSWR from "swr";
import {fetcher} from "@/lib/message-utils";
import {WalletContext} from "@/components/context/wallet-context";
import {GetUserResponseData} from "@/lib/types";


export default function NavBar() {

  const walletCtx = useContext(WalletContext)

  const {data, error, isLoading} = useSWR<GetUserResponseData>(walletCtx.account && walletCtx.userRegistered ? `/api/get-user?user=${walletCtx.account}` : null, fetcher);
  let profileImage;
  if (data?.success) {
    profileImage = data.user.profileImage ?? "/img/placeholder_avatar.svg"
  }

  return (
    <>
      <div className={"fixed top-0 w-full flex justify-center border-b border-blue-300 bg-blue-200 backdrop-blur-xl z-30 transition-all"}>
        <div className="pl-14 flex h-14 max-w-screen-xl w-full justify-between">
          <Link href="/" className="flex items-center text-2xl pr-32 text-indigo-900 font-light ">
            <Image
              src="/img/drops_logo.png"
              alt="Drops logo"
              width="40"
              height="40"
              className="mr-2 rounded-sm" />
            <h1>Drops</h1>
          </Link>
          <div className="flex">
            {profileImage &&
                <Link href={`/profile/${walletCtx.account}`}>
                    <Image className="m-1 rounded-full border border-white" src={profileImage} width={48} height={48} alt="avatar"/>
                </Link>
            }
            <ConnectWallet />
          </div>
        </div>
      </div>
    </>
  );
}
