import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProvider, listProviders } from './providers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 4000;
const DEFAULT_PROVIDER = (process.env.LLM_PROVIDER || 'google').toLowerCase();

if (!process.env.GENAI_API_KEY) {
  console.warn('[agentflow-ui] GENAI_API_KEY is not defined. Google provider calls will fail until it is set.');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the dist directory in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const resolveProviderName = (name?: unknown): string => {
  if (typeof name === 'string' && name.trim()) {
    return name.trim().toLowerCase();
  }
  return DEFAULT_PROVIDER;
};

app.post('/api/http', async (req, res) => {
  try {
    const { urls, method = 'GET' } = req.body as { urls: string[]; method?: string };
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "The 'urls' property must be a non-empty array." });
    }

    const results = await Promise.all(
      urls.map(async (rawUrl) => {
        const url = String(rawUrl);
        const response = await fetch(url, { method });
        if (!response.ok) {
          throw new Error(`Request to ${url} failed with status ${response.status}`);
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          return response.json();
        }
        return response.text();
      })
    );

    res.json({ result: results.length === 1 ? results[0] : results });
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? 'HTTP proxy failed.' });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { provider: requestedProvider, query } = req.body as { provider?: string; query?: string };
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: "The 'query' property must be a non-empty string." });
    }

    const providerName = resolveProviderName(requestedProvider);
    const provider = getProvider(providerName);
    if (!provider.supportsSearch || !provider.invokeSearch) {
      return res.status(400).json({ error: `Provider '${providerName}' does not support search.` });
    }

    const result = await provider.invokeSearch({ query });
    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? 'Search request failed.' });
  }
});

app.post('/api/llm', async (req, res) => {
  try {
    const {
      provider: requestedProvider,
      model,
      prompt,
      system,
      image,
      temperature,
      expectJson,
    } = req.body as {
      provider?: string;
      model?: string;
      prompt?: string | null;
      system?: string | null;
      image?: string | null;
      temperature?: number;
      expectJson?: boolean;
    };

    if (!prompt && !image) {
      return res.status(400).json({ error: 'Provide either a prompt or an image payload.' });
    }

    const providerName = resolveProviderName(requestedProvider);
    const provider = getProvider(providerName);

    const result = await provider.invokeLLM({
      model: model ?? '',
      prompt: prompt ?? null,
      system: system ?? null,
      image: image ?? null,
      temperature,
      expectJson,
    });

    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? 'LLM request failed.' });
  }
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[agentflow-ui] Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  const providers = listProviders();
  console.log(`[agentflow-ui] API server listening on http://0.0.0.0:${PORT}`);
  console.log(`[agentflow-ui] Registered LLM providers: ${providers.join(', ') || 'none'}`);
});
