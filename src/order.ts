import Web3, { AbiFragment } from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

// GMX V2 Order Types
export enum OrderType {
  MarketIncrease = 0,
  MarketDecrease = 1,
  LimitIncrease = 2,
  LimitDecrease = 3,
  StopLossDecrease = 4,
  TakeProfitIncrease = 5,
  StopLossAndTakeProfitIncrease = 6,
  StopLossAndTakeProfitDecrease = 7,
}

// GMX V2 Order Flags
export enum OrderFlags {
  None = 0,
  TriggerAboveThreshold = 1,
  TriggerBelowThreshold = 2,
  TriggerOnPriceIncrease = 4,
  TriggerOnPriceDecrease = 8,
}

// GMX V2 Order Router ABI (minimal version for order creation)
const ORDER_ROUTER_ABI: AbiItem[] = [
  {
    inputs: [
      {
        internalType: "address",
        name: "market",
        type: "address"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "receiver",
                type: "address"
              },
              {
                internalType: "address",
                name: "initialCollateralToken",
                type: "address"
              },
              {
                internalType: "address[]",
                name: "swapPath",
                type: "address[]"
              }
            ],
            internalType: "struct OrderRouter.CreateOrderParamsAddresses",
            name: "addresses",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "sizeDeltaUsd",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initialCollateralDeltaAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "triggerPrice",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "acceptablePrice",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256"
              }
            ],
            internalType: "struct OrderRouter.CreateOrderParamsNumbers",
            name: "numbers",
            type: "tuple"
          },
          {
            internalType: "enum OrderRouter.OrderType",
            name: "orderType",
            type: "uint8"
          },
          {
            internalType: "uint256",
            name: "flags",
            type: "uint256"
          },
          {
            internalType: "bytes32",
            name: "referralCode",
            type: "bytes32"
          }
        ],
        internalType: "struct OrderRouter.CreateOrderParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "createOrder",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

interface CreateOrderParams {
  marketAddress: string;
  initialCollateralToken: string;
  initialCollateralDeltaAmount: string;
  swapPath: string[];
  sizeDeltaUsd: string;
  triggerPrice?: string;
  acceptablePrice: string;
  executionFee: string;
  referralCode: string;
  orderType: OrderType;
  flags: OrderFlags;
}

export class GmxOrderManager {
  private web3: Web3;
  private orderRouter: Contract<typeof ORDER_ROUTER_ABI>;
  private account: string;

  constructor(
    rpcUrl: string,
    orderRouterAddress: string,
    privateKey: string
  ) {
    this.web3 = new Web3(rpcUrl);
    this.orderRouter = new this.web3.eth.Contract(
      ORDER_ROUTER_ABI,
      this.web3.utils.toChecksumAddress(orderRouterAddress)
    );
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
  }

  async createOrder(params: CreateOrderParams): Promise<string> {
    try {
      // Prepare order parameters with checksummed addresses
      const orderParams = {
        addresses: {
          receiver: this.web3.utils.toChecksumAddress(this.account),
          initialCollateralToken: this.web3.utils.toChecksumAddress(params.initialCollateralToken),
          swapPath: params.swapPath.map(addr => this.web3.utils.toChecksumAddress(addr)),
        },
        numbers: {
          sizeDeltaUsd: params.sizeDeltaUsd,
          initialCollateralDeltaAmount: params.initialCollateralDeltaAmount,
          triggerPrice: params.triggerPrice || "0",
          acceptablePrice: params.acceptablePrice,
          executionFee: params.executionFee,
        },
        orderType: params.orderType,
        flags: params.flags,
        referralCode: params.referralCode,
      };

      // Create the order with checksummed market address
      const tx = await this.orderRouter.methods
        .createOrder(this.web3.utils.toChecksumAddress(params.marketAddress), orderParams)
        .send({
          from: this.web3.utils.toChecksumAddress(this.account),
          value: params.executionFee,
        });

      return tx.transactionHash;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Helper method to create a market increase order
  async createMarketIncreaseOrder(
    marketAddress: string,
    collateralToken: string,
    collateralAmount: string,
    sizeDeltaUsd: string,
    acceptablePrice: string,
    executionFee: string,
    referralCode: string = "0x0000000000000000000000000000000000000000000000000000000000000000"
  ): Promise<string> {
    return this.createOrder({
      marketAddress,
      initialCollateralToken: collateralToken,
      initialCollateralDeltaAmount: collateralAmount,
      swapPath: [collateralToken],
      sizeDeltaUsd,
      acceptablePrice,
      executionFee,
      referralCode,
      orderType: OrderType.MarketIncrease,
      flags: OrderFlags.None,
    });
  }

  // Helper method to create a limit increase order
  async createLimitIncreaseOrder(
    marketAddress: string,
    collateralToken: string,
    collateralAmount: string,
    sizeDeltaUsd: string,
    triggerPrice: string,
    acceptablePrice: string,
    executionFee: string,
    referralCode: string = "0x0000000000000000000000000000000000000000000000000000000000000000"
  ): Promise<string> {
    return this.createOrder({
      marketAddress,
      initialCollateralToken: collateralToken,
      initialCollateralDeltaAmount: collateralAmount,
      swapPath: [collateralToken],
      sizeDeltaUsd,
      triggerPrice,
      acceptablePrice,
      executionFee,
      referralCode,
      orderType: OrderType.LimitIncrease,
      flags: OrderFlags.TriggerAboveThreshold,
    });
  }
}

// Example usage:
/*
const orderManager = new GmxOrderManager(
  "YOUR_RPC_URL",
  "0x...", // GMX Order Router address
  "YOUR_PRIVATE_KEY"
);

// Create a market increase order
const marketAddress = "0x..."; // GMX market address
const collateralToken = "0x..."; // Token address for collateral
const collateralAmount = "100000000"; // 100 USDC (6 decimals)
const sizeDeltaUsd = "1000000000000000000000000000000"; // $1000 position size
const acceptablePrice = "100000000000000000000000000000"; // $100 per unit
const executionFee = "10000000000000000"; // 0.01 ETH

const txHash = await orderManager.createMarketIncreaseOrder(
  marketAddress,
  collateralToken,
  collateralAmount,
  sizeDeltaUsd,
  acceptablePrice,
  executionFee
);

console.log("Order created:", txHash);
*/ 