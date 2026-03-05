import { XMLParser } from 'fast-xml-parser';
import { Cache } from './cache.js';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';
const RATE_LIMIT_MS = 3000;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

let lastRequestTime = 0;
const cache = new Cache(30);
type ArxivSortBy = 'relevance' | 'lastUpdatedDate' | 'submittedDate';
type ArxivSortOrder = 'ascending' | 'descending';
class NonRetryableRequestError extends Error {}

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  updated: string;
  categories: string[];
  primary_category: string;
  pdf_url: string;
  comment?: string;
  journal_ref?: string;
}

export function resetArxivApiStateForTests(): void {
  cache.clear();
  lastRequestTime = 0;
}

export async function searchPapers(
  query: string,
  maxResults: number = 10,
  start: number = 0,
  sortBy: ArxivSortBy = 'relevance',
  sortOrder: ArxivSortOrder = 'descending'
): Promise<ArxivPaper[]> {
  const cacheKey = `search:${query}:${maxResults}:${start}:${sortBy}:${sortOrder}`;
  const cached = cache.get<ArxivPaper[]>(cacheKey);
  if (cached) return cached;

  await rateLimit();

  const params = new URLSearchParams({
    search_query: query,
    start: start.toString(),
    max_results: maxResults.toString(),
    sortBy,
    sortOrder
  });

  const xml = await fetchArxivFeed(params);
  
  const papers = parseArxivResponse(xml);
  cache.set(cacheKey, papers);
  return papers;
}

export async function getPaper(arxivId: string): Promise<ArxivPaper | null> {
  const cacheKey = `paper:${arxivId}`;
  const cached = cache.get<ArxivPaper>(cacheKey);
  if (cached) return cached;

  await rateLimit();

  const params = new URLSearchParams({
    id_list: arxivId
  });

  const xml = await fetchArxivFeed(params);
  
  const papers = parseArxivResponse(xml);
  const paper = papers[0] || null;
  if (paper) cache.set(cacheKey, paper);
  return paper;
}

export async function searchByAuthor(author: string, maxResults: number = 20): Promise<ArxivPaper[]> {
  return searchPapers(`au:${author}`, maxResults, 0, 'submittedDate', 'descending');
}

export async function getRelatedPapers(arxivId: string, maxResults: number = 10): Promise<ArxivPaper[]> {
  const paper = await getPaper(arxivId);
  if (!paper) return [];
  
  const normalizedSourceId = normalizeArxivId(arxivId);
  const titleWords = paper.title.split(' ').filter(w => w.length > 4).slice(0, 5).join(' ');
  const query = `ti:${titleWords} AND cat:${paper.primary_category}`;
  
  const results = await searchPapers(query, maxResults + 1, 0);
  return results
    .filter(p => normalizeArxivId(p.id) !== normalizedSourceId)
    .slice(0, maxResults);
}

async function fetchArxivFeed(params: URLSearchParams): Promise<string> {
  const url = `${ARXIV_API_URL}?${params}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const body = await response.text();

      if (response.ok) {
        return body;
      }

      const error = new Error(
        `arXiv API request failed (${response.status} ${response.statusText}): ${body.slice(0, 200)}`
      );
      lastError = error;

      if (!isRetryableStatus(response.status)) {
        throw new NonRetryableRequestError(error.message);
      }

      if (attempt === MAX_RETRIES) {
        throw error;
      }
    } catch (error: any) {
      if (error instanceof NonRetryableRequestError) {
        throw new Error(error.message);
      }

      const isAbortError = error?.name === 'AbortError';
      const normalizedError = isAbortError
        ? new Error(`arXiv API request timed out after ${REQUEST_TIMEOUT_MS}ms`)
        : error instanceof Error
          ? error
          : new Error(String(error));
      lastError = normalizedError;

      if (attempt === MAX_RETRIES) {
        throw normalizedError;
      }
    } finally {
      clearTimeout(timeout);
    }

    await sleep(RETRY_DELAY_MS * (attempt + 1));
  }

  throw lastError ?? new Error('arXiv API request failed');
}

export function normalizeArxivId(id: string): string {
  return id
    .trim()
    .replace(/^https?:\/\/arxiv\.org\/abs\//, '')
    .replace(/v\d+$/i, '');
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArxivResponse(xml: string): ArxivPaper[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  
  const result = parser.parse(xml);
  const feed = result.feed;
  
  if (!feed || !feed.entry) return [];
  
  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  
  return entries.map((entry: any) => {
    const id = entry.id.split('/abs/')[1] || entry.id;
    const authors = Array.isArray(entry.author) 
      ? entry.author.map((a: any) => a.name)
      : [entry.author?.name].filter(Boolean);
    
    const categories = Array.isArray(entry.category)
      ? entry.category.map((c: any) => c['@_term'])
      : entry.category ? [entry.category['@_term']] : [];
    
    const pdfLink = Array.isArray(entry.link)
      ? entry.link.find((l: any) => l['@_title'] === 'pdf')
      : entry.link?.['@_title'] === 'pdf' ? entry.link : null;
    
    return {
      id,
      title: entry.title.replace(/\s+/g, ' ').trim(),
      authors,
      abstract: entry.summary.replace(/\s+/g, ' ').trim(),
      published: entry.published,
      updated: entry.updated,
      categories,
      primary_category: entry['arxiv:primary_category']?.['@_term'] || categories[0],
      pdf_url: pdfLink?.['@_href'] || `https://arxiv.org/pdf/${id}.pdf`,
      comment: entry['arxiv:comment']?.['#text'],
      journal_ref: entry['arxiv:journal_ref']?.['#text']
    };
  });
}
