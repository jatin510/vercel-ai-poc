import type { IncreasePositionAmounts } from "@gmx-io/sdk/types/orders";    
import { GmxSdk } from "@gmx-io/sdk";

const sdk = new GmxSdk({
  chainId: 42161,
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  oracleUrl: "https://arbitrum-api.gmxinfra.io",
});

const { marketsInfoData, tokensData } = await sdk.markets.getMarketsInfo();

if (!marketsInfoData || !tokensData) {
  throw new Error("No markets or tokens info data");
}

const marketInfo = marketsInfoData["0x47c031236e19d024b42f8AE6780E44A573170703"];
const collateralToken = tokensData["0x912CE59144191C1204E64559FE8253a0e49E6548"];
sdk.orders.createIncreaseOrder({
  marketsInfoData: marketsInfoData!,
  tokensData,
  isLimit: false,
  isLong: true,
  marketAddress: marketInfo.marketTokenAddress,
  allowedSlippage: 50,
  collateralToken,
  collateralTokenAddress: collateralToken.address,
  receiveTokenAddress: collateralToken.address,
  fromToken: tokensData["0x912CE59144191C1204E64559FE8253a0e49E6548"],
  marketInfo,
  indexToken: marketInfo.indexToken,
  increaseAmounts: {
    initialCollateralAmount: 3000000n,
    initialCollateralUsd: 2999578868393486100000000000000n,
    collateralDeltaAmount: 2997003n,
    collateralDeltaUsd: 2996582289103961007386100000000n,
    indexTokenAmount: 1919549334876037n,
    sizeDeltaUsd: 5993158579050185227800000000000n,
    sizeDeltaInTokens: 1919536061202302n,
    estimatedLeverage: 20000n,
    indexPrice: 3122169600000000000000000000000000n,
    initialCollateralPrice: 999859622797828700000000000000n,
    collateralPrice: 999859622797828700000000000000n,
    triggerPrice: 0n,
    acceptablePrice: 3122191190655414690893787784152819n,
    acceptablePriceDeltaBps: 0n,
    positionFeeUsd: 2996579289525092613900000000n,
    swapPathStats: undefined,
    uiFeeUsd: 0n,
    swapUiFeeUsd: 0n,
    feeDiscountUsd: 0n,
    borrowingFeeUsd: 0n,
    fundingFeeUsd: 0n,
    positionPriceImpactDeltaUsd: 41444328240807630917223064n,
  },
});