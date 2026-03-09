# mcp-arxiv-server

An MCP (Model Context Protocol) server that provides LLMs with comprehensive access to arXiv research papers. Search, read, analyze, and compare academic papers directly from your AI assistant.

## Features

- **Search papers** by topic, author, category, or date range
- **Fetch full metadata** including abstracts, authors, and categories
- **Download and parse PDFs** to extract full text content
- **Extract citations** from paper bibliographies
- **Find related papers** based on content similarity
- **Author search** sorted by newest submissions first
- **Paper comparison** to analyze multiple papers side-by-side
- **Structured summaries** with AI-assisted analysis
- **Resources** for browsing recent papers by category (newest first)
- **Reliable API access** with status checks, timeout handling, and retries for transient failures

## Installation

### Using npx (recommended)

```bash
npx mcp-arxiv-server
```

### Global installation

```bash
npm install -g mcp-arxiv-server
```

### From source

```bash
git clone <repository-url>
cd mcp-arxiv-server
npm install
npm run build
npm start
```

## Run Locally

```bash
cd mcp-arxiv-server
npm install
npm run build
npm start
```

The server runs on `stdio` and should log:

```text
arXiv MCP Server running on stdio
```

## Development Commands

```bash
# Watch TypeScript changes
npm run dev

# Build once
npm run build

# Start compiled server
npm start

# Run tests
npm test
```

## Claude Desktop Configuration

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arxiv": {
      "command": "npx",
      "args": ["mcp-arxiv-server"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "arxiv": {
      "command": "mcp-arxiv-server"
    }
  }
}
```

## Available Tools

### 1. search_papers

Search arXiv for papers using flexible query syntax.

**Parameters:**
- `query` (string, required): Search query. Supports arXiv syntax:
  - `ti:transformer` - search in title
  - `au:vaswani` - search by author
  - `cat:cs.AI` - search by category
  - `abs:attention` - search in abstract
- `max_results` (number, default: 10): Maximum results to return
- `start` (number, default: 0): Starting index for pagination

**Example:**
```
Search for recent papers on transformers in NLP
→ search_papers(query="ti:transformer cat:cs.CL", max_results=5)
```

### 2. get_paper

Fetch complete metadata for a specific paper.

**Parameters:**
- `arxiv_id` (string, required): arXiv paper ID (e.g., "2301.07041")

**Example:**
```
Get details for paper 2301.07041
→ get_paper(arxiv_id="2301.07041")
```

### 3. get_paper_pdf_text

Download and extract full text from a paper's PDF.

**Parameters:**
- `arxiv_id` (string, required): arXiv paper ID
- `chunk_index` (number, default: 0): For large papers, which chunk to retrieve

**Example:**
```
Read the full text of paper 2301.07041
→ get_paper_pdf_text(arxiv_id="2301.07041")
```

### 4. search_by_author

Find all papers by a specific author, newest first.

**Parameters:**
- `author` (string, required): Author name (e.g., "Yoshua Bengio")
- `max_results` (number, default: 20): Maximum results

**Example:**
```
Find papers by Geoffrey Hinton
→ search_by_author(author="Geoffrey Hinton", max_results=10)
```

### 5. get_citations

Extract references from a paper's bibliography.

**Parameters:**
- `arxiv_id` (string, required): arXiv paper ID

**Example:**
```
Get all citations from paper 2301.07041
→ get_citations(arxiv_id="2301.07041")
```

### 6. get_related_papers

Find papers related to a given paper.

**Parameters:**
- `arxiv_id` (string, required): arXiv paper ID
- `max_results` (number, default: 10): Maximum results

**Example:**
```
Find papers related to 2301.07041
→ get_related_papers(arxiv_id="2301.07041", max_results=5)
```

### 7. summarize_paper

Get a paper's content structured for AI summarization.

**Parameters:**
- `arxiv_id` (string, required): arXiv paper ID
- `include_full_text` (boolean, default: false): Include full PDF text

**Example:**
```
Summarize paper 2301.07041
→ summarize_paper(arxiv_id="2301.07041", include_full_text=true)
```

### 8. compare_papers

Fetch multiple papers for side-by-side comparison.

**Parameters:**
- `arxiv_ids` (array, required): 2-3 arXiv paper IDs

**Example:**
```
Compare these three papers on attention mechanisms
→ compare_papers(arxiv_ids=["1706.03762", "2010.11929", "2301.07041"])
```

## Available Resources

Resources provide structured access to paper collections:

- `arxiv://recent/cs.AI` - Recent AI papers
- `arxiv://recent/cs.LG` - Recent Machine Learning papers
- `arxiv://recent/cs.CL` - Recent Computation and Language papers
- `arxiv://paper/{id}` - Full details for a specific paper

## Example Conversations

### Literature Review

```
User: Find recent papers on large language models
Assistant: [Uses search_papers with query="ti:large language model cat:cs.CL"]

User: Get more details on the first paper
Assistant: [Uses get_paper with the arxiv_id]

User: What papers does it cite?
Assistant: [Uses get_citations to extract bibliography]

User: Find related work
Assistant: [Uses get_related_papers]
```

### Author Research

```
User: Show me Yann LeCun's recent papers
Assistant: [Uses search_by_author with author="Yann LeCun"]

User: Summarize his most recent paper
Assistant: [Uses summarize_paper with include_full_text=true]
```

### Paper Comparison

```
User: Compare the original Transformer paper with BERT and GPT-2
Assistant: [Uses compare_papers with arxiv_ids for all three papers]
[Analyzes and creates comparison table of architectures, training methods, and results]
```

### Deep Dive

```
User: I want to read the full text of paper 2301.07041
Assistant: [Uses get_paper_pdf_text to extract PDF content]

User: What are the key contributions?
Assistant: [Analyzes the extracted text to identify main contributions]
```

## Features

- **Rate limiting**: Respects arXiv's 3-second rate limit between requests
- **Caching**: 30-minute in-memory cache to avoid redundant API calls
- **PDF parsing**: Automatic text extraction from PDFs with chunking for large papers
- **Flexible search**: Full support for arXiv's query syntax
- **Error handling**: HTTP status validation plus timeout/retry for transient API failures
- **Related paper filtering**: Excludes source paper even when arXiv ID versions differ

## arXiv Categories

Common categories you can search:
- `cs.AI` - Artificial Intelligence
- `cs.LG` - Machine Learning
- `cs.CL` - Computation and Language (NLP)
- `cs.CV` - Computer Vision
- `cs.NE` - Neural and Evolutionary Computing
- `stat.ML` - Machine Learning (Statistics)

[Full category list](https://arxiv.org/category_taxonomy)

## License

MIT License

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP TypeScript SDK
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - XML parsing
- [pdf-parse](https://gitlab.com/autokent/pdf-parse) - PDF text extraction

Data provided by [arXiv](https://arxiv.org/) using the [arXiv API](https://arxiv.org/help/api/).
