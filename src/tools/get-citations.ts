import { getPaper } from '../arxiv-api.js';
import { downloadAndParsePDF, extractCitations } from '../pdf-parser.js';

export const getCitationsTool = {
  name: 'get_citations',
  description: 'Extract references and bibliography from a paper\'s PDF. Returns a list of citations found in the paper.',
  inputSchema: {
    type: 'object',
    properties: {
      arxiv_id: {
        type: 'string',
        description: 'arXiv paper ID'
      }
    },
    required: ['arxiv_id']
  }
};

export async function handleGetCitations(args: any) {
  const { arxiv_id } = args;
  
  const paper = await getPaper(arxiv_id);
  if (!paper) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Paper not found' }) }],
      isError: true
    };
  }
  
  try {
    const text = await downloadAndParsePDF(paper.pdf_url);
    const citations = extractCitations(text);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          arxiv_id,
          title: paper.title,
          citation_count: citations.length,
          citations
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: `Failed to extract citations: ${error.message}` })
      }],
      isError: true
    };
  }
}
