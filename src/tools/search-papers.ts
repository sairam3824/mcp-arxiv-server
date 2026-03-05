import { searchPapers } from '../arxiv-api.js';

export const searchPapersTool = {
  name: 'search_papers',
  description: 'Search arXiv for research papers by query, author, category, or date range. Returns paper metadata including title, authors, abstract, and arXiv ID.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query. Can use arXiv query syntax: ti:title, au:author, cat:category, abs:abstract. Example: "ti:transformer au:vaswani"'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
        default: 10
      },
      start: {
        type: 'number',
        description: 'Starting index for pagination (default: 0)',
        default: 0
      }
    },
    required: ['query']
  }
};

export async function handleSearchPapers(args: any) {
  const { query, max_results = 10, start = 0 } = args;
  const papers = await searchPapers(query, max_results, start);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(papers, null, 2)
    }]
  };
}
