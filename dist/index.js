import { generateText, pipeDataStreamToResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";
import { GmxSdk } from "@gmx-io/sdk";
dotenv.config();
import { createServer } from 'http';
createServer(async (req, res) => {
    switch (req.url) {
        case '/gmx-positions': {
            try {
                // Initialize GMX SDK
                const sdk = new GmxSdk({
                    chainId: 42161,
                    rpcUrl: "https://arb1.arbitrum.io/rpc",
                    oracleUrl: "https://arbitrum-api.gmxinfra.io",
                    // For server-side implementation, you'll need to provide a walletClient directly
                    // or implement a way to receive it from the client
                    subsquidUrl: "https://gmx.squids.live/gmx-synthetics-arbitrum:live/api/graphql",
                    subgraphUrl: "https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-arbitrum-stats/api",
                });
                // Use AI to analyze GMX market data
                pipeDataStreamToResponse(res, {
                    execute: async (dataStreamWriter) => {
                        dataStreamWriter.writeData('Fetching GMX market data...');
                        try {
                            const { marketsInfoData, tokensData } = await sdk.markets.getMarketsInfo();
                            dataStreamWriter.writeData('Market data retrieved successfully');
                            // Set account if provided in query params (would need to parse query string properly)
                            const accountAddress = "0x1234567890abcdef1234567890abcdef12345678"; // Example address, replace with dynamic value
                            sdk.setAccount(accountAddress);
                            // Get positions
                            const positions = await sdk.positions.getPositions({
                                marketsInfoData,
                                tokensData,
                                start: 0,
                                end: 1000,
                            });
                            // Use AI to generate insights about the positions
                            const result = await generateText({
                                model: openai('gpt-4o'),
                                prompt: `Analyze these GMX trading positions and provide insights: ${JSON.stringify(positions)}`,
                            });
                            dataStreamWriter.writeData('AI analysis of GMX positions:');
                            dataStreamWriter.writeData(result.text);
                        }
                        catch (error) {
                            dataStreamWriter.writeData(`Error with GMX data: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    },
                    onError: error => {
                        return error instanceof Error ? error.message : String(error);
                    },
                });
            }
            catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
            }
            break;
        }
    }
}).listen(8080);
