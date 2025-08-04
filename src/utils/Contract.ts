import { defineChain } from 'viem'

export const etherlink = defineChain({
  id: 128123,
  name: 'Etherlink',
  network: 'etherlink',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'XTZ',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/etherlink_testnet'],
    },
    public: {
      http: ['https://rpc.ankr.com/etherlink_testnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherlink Explorer',
      url: 'https://explorer.etherlink.com',
    },
  },
  testnet: true,
});