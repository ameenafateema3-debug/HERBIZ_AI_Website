import {
  handleIdeaFinder,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/idea-finder.' });
    return;
  }
  try {
    await handleIdeaFinder(req, res);
  } catch (err) {
    console.error('Vercel /api/idea-finder error:', err);
    sendJson(res, 500, { error: 'Internal server error handling /api/idea-finder.' });
  }
}
