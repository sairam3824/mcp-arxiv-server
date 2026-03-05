import { getPaper } from '../arxiv-api.js';
import { downloadAndParsePDF, chunkText } from '../pdf-parser.js';

export const getPaperPdfTextTool = {
  name: 'get_paper_pdf_text',
  description: 'Download and extract full text from a paper\'s PDF. Returns structured text, chunked if necessary to fit context limits.',
  inputSchema: {
    type: 'object',
    properties: {
      arxiv_id: {
        type: 'string',
        description: 'arXiv paper ID'
      },
      chunk_index: {
        type: 'number',
        description: 'For large papers, specify which chunk to retrieve (0-indexed). Omit to get first chunk or full text if small.',
        default: 0
      }
    },
    required: ['arxiv_id']
  }
};

export async function handleGetPaperPdfText(args: any) {
  const { arxiv_id, chunk_index = 0 } = args;
  
  const paper = await getPaper(arxiv_id);
  if (!paper) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Paper not found' }) }],
      isError: true
    };
  }
  
  try {
    const text = await downloadAndParsePDF(paper.pdf_url);
    const chunks = chunkText(text);
    
    if (chunk_index >= chunks.length) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Chunk index ${chunk_index} out of range. Paper has ${chunks.length} chunks.`
          })
        }],
        isError: true
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          arxiv_id,
          title: paper.title,
          chunk_index,
          total_chunks: chunks.length,
          text: chunks[chunk_index]
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: `Failed to parse PDF: ${error.message}` })
      }],
      isError: true
    };
  }
}
