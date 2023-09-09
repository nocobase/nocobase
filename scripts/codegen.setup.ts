import { execSync } from 'node:child_process';
import { PORT, commonConfig, deleteNocoBase, runNocoBase } from './utils';

runNocoBase();
try {
  execSync(
    `npx playwright codegen --load-storage=./.auth/codegen.auth.json http://localhost:${PORT} --save-storage=./.auth/codegen.auth.json`,
    commonConfig,
  );
} catch (err) {
  if (err.message.includes('auth.json')) {
    execSync(`npx playwright codegen http://localhost:${PORT} --save-storage=./.auth/codegen.auth.json`, commonConfig);
  } else {
    console.error(err);
  }
} finally {
  deleteNocoBase();
}
