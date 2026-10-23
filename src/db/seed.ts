import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from '../core/security.js';

export async function seedDatabase(db: DatabaseSync): Promise<void> {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    console.log('🌱 Populando banco com dados de demonstração...');

    const adminHash = await hashPassword('admin123');
    const redatorHash = await hashPassword('redator123');
    const leitorHash = await hashPassword('leitor123');

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const adminRes = insertUser.run('Administrador do Blog', 'admin@blog.com', adminHash, 'admin');
    const redatorRes = insertUser.run('Carlos Redator', 'redator@blog.com', redatorHash, 'redator');
    const leitorRes = insertUser.run('Mariana Leitora', 'leitor@blog.com', leitorHash, 'leitor');

    const redatorId = Number(redatorRes.lastInsertRowid);
    const leitorId = Number(leitorRes.lastInsertRowid);

    // Cria posts de exemplo
    const insertPost = db.prepare(`
      INSERT INTO posts (title, content, author_id, published)
      VALUES (?, ?, ?, ?)
    `);

    const post1 = insertPost.run(
      'Como Dominar Loops de IA para Geração de Software',
      'Loops de IA utilizam feedback determinístico (testes, compiladores e linters) para permitir que LLMs se auto-corrijam até que o software atinja 100% de conformidade com os requisitos.',
      redatorId,
      1
    );

    insertPost.run(
      'Rascunho Secreto: Futuro das APIs com Inteligência Artificial',
      'Este é um rascunho visível apenas para o redator autor e para o administrador.',
      redatorId,
      0
    );

    // Cria comentário de exemplo
    const insertComment = db.prepare(`
      INSERT INTO comments (post_id, author_id, content)
      VALUES (?, ?, ?)
    `);

    insertComment.run(
      Number(post1.lastInsertRowid),
      leitorId,
      'Artigo fantástico! Os loops de feedback realmente mudam a precisão do código gerado.'
    );

    console.log('✅ Banco populado com sucesso:');
    console.log('   - Admin:   admin@blog.com / admin123');
    console.log('   - Redator: redator@blog.com / redator123');
    console.log('   - Leitor:  leitor@blog.com / leitor123');
  }
}
