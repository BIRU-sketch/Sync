/**
 * LLM System Test Script
 * Tests the Google AI Studio (Gemini) integration
 */

import 'dotenv/config';
import { getLLMSystem } from './src/llm/index';

async function testLLMSystem() {
  console.log('🧠 Testing LLM System with Google AI Studio (Gemini)\n');

  try {
    const llm = getLLMSystem();

    // Test 1: Simple question
    console.log('📝 Test 1: Simple Question');
    console.log('Question: "What is TypeScript?"\n');
    
    const answer = await llm.ask('What is TypeScript?');
    console.log('✅ Answer received');
    console.log('Response length:', answer.answer.length, 'characters');
    console.log('Confidence:', answer.confidence);
    console.log('LLM Response:');
    console.log(answer.answer);
    console.log('\n---\n');

    // Test 2: Planning
    console.log('📋 Test 2: Task Planning');
    console.log('Task: "Create a simple React component"\n');
    
    const plan = await llm.plan('Create a simple React component');
    console.log('✅ Plan created successfully!');
    console.log('Goal:', plan.goal);
    console.log('Number of steps:', plan.steps.length);
    console.log('Total estimated time:', plan.totalEstimatedTime);
    console.log('First step:', plan.steps[0]?.description);
    console.log('Plan Response:');
    console.log(JSON.stringify(plan, null, 2));
    console.log('\n---\n');

    // Test 3: Memory
    console.log('💾 Test 3: Memory System');
    const stats = llm.getStats();
    console.log('✅ Memory stats retrieved');
    console.log('Short-term entries:', stats.memory.shortTermCount);
    console.log('Long-term entries:', stats.memory.longTermCount);
    console.log('Total entries:', stats.memory.totalEntries);
    console.log('\n---\n');

    // Test 4: Memory search
    console.log('🔍 Test 4: Memory Search');
    const searchResults = llm.searchMemory('TypeScript', 3);
    console.log('✅ Search completed');
    console.log('Search results found:', searchResults.length);
    if (searchResults.length > 0) {
      console.log('Top result relevance:', searchResults[0].relevanceScore);
    }
    console.log('\n---\n');

    console.log('✅ All LLM system tests passed successfully!');
    console.log('\nThe LLM system is ready to use in your voice companion app.');

  } catch (error) {
    console.error('❌ LLM system test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have VITE_GEMINI_API_KEY set in your .env file');
    console.error('2. Get a free API key from https://makersuite.google.com/app/apikey');
    console.error('3. Ensure you have internet connectivity');
    console.error('4. Check that @google/generative-ai is installed');
    process.exit(1);
  }
}

// Run the test
testLLMSystem().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});