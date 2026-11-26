import {
  handleRecommendations,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/recommendations.' });
    return;
  }
  try {
    await handleRecommendations(req, res);
  } catch (err) {
    console.error('Vercel /api/recommendations error:', err);
    sendJson(res, 500, { error: 'Unable to generate recommendations right now.' });
  }
}
