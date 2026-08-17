const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'apps', 'api');
const apiEnv = path.join(apiDir, '.env');
const example = path.join(apiDir, '.env.example');

function run(command) {
  console.log(`\n> ${command}`);
  cp.execSync(command, { cwd: root, stdio: 'inherit', shell: true });
}

if (!fs.existsSync(apiEnv)) {
  const content = fs.existsSync(example)
    ? fs.readFileSync(example, 'utf8')
    : 'DATABASE_URL=file:./dev.db\nJWT_SECRET=dev_secret_change_me\nOPENAI_API_KEY=\nOPENAI_MODEL=gpt-5-mini\nAI_ENCRYPTION_KEY=dev_ai_encryption_secret_change_me\n';
  fs.writeFileSync(apiEnv, content.endsWith('\n') ? content : content + '\n', 'utf8');
  console.log('Criado apps/api/.env a partir de apps/api/.env.example');
} else {
  console.log('apps/api/.env já existe; mantendo sua configuração.');
}

if (fs.existsSync(apiEnv)) {
  const current = fs.readFileSync(apiEnv, 'utf8');
  if (!/^AI_ENCRYPTION_KEY=/m.test(current)) {
    fs.appendFileSync(apiEnv, `\nAI_ENCRYPTION_KEY=${require('crypto').randomBytes(32).toString('hex')}\n`, 'utf8');
    console.log('Adicionado AI_ENCRYPTION_KEY ao apps/api/.env');
  }
}

run('pnpm install');
run('pnpm --filter api exec prisma generate');
run('pnpm --filter api exec prisma db push');
console.log('\n✓ Setup concluído.');
