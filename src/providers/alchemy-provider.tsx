import React, { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
; // assuming this is also defined via `defineChain`
import { etherlink } from "../utils/Contract";     // your ether link config here

const config = getDefaultConfig({
  appName: "Dungeon",
  projectId: "1d26e3b9bc5a24bc32a6f92da8f54a85", // WalletConnect project ID
  chains: [etherlink], // ✅ include etherlink here
  ssr: false,
});

const queryClient = new QueryClient();

const CustomRainbowKitProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#2463FF",
            fontStack: "system",
            overlayBlur: "small",
            borderRadius: "large",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default CustomRainbowKitProvider;
