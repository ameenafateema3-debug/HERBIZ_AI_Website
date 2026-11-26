import {
  handleMarketingAssistant,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/marketing-assistant.' });
    return;
  }
  try {
    await handleMarketingAssistant(req, res);
  } catch (err) {
    console.error('Vercel /api/marketing-assistant error:', err);
    sendJson(res, 500, { error: 'Internal server error handling /api/marketing-assistant.' });
  }
}
