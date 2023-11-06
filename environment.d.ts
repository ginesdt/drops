declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_IPFS_URL: string,
      IPNS_URL: string,
      IPFS_RPC_API_URL: string,
      NEXT_PUBLIC_IPFS_API_URL: string,
      LUKSO_RPC_URL: string,
      IPFS_GATEWAY: string,
      TIMESTAMP_KEY: string,
      TIMESTAMP_ADDRESS: string,
      SERVICE_MESSAGES_URL: string,
      NEXT_PUBLIC_DROPS_API_URL: string,
      NEXT_PUBLIC_DROPS_BASE_URL: string,
      DATABASE_URL: string,
      DIRECT_URL: string
    }
  }
}

export {}
