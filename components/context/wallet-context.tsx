"use client"

import React, {useEffect, useState} from "react";
import {Address} from "@/lib/types";
import Web3 from "web3";
import {getUPData, parseMetadata} from "@/lib/up-manager";
import {CHAIN_ID, getInjectedProvider} from "@/lib/constants";

const WalletContext = React.createContext({
  account: undefined as Address|undefined,
  web3: undefined as Web3|undefined,
  userRegistered: undefined as boolean|undefined,
  walletConnected: undefined as boolean|undefined,
  wrongChain: undefined as boolean|undefined,
  refresh: () => {}
});

const WalletProvider = (props: {children: any}) => {
  const [web3, setWeb3] = useState<Web3>();
  const [account, setAccount] = useState<Address>();
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [wrongChain, setWrongChain] = useState(false);
  const [userRegistered, setUserRegistered] = useState<boolean>();
  const [refreshRegistered, setRefreshRegistered] = useState<boolean>(false);

  useEffect(() => {
    const provider = getInjectedProvider()
    if (provider) {
      setWalletConnected(true);
      listenForAccountChanges();
      const web3 = new Web3(provider);
      setWeb3(web3);
      !account && getCurrentAccount(web3);
      checkChain(web3);
    } else {
      setWalletConnected(false);
    }
  }, [account]);

  useEffect(() => {
    if (web3 && account) {

      const checkIsRegistered = async () => {
        if (web3 && account) {
          const metadata = await getUPData(web3, account);
          const metadataInfo = await parseMetadata(metadata, false);

          if (metadataInfo && metadataInfo.storageInfoLink) {
            setUserRegistered(true);
          } else {
            setUserRegistered(false);
          }
        }
      }

      checkIsRegistered().catch(error => {
        setUserRegistered(false);
        console.error(error);
      });
    }
  }, [web3, account, refreshRegistered]);

  function listenForAccountChanges (){
    getInjectedProvider().on('accountsChanged', function (accounts: Address[]) {
      if (accounts.length) {
        if (accounts[0] !== account) {
          setAccount(accounts[0] as Address);
        }
      } else {
        setUserRegistered(undefined);
        setAccount(undefined);
      }
    })

    getInjectedProvider().on('chainChanged', function ({chainId}: {chainId: number|string}) {
      if (typeof chainId === 'string')
        chainId = parseInt(chainId)
      setWrongChain(chainId !== CHAIN_ID)
    });
  }

  async function getCurrentAccount(web3: Web3) {
    await web3.eth.getAccounts().then((accounts) => {
      setAccount(accounts[0] as Address);
      return accounts[0];
    });
  }

  async function checkChain(web3: Web3) {
    await web3.eth.getChainId((error, version: number) => {
      setWrongChain(version !== CHAIN_ID)
    });
  }

  async function refresh () {
    setRefreshRegistered((v)=>!v)
  }

  return (
    <WalletContext.Provider value={{account, web3, userRegistered, walletConnected, wrongChain, refresh}}>
      {props.children}
    </WalletContext.Provider>
  );
};


export {WalletProvider};
export {WalletContext};
