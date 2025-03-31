import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";
import * as readline from "readline";

// Initialize environment variables
dotenv.config();

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function initializeGmxSdk() {
  try {
    // Dynamically import the GMX SDK
    const gmxSdkModule = await import('@gmx-io/sdk');
    const GmxSdk = gmxSdkModule.GmxSdk;
    
    // const sdk = new GmxSdk({
    //   chainId: 42161,
    //   rpcUrl: "https://arb1.arbitrum.io/rpc",
    //   oracleUrl: "https://arbitrum-api.gmxinfra.io",
    //   subsquidUrl: "https://gmx.squids.live/gmx-synthetics-arbitrum:live/api/graphql",
    //   subgraphUrl: "https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-arbitrum-stats/api",
    // });
    const sdk = new GmxSdk({
      chainId: 42161,
      oracleUrl: "https://arbitrum-api.gmxinfra.io",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      subgraph: {
        subsquid:
          "https://gmx.squids.live/gmx-synthetics-arbitrum:live/api/graphql",
      },
    });
    
    
    return sdk;
  } catch (error) {
    console.error("Error initializing GMX SDK:", error);
    throw error;
  }
}

async function getPositions(address: string) {
  console.log("Initializing GMX SDK...");
  const sdk = await initializeGmxSdk();
  
  console.log("Fetching market data...");
  const marketsInfoResult = await sdk.markets.getMarketsInfo();
  
  // Ensure marketsInfoData and tokensData are defined
  if (!marketsInfoResult || !marketsInfoResult.marketsInfoData || !marketsInfoResult.tokensData) {
    throw new Error("Failed to fetch market data");
  }
  
  const { marketsInfoData, tokensData } = marketsInfoResult;
  
  console.log(`Setting account address: ${address}`);
  const formattedAddress = address.startsWith('0x') ? address as `0x${string}` : `0x${address}` as `0x${string}`;
  sdk.setAccount(formattedAddress);
  
  console.log("Retrieving positions...");
  const positions = await sdk.positions.getPositions({
    marketsInfoData: marketsInfoData,
    tokensData,
    // start: 0,
    // end: 1000,
  });

  console.log(positions);
  
  return { positions, sdk, marketsInfoData, tokensData };
}

async function analyzePositions(positions: any) {
  console.log("Analyzing positions with AI...");
  
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: `Analyze these GMX trading positions and provide insights. Format the response in a clear, readable way:
    ${JSON.stringify(positions, null, 2)}`,
  });
  
  return result.text;
}

async function main() {
  console.log("GMX Position Analyzer CLI");
  console.log("=========================");
  
  rl.question("Enter wallet address (or press Enter for default 0x1234567890abcdef1234567890abcdef12345678): ", async (address) => {
    const walletAddress = address.trim() || "0x1234567890abcdef1234567890abcdef12345678";
    
    try {
      const { positions } = await getPositions(walletAddress);
      
      // Check if positions is an array and has a length property
      const positionsArray = Array.isArray(positions) ? positions : [];
      
      if (positionsArray.length === 0) {
        console.log("No positions found for this address.");
        rl.close();
        return;
      }
      
      console.log(`Found ${positionsArray.length} positions.`);
      
      rl.question("Do you want AI analysis of these positions? (y/n): ", async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const analysis = await analyzePositions(positionsArray);
          console.log("\nAI Analysis:");
          console.log("===========");
          console.log(analysis);
        } else {
          console.log("\nPositions:");
          console.log("==========");
          console.log(JSON.stringify(positionsArray, null, 2));
        }
        
        rl.close();
      });
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : String(error));
      rl.close();
    }
  });
}

// Run the main function
main(); 