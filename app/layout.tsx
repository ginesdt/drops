import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import {NotificationProvider} from "@/components/context/notification-context";
import NotificationBar from "@/components/notification";
import NavBar from "@/components/layout/navbar";
import {WalletProvider} from "@/components/context/wallet-context";
import {Categories} from "@/components/layout/categories";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drops',
  description: 'Web3 Secure Social Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <NotificationProvider>
            <NavBar />
            <NotificationBar />
            <main className="flex w-full justify-center pt-16">
              <div className="w-[1200px]">
                <Categories className="fixed w-[280px] h-full overflow-auto" />
                {children}
              </div>
            </main>
          </NotificationProvider>
        </WalletProvider>
      </body>
    </html>
  )
}
