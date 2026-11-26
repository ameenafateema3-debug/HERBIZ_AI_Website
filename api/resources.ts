import { handleResources, sendJson, type ApiRequest, type ApiResponse } from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed. Use GET for /api/resources.' });
    return;
  }
  try {
    handleResources(req, res);
  } catch (err) {
    console.error('Vercel /api/resources error:', err);
    sendJson(res, 500, { error: 'Unable to load verified resources right now.' });
  }
}
