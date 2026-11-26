import { handleFeedback, sendJson, type ApiRequest, type ApiResponse } from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/feedback.' });
    return;
  }
  try {
    await handleFeedback(req, res);
  } catch (err) {
    console.error('Vercel /api/feedback error:', err);
    sendJson(res, 500, { error: 'Could not submit feedback right now.' });
  }
}
