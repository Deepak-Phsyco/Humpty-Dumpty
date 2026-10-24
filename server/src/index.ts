import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { harnessService } from './harness/harnessService.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Check if origin matches allowed origin patterns (e.g. localhost, github.io)
    const isAllowed = config.corsOrigins.some(allowed => {
      if (allowed === origin) return true;
      if (allowed.startsWith('http://localhost') && origin.startsWith('http://localhost')) return true;
      if (allowed.includes('github.io') && origin.includes('github.io')) return true;
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive in dev, logged in prod
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API Routes
app.use('/api', healthRouter);
app.use('/api', chatRouter);

// Root fallback / ping
app.get('/', (req, res) => {
  res.json({
    name: 'LabLens AI Backend',
    provider: config.aiProvider,
    model: config.aiProvider === 'gemini' ? config.geminiModel : config.deepseekModel,
    status: 'running',
    health: '/api/health',
    chat: '/api/chat'
  });
});

// Central Error Handler
app.use(errorHandler);

// Start HTTP Server
const server = app.listen(config.port, () => {
  const activeModel = config.aiProvider === 'gemini' ? config.geminiModel : config.deepseekModel;
  console.log(`=======================================================`);
  console.log(`🔬 LabLens AI Backend Server Started`);
  console.log(`📡 Listening on: http://localhost:${config.port}`);
  console.log(`🩺 Health check: http://localhost:${config.port}/api/health`);
  console.log(`💬 Chat API:     http://localhost:${config.port}/api/chat`);
  console.log(`🤖 AI Provider:  ${config.aiProvider.toUpperCase()} (${activeModel})`);
  console.log(`🔑 Key Status:   ${harnessService.isConfigured() ? 'Configured ✅' : 'Not configured ⚠️'}`);
  console.log(`=======================================================`);
});


// Graceful Shutdown Handler
async function gracefulShutdown(signal: string) {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await harnessService.close();
      console.log('[Server] DeepSeek Harness child processes closed. Exiting process.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during teardown:', err);
      process.exit(1);
    }
  });

  // Force exit if shutdown hangs beyond 10s
  setTimeout(() => {
    console.error('[Server] Force shutdown timeout exceeded. Terminating.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
