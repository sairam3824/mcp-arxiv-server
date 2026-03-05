import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  getRelatedPapers,
  normalizeArxivId,
  resetArxivApiStateForTests,
  searchByAuthor,
  searchPapers
} from '../build/arxiv-api.js';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  resetArxivApiStateForTests();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetArxivApiStateForTests();
});

function buildFeed(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:arxiv="http://arxiv.org/schemas/atom">
${entries.join('\n')}
</feed>`;
}

function buildEntry({ id, title, summary = 'Summary text for testing', category = 'cs.AI' }) {
  return `<entry>
  <id>http://arxiv.org/abs/${id}</id>
  <updated>2024-01-01T00:00:00Z</updated>
  <published>2024-01-01T00:00:00Z</published>
  <title>${title}</title>
  <summary>${summary}</summary>
  <author><name>Test Author</name></author>
  <category term="${category}" />
  <arxiv:primary_category term="${category}" />
  <link rel="alternate" type="text/html" href="http://arxiv.org/abs/${id}" />
  <link title="pdf" rel="related" type="application/pdf" href="https://arxiv.org/pdf/${id}.pdf" />
</entry>`;
}

test('normalizeArxivId removes version and abs URL prefix', () => {
  assert.equal(normalizeArxivId('2301.07041v2'), '2301.07041');
  assert.equal(normalizeArxivId('https://arxiv.org/abs/2301.07041v7'), '2301.07041');
});

test('searchByAuthor requests submittedDate descending order', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(buildFeed([buildEntry({ id: '2401.00001', title: 'Author Paper' })]), {
      status: 200
    });
  };

  await searchByAuthor('Jane Doe', 5);

  assert.match(requestedUrl, /sortBy=submittedDate/);
  assert.match(requestedUrl, /sortOrder=descending/);
});

test('getRelatedPapers filters out same paper across versions', async () => {
  let call = 0;
  globalThis.fetch = async () => {
    call += 1;

    if (call === 1) {
      return new Response(
        buildFeed([
          buildEntry({
            id: '2301.07041v1',
            title: 'Transformers Improve Learning Systems',
            summary: 'Base paper summary'
          })
        ]),
        { status: 200 }
      );
    }

    return new Response(
      buildFeed([
        buildEntry({ id: '2301.07041v3', title: 'Transformers Improve Learning Systems' }),
        buildEntry({ id: '2401.12345v1', title: 'New Advances in Transformers' })
      ]),
      { status: 200 }
    );
  };

  const related = await getRelatedPapers('2301.07041', 10);

  assert.equal(related.length, 1);
  assert.equal(related[0].id, '2401.12345v1');
});

test('searchPapers retries retryable API failures', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response('temporary failure', { status: 500, statusText: 'Server Error' });
    }

    return new Response(buildFeed([buildEntry({ id: '2501.00001', title: 'Retry Success' })]), {
      status: 200
    });
  };

  const papers = await searchPapers('ti:retry', 1, 0);
  assert.equal(calls, 2);
  assert.equal(papers.length, 1);
});

test('searchPapers does not retry non-retryable API failures', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('bad request', { status: 400, statusText: 'Bad Request' });
  };

  await assert.rejects(() => searchPapers('ti:bad', 1, 0), /400 Bad Request/);
  assert.equal(calls, 1);
});
