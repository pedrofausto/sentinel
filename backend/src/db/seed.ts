import bcrypt from 'bcryptjs';
import pool, { testConnection } from '../config/database';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot seed without database connection');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create default admin user
    const passwordHash = await bcrypt.hash('admin123!', 12);
    const { rows: [user] } = await client.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@sentinel.local', $1, 'admin')
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, [passwordHash]);

    if (user) {
      console.log('✅ Created admin user');

      // Create sample organization
      const { rows: [org] } = await client.query(`
        INSERT INTO organizations (name, sector, description, stakeholder_name, stakeholder_email, created_by)
        VALUES ('FinTech Global', 'Financeiro', 'Líder global em soluções de pagamento digital e banking as a service.', 'Carlos Silveira', 'carlos.ciso@fintech.global', $1)
        RETURNING id
      `, [user.id]);

      console.log('✅ Created sample organization');

      // Create sample PIR
      const { rows: [pir] } = await client.query(`
        INSERT INTO pirs (organization_id, title, description, priority, status, created_by)
        VALUES ($1, 'Fraudes em Transações Pix', 'Monitorar novos esquemas de phishing visando usuários de bancos digitais.', 'High', 'Active', $2)
        RETURNING id
      `, [org.id, user.id]);

      console.log('✅ Created sample PIR');

      // Create PIR history
      await client.query(`
        INSERT INTO pir_history (pir_id, status, action, changed_by)
        VALUES ($1, 'Active', 'Created', $2)
      `, [pir.id, user.id]);

      // Create sample source
      await client.query(`
        INSERT INTO intelligence_sources (pir_id, name, description, type, credibility, reliability, integration_date, created_by)
        VALUES ($1, 'VirusTotal', 'Análise de malware e URLs suspeitas', 'OSINT', 'A', 'A', CURRENT_DATE, $2)
      `, [pir.id, user.id]);

      console.log('✅ Created sample intelligence source');

      // Create sample report
      await client.query(`
        INSERT INTO reports (pir_id, title, type, content, report_date, created_by)
        VALUES ($1, 'Análise de Campanha de Phishing Q1 2025', 'Tactical', 'Relatório detalhado sobre campanhas de phishing identificadas...', CURRENT_DATE, $2)
      `, [pir.id, user.id]);

      console.log('✅ Created sample report');
    } else {
      console.log('⏭️  Admin user already exists, skipping seed');
    }

    await client.query('COMMIT');
    console.log('✅ Database seeding completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
