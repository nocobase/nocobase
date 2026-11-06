import { readFile, writeFile, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Installs business-owned verification sources only. Template source reconciliation belongs to the upgrade Skill.
export async function installSample(directory) {
  const root = path.resolve(directory);
  const metadata = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );
  if (
    ![
      '@nocobase/app-template-default',
      '@nocobase/app-template-examples',
    ].includes(metadata.nocobase?.templatePackage)
  ) {
    throw new Error('Expected a generated Default or Examples application.');
  }
  const files = [
    ['page.tsx', 'client/pages/loans.tsx'],
    ['routes.ts', 'server/routes/loans.ts'],
    ['migration.ts', 'database/main/migrations/202610270001_recovery_loans.ts'],
  ];
  for (const [, destination] of files) {
    const exists = await access(path.join(root, destination)).then(
      () => true,
      () => false,
    );
    if (exists)
      throw new Error(
        `Refusing to overwrite application-owned source: ${destination}`,
      );
  }
  const clientFile = path.join(root, 'client/routes.ts');
  const serverFile = path.join(root, 'server/routes/index.ts');
  const client = await readFile(clientFile, 'utf8');
  const server = await readFile(serverFile, 'utf8');
  const declaration =
    /const routes: readonly AppRouteContribution<Application>\[\] = \[/u;
  if (!client.includes('defineAppRoutes([') || !declaration.test(server)) {
    throw new Error(
      'Review this application composition before adding the fixture.',
    );
  }
  const route = `
  {
    name: 'loans', path: '/loans', auth: 'required',
    authz: {resource: {type: 'settings', id: 'authorization.permission-sets'}, action: 'update'},
    navigation: {title: 'Equipment loans'}, breadcrumb: {title: 'Equipment loans'},
    componentLoader: () => import('./pages/loans.js'),
    children: [{name: 'loanDetail', path: ':id', breadcrumb: {title: 'Loan details'},
      componentLoader: async () => ({default: (await import('./pages/loans.js')).Detail})}],
  },`;
  for (const [source, destination] of files) {
    await copyFile(
      new URL(source, import.meta.url),
      path.join(root, destination),
    );
  }
  await writeFile(
    clientFile,
    client.replace('defineAppRoutes([', `defineAppRoutes([${route}`),
  );
  await writeFile(
    serverFile,
    `import loans from './loans.js';\n${server.replace(declaration, '$&loans,')}`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  if (process.argv.length !== 3)
    throw new Error('Usage: node install.mjs /absolute/generated-app');
  await installSample(process.argv[2]);
}
