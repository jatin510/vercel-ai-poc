import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello, world!",
})

console.log(result)