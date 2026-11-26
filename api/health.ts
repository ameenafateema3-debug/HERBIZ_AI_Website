import { handleHealth, sendJson, type ApiRequest, type ApiResponse } from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed. Use GET for /api/health.' });
    return;
  }
  try {
    handleHealth(req, res);
  } catch (err) {
    console.error('Vercel /api/health error:', err);
    sendJson(res, 500, { error: 'Unable to check server health right now.' });
  }
}
