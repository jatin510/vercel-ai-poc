import { GmxSdk } from "@gmx-io/sdk";
// import { useWallet } from "wagmi";

const sdk = new GmxSdk({
  chainId: 42161,
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  oracleUrl: "https://arbitrum-api.gmxinfra.io",
//   walletClient: useWallet().walletClient,
  subsquidUrl: "https://gmx.squids.live/gmx-synthetics-arbitrum:live/api/graphql",
  subgraphUrl: "https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-arbitrum-stats/api",
});

(async()=>{
    const { marketsInfoData, tokensData, } = await sdk.markets.getMarketsInfo();
    const { marketsData } = await sdk.markets.getMarkets();

    

sdk.setAccount("0x1234567890abcdef1234567890abcdef12345678");

if(!tokensData|| !marketsInfoData|| !marketsData){
    return;
}
sdk.positions
  .getPositions({
    marketsData,
    tokensData,
    start: 0,
    end: 1000,
  })
  .then((positions) => {
    console.log(positions);
  });
})()