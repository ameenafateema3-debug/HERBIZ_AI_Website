import {
  handleBusinessPlan,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/business-plan.' });
    return;
  }
  try {
    await handleBusinessPlan(req, res);
  } catch (err) {
    console.error('Vercel /api/business-plan error:', err);
    sendJson(res, 500, { error: 'Internal server error handling /api/business-plan.' });
  }
}
