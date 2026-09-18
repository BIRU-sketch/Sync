#!/usr/bin/env node

/**
 * ScholarXIV MCP Test Script
 * 
 * This script tests the connection to ScholarXIV MCP server and performs a simple query.
 * Usage: node test_scholarxiv_mcp.js
 * 
 * Environment variables needed:
 * - SCHOLAR_MCP_API_KEY: Your ScholarXIV API key
 */

// Load environment variables from .env file
require('dotenv').config();

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testScholarXIVMCP() {
  console.log('🔍 Testing ScholarXIV MCP Server Connection...\n');

  // Check for API key (try both common variable names)
  const apiKey = process.env.SCHOLAR_MCP_API_KEY || process.env.SCHOLAR_MCP_S2_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: SCHOLAR_MCP_API_KEY or SCHOLAR_MCP_S2_API_KEY environment variable is not set.');
    console.log('Please set it in your .env file:');
    console.log('SCHOLAR_MCP_API_KEY=your_api_key');
    console.log('or');
    console.log('SCHOLAR_MCP_S2_API_KEY=your_api_key');
    process.exit(1);
  }

  console.log('✅ API Key found');

  try {
    // Initialize MCP client
    console.log('🚀 Initializing MCP client...');
    
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', 'scholar-mcp', '--transport=stdio'],
      env: {
        SCHOLAR_MCP_API_KEY: apiKey,
        SCHOLAR_MCP_TRANSPORT: 'stdio',
        SCHOLAR_MCP_LOG_LEVEL: 'info'
      }
    });

    const client = new Client({
      name: 'scholarxiv-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    console.log('📡 Connecting to ScholarXIV MCP server...');
    await client.connect(transport);
    console.log('✅ Connected successfully!\n');

    // List available tools
    console.log('🔧 Listing available tools...');
    const toolsResponse = await client.listTools();
    console.log(`✅ Found ${toolsResponse.tools.length} available tools:\n`);
    
    toolsResponse.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      if (tool.description) {
        console.log(`   Description: ${tool.description}`);
      }
    });
    console.log('\n');

    // Test a simple paper search
    console.log('🔍 Testing paper search query...');
    console.log('Search query: "machine learning" (limit: 3)\n');
    
    try {
      const searchResult = await client.callTool({
        name: 'search',
        arguments: {
          query: 'machine learning',
          limit: 3,
          fields: ['title', 'authors', 'year', 'citationCount']
        }
      });

      console.log('✅ Search results received:\n');
      console.log(JSON.stringify(searchResult, null, 2));
      console.log('\n');

    } catch (searchError) {
      console.log('⚠️  Paper search test failed (tool name might differ):');
      console.log(`   Error: ${searchError.message}\n`);
      
      // Try alternative tool names
      console.log('🔄 Trying alternative tool names...');
      const possibleSearchTools = toolsResponse.tools
        .filter(t => t.name.toLowerCase().includes('search') || t.name.toLowerCase().includes('paper'))
        .map(t => t.name);
      
      if (possibleSearchTools.length > 0) {
        console.log(`Found possible search tools: ${possibleSearchTools.join(', ')}`);
        
        // Try the first alternative
        try {
          const altResult = await client.callTool({
            name: possibleSearchTools[0],
            arguments: { query: 'machine learning', limit: 2 }
          });
          console.log('✅ Alternative tool worked:\n');
          console.log(JSON.stringify(altResult, null, 2));
        } catch (altError) {
          console.log('⚠️  Alternative tool also failed');
        }
      } else {
        console.log('❌ No search-related tools found');
      }
    }

    // Test getting paper details if we have a paper ID
    console.log('\n🔍 Testing generic tool call...');
    try {
      // Try to get server info or status
      const infoResult = await client.callTool({
        name: toolsResponse.tools[0].name,
        arguments: {}
      });
      console.log('✅ First tool call successful:\n');
      console.log(JSON.stringify(infoResult, null, 2));
    } catch (infoError) {
      console.log('⚠️  Generic tool call failed (might require parameters)');
    }

    console.log('\n🎉 ScholarXIV MCP server test completed successfully!');
    console.log('The server is responsive and tools are available.');

  } catch (error) {
    console.error('\n❌ Error during MCP connection:');
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    
    if (error.message.includes('command not found') || error.message.includes('ENOENT')) {
      console.log('\n💡 Make sure Node.js and npm are properly installed.');
      console.log('The npx command should be available in your PATH.');
    }
    
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testScholarXIVMCP().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});