import {Address} from "@/lib/types";
import {ipfsClient} from "@/lib/globals";

function buildKeyName(sender: string): string {
  return `user-key-${sender.toLowerCase()}`;
}

export async function addAndPin(fileContent: string) {
  const addResult = await ipfsClient.add(fileContent, {pin: true});
  return addResult.cid.toString();
}

export async function updateIpnsLink(cid: string, user: Address): Promise<string> {
  const key = buildKeyName(user);

  const publishResult = await ipfsClient.name.publish(cid, {key: key});

  return buildIpnsUrl(publishResult.name);
}

export async function getUserKey(user: Address): Promise<undefined | string> {
  const keyName = buildKeyName(user);

  const keys = await ipfsClient.key.list();
  const key = keys.find(k => k.name === keyName);
  if (key)
    return key.id;
  return undefined

}

export async function createUserKey(user: Address) {
  const keyName = buildKeyName(user);

  const key = await ipfsClient.key.gen(keyName);
  return key.id;
}

export async function getOrCreateUserKey(user: Address): Promise<string> {
  let key = await getUserKey(user);
  if (!key)
    key = await createUserKey(user)

  return key;
}

export function buildIpnsAddress(key: string): string {
  return `/ipns/${key}`
}

export function buildIpnsUrl(key: string): string {
  const ipnsurl = process.env.IPNS_URL;
  return `${ipnsurl}${ipnsurl.endsWith("/")? "":"/"}${key}`;
}

export function buildIpfsAddress(key: string): string {
  return `/ipfs/${key}`
}

export function buildIpfsUrl(cid: string): string {
  const ipfsurl = process.env.NEXT_PUBLIC_IPFS_URL;
  return `${ipfsurl}${ipfsurl.endsWith("/")? "":"/"}${cid.startsWith("/ipfs/")?cid.substring("/ipfs/".length):cid}`;
}

export function ipfsToUrlIfApplicable(url: string | undefined) {
  if (!url)
    return undefined
  if (url.indexOf('ipfs://') !== -1)
    return url.replace('ipfs://', process.env.IPFS_GATEWAY);
  return url;
}