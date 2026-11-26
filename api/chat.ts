import { handleChat, sendJson, type ApiRequest, type ApiResponse } from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/chat.' });
    return;
  }
  try {
    await handleChat(req, res);
  } catch (err) {
    console.error('Vercel /api/chat error:', err);
    sendJson(res, 500, { error: 'Unable to reach the HERBIZ AI assistant right now.' });
  }
}
