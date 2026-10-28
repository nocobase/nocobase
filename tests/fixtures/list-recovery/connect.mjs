import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// This is the reviewed reconciliation of this known business fixture, not a general template upgrade command.
export async function connectSample(directory) {
  const root = path.resolve(directory);
  for (const hook of [
    'use-list-data',
    'use-list-location',
    'use-table-url-state',
  ]) {
    await access(path.join(root, `client/hooks/${hook}.ts`));
  }
  const file = path.join(root, 'client/pages/loans.tsx');
  let source = await readFile(file, 'utf8');
  for (const marker of [
    'UPGRADE_IMPORTS',
    'UPGRADE_LOCATION',
    'UPGRADE_REQUEST',
    'UPGRADE_TABLE',
  ]) {
    if (!source.includes(marker))
      throw new Error(
        `Review the business conflict at ${file}: missing ${marker}`,
      );
  }
  const replace = (before, after) => {
    if (source.split(before).length !== 2)
      throw new Error(`Review the fixture conflict: ${before}`);
    source = source.replace(before, after);
  };
  replace(
    "import { useSettingsData } from './settings/hooks.js';",
    "import { useListData } from '#hooks/use-list-data';",
  );
  replace(
    '// UPGRADE_IMPORTS',
    "import { useListLocation } from '#hooks/use-list-location';\nimport { useTableUrlState } from '#hooks/use-table-url-state';",
  );
  replace(
    '  const [params, setParams] = useSearchParams();\n  const active = true; // UPGRADE_LOCATION',
    "  const { params, setParams, active } = useListLocation();\n  const remote = new URLSearchParams(params);\n  if (params.get('mode') === 'client') { remote.delete('page'); remote.delete('pageSize'); }",
  );
  replace(
    '  const request = useSettingsData<LoanPage>(`loans?${params}`, true); // UPGRADE_REQUEST',
    '  const request = useListData<LoanPage>(`loans?${remote}`, { active, keepPreviousData: true });',
  );
  replace(
    '// UPGRADE_TABLE',
    "const tableState = useTableUrlState({ active, revision: request.revision, sortColumns: ['name'], rowCount: !request.loading && !request.error ? request.data?.meta.total : undefined });",
  );
  replace(
    "{request.error ? 'Read failed' : ''}",
    "{tableState.error?.message ?? (request.error ? 'Read failed' : '')}",
  );
  replace('data={shown}', 'data={rows}');
  replace(
    '          manualPagination\n',
    "          {...tableState}\n          manualPagination={params.get('mode') !== 'client'}\n",
  );
  replace(
    '          paginationState={{ pageIndex: page - 1, pageSize }}\n',
    '',
  );
  replace('  useSearchParams,\n', '');
  if (source.includes('UPGRADE_'))
    throw new Error(
      'The fixture needs manual reconciliation. No file was written.',
    );
  await writeFile(file, source);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  if (process.argv.length !== 3)
    throw new Error('Usage: node connect.mjs /absolute/generated-app');
  await connectSample(process.argv[2]);
}
