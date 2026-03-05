import { getPaper } from '../arxiv-api.js';

export async function getPaperResource(arxivId: string): Promise<string> {
  const paper = await getPaper(arxivId);
  
  if (!paper) {
    return JSON.stringify({ error: 'Paper not found' });
  }
  
  return JSON.stringify(paper, null, 2);
}
