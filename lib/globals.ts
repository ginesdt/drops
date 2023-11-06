import { PrismaClient } from '@prisma/client'
import {create} from "kubo-rpc-client";
import Web3 from "web3";


// prisma client
// -------------
const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export {prisma}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


// ipfs client
// -----------

const ipfsClientSingleton = () => {
  return create({ url: process.env.IPFS_RPC_API_URL });
}

type IPFSClientSingleton = ReturnType<typeof ipfsClientSingleton>

const globalForIpfs = globalThis as unknown as {
  ipfsClient: IPFSClientSingleton | undefined
}

const ipfsClient = globalForIpfs.ipfsClient ?? ipfsClientSingleton()

export {ipfsClient}

if (process.env.NODE_ENV !== 'production') globalForIpfs.ipfsClient = ipfsClient


// web3
// ----
const web3Singleton = () => {
  return new Web3(process.env.LUKSO_RPC_URL)
}

type Web3Singleton = ReturnType<typeof web3Singleton>

const globalForWeb3 = globalThis as unknown as {
  web3: Web3Singleton | undefined
}

const web3 = globalForWeb3.web3 ?? web3Singleton()

export {web3}

if (process.env.NODE_ENV !== 'production') globalForWeb3.web3 = web3
