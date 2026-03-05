import { getRelatedPapers } from '../arxiv-api.js';

export const getRelatedPapersTool = {
  name: 'get_related_papers',
  description: 'Find papers related to a given arXiv paper based on title keywords and category. Useful for literature review and finding similar work.',
  inputSchema: {
    type: 'object',
    properties: {
      arxiv_id: {
        type: 'string',
        description: 'arXiv paper ID to find related papers for'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of related papers to return (default: 10)',
        default: 10
      }
    },
    required: ['arxiv_id']
  }
};

export async function handleGetRelatedPapers(args: any) {
  const { arxiv_id, max_results = 10 } = args;
  const papers = await getRelatedPapers(arxiv_id, max_results);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(papers, null, 2)
    }]
  };
}
