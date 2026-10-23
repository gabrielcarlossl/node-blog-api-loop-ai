import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { openApiSpec } from './docs/openapi.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Rota de Healthcheck
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Rotas da API
  app.use('/auth', authRoutes);
  app.use('/posts', postRoutes);
  app.use('/', commentRoutes);
  app.use('/admin/users', userRoutes);

  // Error Handler Global
  app.use(errorHandler);

  return app;
}
