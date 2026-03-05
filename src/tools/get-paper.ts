import { getPaper } from '../arxiv-api.js';

export const getPaperTool = {
  name: 'get_paper',
  description: 'Fetch full metadata for a specific arXiv paper by ID. Returns complete details including abstract, authors, categories, PDF URL, comments, and journal references.',
  inputSchema: {
    type: 'object',
    properties: {
      arxiv_id: {
        type: 'string',
        description: 'arXiv paper ID (e.g., "2301.07041" or "cs/0001234")'
      }
    },
    required: ['arxiv_id']
  }
};

export async function handleGetPaper(args: any) {
  const { arxiv_id } = args;
  const paper = await getPaper(arxiv_id);
  
  if (!paper) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'Paper not found' })
      }],
      isError: true
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(paper, null, 2)
    }]
  };
}
