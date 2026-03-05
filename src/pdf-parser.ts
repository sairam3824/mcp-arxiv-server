import pdf from 'pdf-parse';

const MAX_CHUNK_SIZE = 50000;

export async function downloadAndParsePDF(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const data = await pdf(Buffer.from(buffer));
  
  return data.text;
}

export function chunkText(text: string, maxSize: number = MAX_CHUNK_SIZE): string[] {
  if (text.length <= maxSize) return [text];
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxSize;
    
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start) {
        end = lastNewline;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}

export function extractCitations(text: string): string[] {
  const citations: string[] = [];
  
  const refSection = text.match(/(?:References|Bibliography)\s+([\s\S]*?)(?:\n\n[A-Z]|\n\nAppendix|$)/i);
  if (!refSection) return citations;
  
  const refText = refSection[1];
  const lines = refText.split('\n').filter(line => line.trim().length > 20);
  
  for (const line of lines) {
    if (/^\[\d+\]|^\d+\./.test(line.trim())) {
      citations.push(line.trim());
    }
  }
  
  return citations;
}
