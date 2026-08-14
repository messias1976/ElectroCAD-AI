const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const identifier = process.argv[2];
if (!identifier) { console.error('Uso: pnpm run make:admin -- email-ou-usuario'); process.exit(1); }
prisma.user.updateMany({
  where: { OR: [{ username: identifier }, { email: identifier }] },
  data: { role: 'ADMIN' }
}).then(async (result) => {
  if (!result.count) throw new Error('Usuário não encontrado: ' + identifier);
  const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] }, select: { id: true, username: true, email: true, role: true }});
  console.log(`Usuário ${user.email || user.username} agora é ${user.role}.`);
}).catch((e) => { console.error('Não foi possível promover o usuário:', e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
