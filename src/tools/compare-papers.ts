import { getPaper } from '../arxiv-api.js';

export const comparePapersTool = {
  name: 'compare_papers',
  description: 'Fetch metadata for 2-3 papers and return them in a format suitable for comparison. The LLM can then analyze and create a comparison table of methods, datasets, and results.',
  inputSchema: {
    type: 'object',
    properties: {
      arxiv_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of 2-3 arXiv paper IDs to compare',
        minItems: 2,
        maxItems: 3
      }
    },
    required: ['arxiv_ids']
  }
};

export async function handleComparePapers(args: any) {
  const { arxiv_ids } = args;
  
  if (!Array.isArray(arxiv_ids) || arxiv_ids.length < 2 || arxiv_ids.length > 3) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'Please provide 2-3 arXiv IDs to compare' })
      }],
      isError: true
    };
  }
  
  const papers = await Promise.all(arxiv_ids.map(id => getPaper(id)));
  const validPapers = papers.filter(p => p !== null);
  
  if (validPapers.length < 2) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'Could not fetch at least 2 valid papers' })
      }],
      isError: true
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        papers: validPapers,
        prompt: 'Please compare these papers and create a table showing: 1) Methods/Approaches, 2) Datasets used, 3) Key Results, 4) Main Contributions'
      }, null, 2)
    }]
  };
}
