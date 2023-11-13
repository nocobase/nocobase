import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { checkServer, checkUI, runCommand } from './utils';

if (!fs.existsSync('playwright')) {
  fs.mkdirSync('playwright');
}

if (!fs.existsSync('.env.e2e') && fs.existsSync('.env.e2e.example')) {
  const env = fs.readFileSync('.env.e2e.example');
  fs.writeFileSync('.env.e2e', env);
}

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') });

(async () => {
  await checkServer();
  console.log('server is ready, check UI...');
  await checkUI();
  console.log('UI is ready.');
  await runCommand('npx', ['playwright', 'test', ...process.argv.slice(2)]);
})();
