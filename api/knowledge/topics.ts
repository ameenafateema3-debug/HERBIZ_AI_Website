import {
  handleKnowledgeTopics,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed. Use GET for /api/knowledge/topics.' });
    return;
  }
  try {
    handleKnowledgeTopics(req, res);
  } catch (err) {
    console.error('Vercel /api/knowledge/topics error:', err);
    sendJson(res, 500, { error: 'Unable to load HERBIZ knowledge topics right now.' });
  }
}
