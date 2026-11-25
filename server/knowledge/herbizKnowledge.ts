import { getHerbizKnowledgeLibrary } from './library/index.ts';

export interface KnowledgeAreaSummary {
  id: string;
  area: string;
  title: string;
  summary: string;
  sectionCount: number;
}

export function getKnowledgeAreasSummary(): KnowledgeAreaSummary[] {
  const { documents, chunks } = getHerbizKnowledgeLibrary();
  return documents.map((doc) => ({
    id: doc.docId,
    area: doc.area,
    title: doc.title,
    summary: doc.purpose,
    sectionCount: chunks.filter((c) => c.docId === doc.docId).length,
  }));
}
