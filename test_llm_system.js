import { getLLMSystem } from "./src/llm/index.ts"
const llm = getLLMSystem();
const answer = await llm.ask("Your question here");
console.log(answer);