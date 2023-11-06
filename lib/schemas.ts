import {ERC725JSONSchema} from "@erc725/erc725.js";


export const METADATA_DROPS_MESSAGE_INDEX_NAME = 'DropsMessageIndex';
export const METADATA_DROPS_MESSAGE_INDEX_KEY = '0x4c4262e7f2aff92ddcb621a0627b0761b019bb5c490c0fd6c044f3ec315928a2';

export const schemas: ERC725JSONSchema[] = [
  {
    name: METADATA_DROPS_MESSAGE_INDEX_NAME,
    key: METADATA_DROPS_MESSAGE_INDEX_KEY,
    keyType: 'Singleton',
    valueType: 'bytes',
    valueContent: 'JSONURL',
  },
  {
    name: "SupportedStandards:LSP3UniversalProfile",
    key: "0xeafec4d89fa9619884b60000abe425d64acd861a49b8ddf5c0b6962110481f38",
    keyType: "Mapping",
    valueType: "bytes4",
    valueContent: "0xabe425d6"
  },
  {
    name: "LSP3Profile",
    key: "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5",
    keyType: "Singleton",
    valueType: "bytes",
    valueContent: "JSONURL"
  }
];
