import { searchPapers } from '../arxiv-api.js';

export async function getRecentPapers(category: string): Promise<string> {
  const papers = await searchPapers(`cat:${category}`, 20, 0, 'submittedDate', 'descending');
  
  return JSON.stringify({
    category,
    count: papers.length,
    papers: papers.map(p => ({
      id: p.id,
      title: p.title,
      authors: p.authors.slice(0, 3),
      published: p.published,
      abstract: p.abstract.length > 200 ? `${p.abstract.slice(0, 200)}...` : p.abstract
    }))
  }, null, 2);
}
