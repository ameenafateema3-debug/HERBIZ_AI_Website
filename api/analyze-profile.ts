import {
  handleAnalyzeProfile,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../server/handlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST for /api/analyze-profile.' });
    return;
  }
  try {
    await handleAnalyzeProfile(req, res);
  } catch (err) {
    console.error('Vercel /api/analyze-profile error:', err);
    sendJson(res, 500, { error: 'The Gemini AI profile analysis is currently unavailable.' });
  }
}
