import { getPaper } from '../arxiv-api.js';
import { downloadAndParsePDF } from '../pdf-parser.js';

export const summarizePaperTool = {
  name: 'summarize_paper',
  description: 'Fetch a paper and return its content structured for summarization. The LLM can then analyze the text to extract objective, method, results, and conclusions.',
  inputSchema: {
    type: 'object',
    properties: {
      arxiv_id: {
        type: 'string',
        description: 'arXiv paper ID to summarize'
      },
      include_full_text: {
        type: 'boolean',
        description: 'Whether to include full PDF text (default: false, uses abstract only)',
        default: false
      }
    },
    required: ['arxiv_id']
  }
};

export async function handleSummarizePaper(args: any) {
  const { arxiv_id, include_full_text = false } = args;
  
  const paper = await getPaper(arxiv_id);
  if (!paper) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Paper not found' }) }],
      isError: true
    };
  }
  
  let fullText = '';
  if (include_full_text) {
    try {
      fullText = await downloadAndParsePDF(paper.pdf_url);
      if (fullText.length > 100000) {
        fullText = fullText.slice(0, 100000) + '\n\n[Text truncated due to length]';
      }
    } catch (error: any) {
      fullText = `[Failed to extract PDF text: ${error.message}]`;
    }
  }
  
  const summary = {
    arxiv_id,
    title: paper.title,
    authors: paper.authors,
    published: paper.published,
    categories: paper.categories,
    abstract: paper.abstract,
    ...(include_full_text && { full_text: fullText }),
    prompt: 'Please analyze this paper and provide a structured summary with: 1) Objective/Problem, 2) Method/Approach, 3) Key Results, 4) Conclusions/Impact'
  };
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(summary, null, 2)
    }]
  };
}
