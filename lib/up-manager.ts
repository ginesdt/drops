import {Address, DBUser, Metadata} from "@/lib/types";
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json';
import Web3 from "web3";
import {METADATA_DROPS_MESSAGE_INDEX_KEY, METADATA_DROPS_MESSAGE_INDEX_NAME, schemas} from "@/lib/schemas";
import {ERC725} from "@erc725/erc725.js";
import {LSP3ProfileMetadata} from "@lukso/lsp-smart-contracts";

export async function setUPData(web3: Web3, account: Address, data: Metadata): Promise<any> {
  const abi: any[] = LSP0ERC725Account.abi;
  const contract = new web3.eth.Contract(abi, account);
  return contract.methods.setData(data.key, data.value).send({from: account})
}

export async function getUPData(web3: Web3, account: Address) {
  const abi: any[] = LSP0ERC725Account.abi;
  const contract = new web3.eth.Contract(abi, account);
  const message = await contract.methods.getData(METADATA_DROPS_MESSAGE_INDEX_KEY).call();
  return ERC725.decodeData([{
    keyName: METADATA_DROPS_MESSAGE_INDEX_KEY,
    value: message
  }],
    schemas)
}

export function buildStorageInfo(indexLink: string): string {
  return JSON.stringify(buildERC725Metadata(indexLink));
}

export function buildERC725Metadata(indexLink: string): { index: string; addMessageAPI: string } {
  const apiUrl = process.env.NEXT_PUBLIC_DROPS_API_URL;
  return {
    index: indexLink,
    addMessageAPI: `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}add-message`
  };
}

export function buildMetadata(user: DBUser): Metadata {
  const json = buildERC725Metadata(user.indexLink)

  const data = ERC725.encodeData([{
    keyName: METADATA_DROPS_MESSAGE_INDEX_NAME,
    value: {
      json,
      url: user.storageInfoLink
    }
  }], schemas);
  return {key: data.keys[0], value: data.values[0]}
}

export async function parseMetadata(metadata: {[key: string]: any; }, fetchIndex?: boolean): Promise<{indexLink?: string, storageInfoLink: string}| undefined> {
  if (!metadata[0] || !metadata[0].value)
    return undefined
  const storageInfoLink = metadata[0].value.url;
  let indexLink = undefined;
  if (fetchIndex) {
    const storageInfo = await fetch(storageInfoLink);
    const storageInfoJson = await storageInfo.json();
    indexLink = storageInfoJson.index;
  }

  return {indexLink, storageInfoLink}
}

export async function fetchUPProfile(web3: Web3, user: Address): Promise<LSP3ProfileMetadata> {

  const erc725 = new ERC725(schemas, user, web3.currentProvider, {ipfsGateway: process.env.IPFS_GATEWAY});
  const data = await erc725.fetchData("LSP3Profile");
  const profile = data.value as { LSP3Profile: LSP3ProfileMetadata }

  return profile.LSP3Profile
}

export async function fetchUPIndexUrl(web3: Web3, user: Address): Promise<string | undefined> {
  const erc725 = new ERC725(schemas, user, web3.currentProvider);
  const data = await erc725.fetchData(METADATA_DROPS_MESSAGE_INDEX_NAME) as unknown as { value?: { index: string } };
  return data.value?.index
}

export async function isValidSignature(web3: Web3, user: Address, hash: string, signature: string) {
  const erc725 = new ERC725(schemas, user, web3.currentProvider);
  return await erc725.isValidSignature(hash, signature)
}

export function isUserEnrolled(indexUrl: string) {
  return indexUrl.startsWith(process.env.IPNS_URL as string);
}