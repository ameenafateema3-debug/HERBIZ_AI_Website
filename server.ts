import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handleAnalyzeProfile,
  handleBusinessPlan,
  handleChat,
  handleFeedback,
  handleHealth,
  handleIdeaFinder,
  handleKnowledgeTopics,
  handleMarketingAssistant,
  handleRecommendations,
  handleResources,
  sendJson,
} from './server/handlers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req: Request, res: Response) => {
  handleHealth(req, res);
});

app.get('/api/resources', (req: Request, res: Response) => {
  handleResources(req, res);
});

app.get('/api/knowledge/topics', (req: Request, res: Response) => {
  handleKnowledgeTopics(req, res);
});

app.post('/api/recommendations', (req: Request, res: Response, next: NextFunction) => {
  handleRecommendations(req, res).catch(next);
});

app.post('/api/chat', (req: Request, res: Response, next: NextFunction) => {
  handleChat(req, res).catch(next);
});

app.post('/api/analyze-profile', (req: Request, res: Response, next: NextFunction) => {
  handleAnalyzeProfile(req, res).catch(next);
});

app.post('/api/feedback', (req: Request, res: Response, next: NextFunction) => {
  handleFeedback(req, res).catch(next);
});

app.post('/api/idea-finder', (req: Request, res: Response, next: NextFunction) => {
  handleIdeaFinder(req, res).catch(next);
});

app.post('/api/business-plan', (req: Request, res: Response, next: NextFunction) => {
  handleBusinessPlan(req, res).catch(next);
});

app.post('/api/marketing-assistant', (req: Request, res: Response, next: NextFunction) => {
  handleMarketingAssistant(req, res).catch(next);
});

// Ensure unknown or erroneous /api/* requests always return JSON, never HTML
app.use('/api', (_req: Request, res: Response) => {
  sendJson(res, 404, { error: 'API endpoint not found.' });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error('Unhandled /api error:', err);
    sendJson(res, 500, { error: 'Internal server error handling API request.' });
    return;
  }
  next(err);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HERBIZ AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
