import { createApp } from './app.js';
import { config } from './config.js';
import { getDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';

async function bootstrap() {
  const db = getDatabase();
  await seedDatabase(db);

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`\n🚀 Servidor Blog API rodando em: http://localhost:${config.port}`);
    console.log(`📚 Documentação interativa Swagger: http://localhost:${config.port}/docs\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha fatal ao iniciar o servidor:', err);
  process.exit(1);
});
