import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";
import * as readline from "readline";
import { GmxOrderManager, OrderType } from "./order";
import axios from "axios";

// Initialize environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.RPC_URL) {
  console.error("Error: RPC_URL is required in .env file");
  console.log("Please add one of these to your .env file:");
  console.log("RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR-API-KEY");
  console.log("RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR-API-KEY");
  console.log("RPC_URL=https://YOUR-QUICKNODE-URL.arbitrum-mainnet.quiknode.pro/YOUR-API-KEY/");
  process.exit(1);
}

if (!process.env.PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY is required in .env file");
  console.log("Please add your private key to your .env file:");
  console.log("PRIVATE_KEY=0x...");
  process.exit(1);
}

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// GMX API endpoints
const GMX_API_BASE = "https://arbitrum-api.gmxinfra.io";

// GMX Order Router address on Arbitrum
const ORDER_ROUTER_ADDRESS = "0x7b68DaeEDd4Eaaf44f02C61Cfc526FcA7B4F3dE1";

// Initialize GMX Order Manager
const orderManager = new GmxOrderManager(
  process.env.RPC_URL,
  ORDER_ROUTER_ADDRESS,
  process.env.PRIVATE_KEY
);

async function getMarketData() {
  try {
    // Get latest prices
    const [tickersResponse, signedPricesResponse] = await Promise.all([
      axios.get(`${GMX_API_BASE}/prices/tickers`),
      axios.get(`${GMX_API_BASE}/signed_prices/latest`)
    ]);

    // Helper function to find token data
    const findTokenData = (data: any[], symbol: string) => {
      return data.find(item => item.tokenSymbol === symbol);
    };

    // Extract only relevant price data
    const relevantPrices = {
      ETH: {
        price: findTokenData(tickersResponse.data, "ETH")?.maxPrice || "0",
        signedPrice: findTokenData(signedPricesResponse.data.signedPrices, "ETH")?.maxPriceFull || "0"
      },
      BTC: {
        price: findTokenData(tickersResponse.data, "BTC")?.maxPrice || "0",
        signedPrice: findTokenData(signedPricesResponse.data.signedPrices, "BTC")?.maxPriceFull || "0"
      },
      USDC: {
        price: findTokenData(tickersResponse.data, "USDC")?.maxPrice || "0",
        signedPrice: findTokenData(signedPricesResponse.data.signedPrices, "USDC")?.maxPriceFull || "0"
      }
    };

    // Validate that we have prices
    if (!relevantPrices.ETH.price || !relevantPrices.ETH.signedPrice) {
      throw new Error("Failed to fetch ETH prices");
    }

    console.log("Fetched prices:", relevantPrices);
    return relevantPrices;
  } catch (error) {
    console.error("Error fetching market data:", error);
    if (axios.isAxiosError(error)) {
      console.error("API Response:", error.response?.data);
    }
    throw error;
  }
}

async function processOrderRequest(userInput: string) {
  try {
    // Get current market data
    const marketData = await getMarketData();
    
    // Generate order parameters using AI
    const result = await generateText({
      model: openai('gpt-4'),
      prompt: `Create a GMX order based on the following request: "${userInput}"
      Current market prices: ${JSON.stringify(marketData, null, 2)}
      
      Please provide the order parameters in the following JSON format:
      {
        "marketAddress": "address",
        "collateralToken": "address",
        "collateralAmount": "string (in wei)",
        "sizeDeltaUsd": "string (in wei)",
        "acceptablePrice": "string (in wei)",
        "executionFee": "string (in wei)",
        "orderType": "MarketIncrease | LimitIncrease",
        "triggerPrice": "string (in wei) | null"
      }
      
      Use these token addresses:
      - USDC: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
      - WETH: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1
      - WBTC: 0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f
      
      Market addresses:
      - ETH/USD: 0x70d95587d40A2caf56BD97485aB3Eec10Bee6336
      - BTC/USD: 0x47c031236e19d024b42f8AE6780E44A573170703
      
      Make sure to use proper decimal places (6 for USDC, 18 for ETH, 8 for BTC)
      Use the current market prices to calculate appropriate values.
      For execution fee, use 0.01 ETH (10000000000000000 wei).
      The prices are in wei format, so use them directly without conversion.`,
    });

    console.log("AI response:", result.text);
    // Parse the AI response
    const orderParams = JSON.parse(result.text);

    // Validate order parameters
    if (!orderParams.marketAddress || !orderParams.collateralToken) {
      throw new Error("Invalid order parameters: missing required fields");
    }

    // Create the order based on type
    let txHash: string;
    if (orderParams.orderType === "MarketIncrease") {
      txHash = await orderManager.createMarketIncreaseOrder(
        orderParams.marketAddress,
        orderParams.collateralToken,
        orderParams.collateralAmount,
        orderParams.sizeDeltaUsd,
        orderParams.acceptablePrice,
        orderParams.executionFee
      );
    } else {
      if (!orderParams.triggerPrice) {
        throw new Error("Trigger price is required for limit orders");
      }
      txHash = await orderManager.createLimitIncreaseOrder(
        orderParams.marketAddress,
        orderParams.collateralToken,
        orderParams.collateralAmount,
        orderParams.sizeDeltaUsd,
        orderParams.triggerPrice,
        orderParams.acceptablePrice,
        orderParams.executionFee
      );
    }

    console.log("Order created successfully!");
    console.log("Transaction hash:", txHash);
  } catch (error) {
    console.error("Error processing order:", error);
  }
}

// Start the interactive CLI
console.log("Welcome to GMX Order Creator!");
console.log("Enter your order request in natural language (e.g., 'Buy 1 ETH with 2000 USDC at market price')");
console.log("Type 'exit' to quit\n");

rl.on('line', async (input) => {
  if (input.toLowerCase() === 'exit') {
    rl.close();
    return;
  }

  await processOrderRequest(input);
});

rl.on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});