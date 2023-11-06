import {useState, FormEvent, useContext} from "react";
import Image from "next/image";
import Creatable from 'react-select/creatable';
import {MultiValue} from "react-select";
import { useFilePicker } from 'use-file-picker';
import {FileSizeValidator, FileTypeValidator} from "use-file-picker/validators";
import {NotificationContext} from "@/components/context/notification-context";
import {buildIpfsUrl} from "@/lib/ipfs";
import {create} from "kubo-rpc-client";
import {WalletContext} from "@/components/context/wallet-context";
import {Address, Media} from "@/lib/types";
import {CATEGORIES, DEFAULT_CATEGORY, IPFS_BASE_URL} from "@/lib/constants";
import {sendBroadcastMessage} from "@/lib/message-utils";


export default function NewMessage({onNewMessage, parent, category}: {onNewMessage: () => void, parent?: {user: Address, hash: string}, category?: string}) {
  const [text, setText] = useState("");
  const [messageCategory, setMessageCategory] = useState(DEFAULT_CATEGORY);
  const [isExpanded, setExpanded] = useState(false);
  const [tags, setTags] = useState<MultiValue<{value: string}>>([]);
  const [medias, setMedias] = useState<string[]>([]);
  const [isSending, setSending] = useState<boolean>(false);
  const { openFilePicker, filesContent, loading, errors } = useFilePicker({
    accept: ['image/*', 'video/*'],
    multiple: true,
    readAs: 'DataURL',
    validators: [
      new FileTypeValidator(['jpg', 'JPG', 'jpeg', 'JPEG', 'gif', 'GIF', 'png', 'PNG', 'mp4', 'MP4']),
      new FileSizeValidator({ maxFileSize: 2 * 1024 * 1024 /* 2 MB */ }),
    ],
    onFilesSuccessfullySelected: ({ plainFiles, filesContent }) => {
      medias.push(...filesContent.map(fc => fc.content))
    }
  });

  const walletCtx = useContext(WalletContext);
  const notificationCtx = useContext(NotificationContext);

  if (errors && errors.length > 0){
    notificationCtx.error((errors[0] as {name: string, reason: string}).reason);
    errors.pop()
  }

  function clearMessage() {
    setText("");
    setTags([]);
    setMedias([]);
  }

  async function uploadMedia(): Promise<Media[]> {
    const ipfshttpClient = create({url: IPFS_BASE_URL});

    const uploadedMedias: Media[] = []
    for (const media of medias) {
      const response = await fetch(media)
      const result = await ipfshttpClient.add(await response.blob(), {pin: true})
      uploadedMedias.push({url: buildIpfsUrl(result.cid.toString()), type: media.startsWith("data:video")? "video": "image"})
    }
    return uploadedMedias;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const {web3, account} = walletCtx
    if (web3 && account) {
      setSending(true);

      const uploadedMedias = medias.length > 0 ? await uploadMedia(): undefined
      try {
          const message = await sendBroadcastMessage({web3, account, content: text, category: (category || messageCategory), tags: tags.map(t => t.value), medias: uploadedMedias, parent, origin: window.location.href});
          if (message.success) {
            clearMessage();
            onNewMessage();
          } else {
            notificationCtx.error(`Failed to send message: ${message.error}`)
          }
      } catch (error: any) {
            notificationCtx.error(`Failed to send message: ${error.message}`)
      } finally {
        setSending(false);
      }
    } else {
      notificationCtx.info("Connect your wallet to send a message");
    }
  }

  const isReply = parent !== undefined;

  return (
    <div className="mb-5">
      <form onSubmit={onSubmit}>
        <div className={`grid ${category ? "grid-cols-[94%_6%]" : "grid-cols-[20%_74%_6%]"}`}>
          {!category &&
            <select disabled={isReply || isSending} onChange={(e) => setMessageCategory(e.target.value)} className="bg-gray-50 border border-gray-300 rounded-l-lg block w-full p-2.5" >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
            </select>}
          <input disabled={isSending} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                 placeholder="Drop a message" type="text"
                 autoComplete="off"
                 name="text"
                 value={text} onChange={e => setText(e.target.value)}/>
          <div>
            <button type="button" className="focus:outline-none border border-gray-300 text-black bg-white hover:bg-gray-300 font-medium rounded-lg text-md px-2 py-1 mb-2 h-full w-full" onClick={() => setExpanded(!isExpanded)}>{isExpanded?"↑":"↓"}</button>
          </div>
        </div>
        <div className="bg-white">
          {medias.length > 0 && medias.map((m, i) => <div className={`pt-6 px-6 ${i === medias.length - 1 ? "pb-6" : ""}`} key={i}>
            <div className="relative">
              <Image onClick={() => {
                const mediasCp = medias.slice();
                mediasCp.splice(i, 1);
                setMedias(mediasCp)}} src="/img/close.svg" height={24} width={24} alt="remove" className="absolute right-[-12px] top-[-12px]" />
              {(m.startsWith("data:video") && <video src={m} controls={true} width="100%" />) || <img src={m} width="100%" />}
            </div>
          </div>)}
        </div>
        {isExpanded &&
          <div className="flex space-x-5 w-full bg-white min-h-9 rounded-lg pl-2 items-center">
            <div className="hover:bg-gray-300">
              <Image onClick={() => openFilePicker()} width="32" height="32" src="/img/upload-media.svg" alt="Add Media" />
            </div>
            <div>
              <label className="flex items-center h-full space-x-1">
                <div>Tags:</div>
                <Creatable placeholder="Add Tag..." noOptionsMessage={() => "Type to Add"} isDisabled={isSending} className="max-w-sm text-sm py-1" isClearable isMulti onChange={e => setTags(e)} value={tags}
                onInputChange={newValue => (newValue.length <= 40 ? newValue : newValue.substring(0, 40))}
                ></Creatable>
              </label>
            </div>
          </div>
        }
        <button disabled={isSending || (text.trim().length === 0 && medias.length === 0)} type="submit" className="mt-1 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 transition-colors duration-300">{ isSending? "Sending" : "Send" }</button>
      </form>
    </div>
  )
}

