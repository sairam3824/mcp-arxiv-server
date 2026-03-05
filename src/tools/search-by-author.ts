import { searchByAuthor } from '../arxiv-api.js';

export const searchByAuthorTool = {
  name: 'search_by_author',
  description: 'Find all papers by a specific author, sorted by publication date (most recent first).',
  inputSchema: {
    type: 'object',
    properties: {
      author: {
        type: 'string',
        description: 'Author name (e.g., "Yoshua Bengio" or "Bengio")'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results (default: 20)',
        default: 20
      }
    },
    required: ['author']
  }
};

export async function handleSearchByAuthor(args: any) {
  const { author, max_results = 20 } = args;
  const papers = await searchByAuthor(author, max_results);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(papers, null, 2)
    }]
  };
}
