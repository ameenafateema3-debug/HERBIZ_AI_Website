import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface KnowledgeDocumentMeta {
  docId: string;
  area: string;
  fileName: string;
  title: string;
  purpose: string;
}

export interface KnowledgeChunk {
  id: string;
  docId: string;
  area: string;
  fileName: string;
  docTitle: string;
  sectionTitle: string;
  content: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCUMENT_SPECS: Array<{
  docId: string;
  area: string;
  fileName: string;
}> = [
  { docId: '01_finance', area: 'Finance', fileName: '01_Finance.md' },
  { docId: '02_marketing', area: 'Marketing', fileName: '02_Marketing.md' },
  { docId: '03_growth', area: 'Business Growth', fileName: '03_Growth.md' },
  { docId: '04_digital_tools', area: 'Digital Tools', fileName: '04_Digital_Tools.md' },
  { docId: '05_india_resources', area: 'India Resources', fileName: '05_India_Resources.md' },
  { docId: '06_business_faq', area: 'Business FAQ', fileName: '06_Business_FAQ.md' },
];

function parseMarkdownDocument(spec: {
  docId: string;
  area: string;
  fileName: string;
}): { meta: KnowledgeDocumentMeta; chunks: KnowledgeChunk[] } {
  const filePath = path.resolve(__dirname, spec.fileName);
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');

  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const docTitle = titleMatch ? titleMatch[1].trim() : spec.area;

  const purposeMatch = raw.match(/\*\*Purpose:\*\*\s*(.+)/);
  const purpose = purposeMatch ? purposeMatch[1].trim() : '';

  const parts = raw.split(/\n(?=##\s+)/);
  const chunks: KnowledgeChunk[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part.startsWith('## ')) continue;

    const firstNewline = part.indexOf('\n');
    const headingLine =
      firstNewline === -1 ? part.slice(3).trim() : part.slice(3, firstNewline).trim();
    const body = firstNewline === -1 ? '' : part.slice(firstNewline + 1).trim();

    if (!body) continue;

    chunks.push({
      id: `${spec.docId}_sec_${i}`,
      docId: spec.docId,
      area: spec.area,
      fileName: spec.fileName,
      docTitle,
      sectionTitle: headingLine,
      content: body,
    });
  }

  return {
    meta: {
      docId: spec.docId,
      area: spec.area,
      fileName: spec.fileName,
      title: docTitle,
      purpose,
    },
    chunks,
  };
}

let cachedLibrary: {
  documents: KnowledgeDocumentMeta[];
  chunks: KnowledgeChunk[];
} | null = null;

export function getHerbizKnowledgeLibrary(): {
  documents: KnowledgeDocumentMeta[];
  chunks: KnowledgeChunk[];
} {
  if (cachedLibrary) return cachedLibrary;

  const documents: KnowledgeDocumentMeta[] = [];
  const chunks: KnowledgeChunk[] = [];

  for (const spec of DOCUMENT_SPECS) {
    const parsed = parseMarkdownDocument(spec);
    documents.push(parsed.meta);
    chunks.push(...parsed.chunks);
  }

  cachedLibrary = { documents, chunks };
  return cachedLibrary;
}
