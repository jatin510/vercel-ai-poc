# GMX Position Analyzer CLI

A command-line tool that fetches GMX positions from the blockchain and analyzes them using AI.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the project root with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

Run the command-line tool:

```
npm run analyze
```

The tool will:
1. Prompt you to enter a wallet address (or use the default one)
2. Fetch all GMX positions for that address
3. Ask if you want AI analysis of the positions
4. Display either the raw position data or AI-generated insights

## Example

```
$ npm run analyze

GMX Position Analyzer CLI
=========================
Enter wallet address (or press Enter for default 0x1234567890abcdef1234567890abcdef12345678): 

Initializing GMX SDK...
Fetching market data...
Setting account address: 0x1234567890abcdef1234567890abcdef12345678
Retrieving positions...
Found 3 positions.
Do you want AI analysis of these positions? (y/n): y

Analyzing positions with AI...

AI Analysis:
===========
[AI-generated analysis will appear here]
```

## Development

To run in development mode with TypeScript:

```
npm run dev
```

To build the TypeScript code:

```
npm run build
```

Then run the compiled JavaScript:

```
npm start
``` 

example command: 

```
Buy 1 ETH with 2000 USDC at market price
```