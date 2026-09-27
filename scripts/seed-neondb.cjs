const { neon } = require('@neondatabase/serverless');

const NEON_URL = process.env.VITE_NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_8BMpQ7mfGKjS@ep-empty-credit-ayosbjh6-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(NEON_URL);

async function seed() {
  console.log('Connecting to NeonDB and seeding initial data...');

  // 1. Seed Users (Admin & Technicians)
  const defaultAccounts = [
    {
      id: 'acc-admin-1',
      name: 'K&S Admin Operations',
      email: 'admin@kssolar.pk',
      phone: '03268630029',
      password_hash: 'admin123',
      is_admin: true,
      is_master: true,
      city: 'Lahore',
      role: 'admin',
      status: 'approved',
    },
    {
      id: 'acc-admin-2',
      name: 'K&S Central Management',
      email: 'knssolarenergy@gmail.com',
      phone: '03268630029',
      password_hash: 'admin123',
      is_admin: true,
      is_master: true,
      city: 'Lahore',
      role: 'admin',
      status: 'approved',
    },
    {
      id: 'acc-tech-1',
      name: 'Aoun Abbas',
      email: 'aoun13abbas786abbas@gmail.com',
      phone: '03362475996',
      password_hash: 'tech123',
      is_admin: false,
      is_master: false,
      city: 'Bhakkar',
      role: 'technician',
      specialty: 'Solar Panel Wash Specialist',
      status: 'approved',
    },
    {
      id: 'acc-tech-2',
      name: 'Arshad Farooq',
      email: 'ranaarshad78786@gmail.com',
      phone: '03171114965',
      password_hash: 'tech123',
      is_admin: false,
      is_master: false,
      city: 'Bhakkar',
      role: 'technician',
      specialty: 'Inverter & Electrical Specialist',
      status: 'approved',
    },
    {
      id: 'acc-tech-3',
      name: 'Babar Hayat',
      email: 'babarhayata2814@gmail.com',
      phone: '03171114966',
      password_hash: 'tech123',
      is_admin: false,
      is_master: false,
      city: 'Bhakkar',
      role: 'technician',
      specialty: 'Solar System Rooftop Engineer',
      status: 'approved',
    },
    {
      id: 'acc-tech-4',
      name: 'Irfan Ali',
      email: 'kandssolar@gmail.com',
      phone: '03218844221',
      password_hash: 'tech123',
      is_admin: false,
      is_master: false,
      city: 'Bhakkar',
      role: 'technician',
      specialty: 'General Solar Technician',
      status: 'approved',
    },
  ];

  for (const acc of defaultAccounts) {
    await sql`
      INSERT INTO users (
        id, name, email, phone, password_hash, is_admin, is_master, city, role, specialty, status, created_at
      ) VALUES (
        ${acc.id}, ${acc.name}, ${acc.email}, ${acc.phone}, ${acc.password_hash},
        ${acc.is_admin}, ${acc.is_master}, ${acc.city}, ${acc.role}, ${acc.specialty || null}, ${acc.status}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_admin = EXCLUDED.is_admin,
        status = EXCLUDED.status;
    `;
  }
  console.log('Seeded users into NeonDB successfully.');

  // 2. Seed Default Settings
  const settingsEntries = [
    ['whatsapp_booking', '923171114980'],
    ['whatsapp_complaint', '923171114976'],
    ['whatsapp_installation', '923171114976'],
    ['whatsapp_support', '923280454939'],
    ['contact_phone', '923280454939'],
    ['contact_email', 'info@knssolar.com'],
    ['contact_address', 'K&S Solar Energy Headquarters, Pakistan'],
    ['referral_system_enabled', 'true'],
    ['referral_reward_amount_pkr', '500'],
  ];

  for (const [key, val] of settingsEntries) {
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${val}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW();
    `;
  }
  console.log('Seeded settings into NeonDB successfully.');

  // Verify counts
  const userCount = await sql`SELECT count(*) FROM users`;
  const settingsCount = await sql`SELECT count(*) FROM settings`;
  console.log(`Current NeonDB state: users=${userCount[0].count}, settings=${settingsCount[0].count}`);
}

seed().catch(console.error);
