#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolRequest,
  ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { searchPapersTool, handleSearchPapers } from './tools/search-papers.js';
import { getPaperTool, handleGetPaper } from './tools/get-paper.js';
import { getPaperPdfTextTool, handleGetPaperPdfText } from './tools/get-paper-pdf-text.js';
import { searchByAuthorTool, handleSearchByAuthor } from './tools/search-by-author.js';
import { getCitationsTool, handleGetCitations } from './tools/get-citations.js';
import { getRelatedPapersTool, handleGetRelatedPapers } from './tools/get-related-papers.js';
import { summarizePaperTool, handleSummarizePaper } from './tools/summarize-paper.js';
import { comparePapersTool, handleComparePapers } from './tools/compare-papers.js';
import { getRecentPapers } from './resources/recent-papers.js';
import { getPaperResource } from './resources/paper-resource.js';

const server = new Server(
  {
    name: 'mcp-arxiv-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      searchPapersTool,
      getPaperTool,
      getPaperPdfTextTool,
      searchByAuthorTool,
      getCitationsTool,
      getRelatedPapersTool,
      summarizePaperTool,
      comparePapersTool,
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_papers':
      return handleSearchPapers(args);
    case 'get_paper':
      return handleGetPaper(args);
    case 'get_paper_pdf_text':
      return handleGetPaperPdfText(args);
    case 'search_by_author':
      return handleSearchByAuthor(args);
    case 'get_citations':
      return handleGetCitations(args);
    case 'get_related_papers':
      return handleGetRelatedPapers(args);
    case 'summarize_paper':
      return handleSummarizePaper(args);
    case 'compare_papers':
      return handleComparePapers(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'arxiv://recent/cs.AI',
        name: 'Recent AI papers',
        mimeType: 'application/json',
        description: 'Recent papers in cs.AI category',
      },
      {
        uri: 'arxiv://recent/cs.LG',
        name: 'Recent Machine Learning papers',
        mimeType: 'application/json',
        description: 'Recent papers in cs.LG category',
      },
      {
        uri: 'arxiv://recent/cs.CL',
        name: 'Recent Computation and Language papers',
        mimeType: 'application/json',
        description: 'Recent papers in cs.CL category',
      },
      {
        uri: 'arxiv://paper/{id}',
        name: 'Paper by ID',
        mimeType: 'application/json',
        description: 'Full paper details for a specific arXiv ID',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
  const { uri } = request.params;

  if (uri.startsWith('arxiv://recent/')) {
    const category = uri.replace('arxiv://recent/', '');
    const content = await getRecentPapers(category);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: content,
        },
      ],
    };
  }

  if (uri.startsWith('arxiv://paper/')) {
    const arxivId = uri.replace('arxiv://paper/', '');
    const content = await getPaperResource(arxivId);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: content,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('arXiv MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
