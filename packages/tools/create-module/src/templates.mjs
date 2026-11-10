import { readFileSync } from 'node:fs';
const q = JSON.stringify;
const foundation = '@nocobase/app-plugin-modules';
const copy = {
  'en-US': [
    'Your module workspace.',
    'Records',
    'Name',
    'Create',
    'Loading…',
    'The operation failed.',
  ],
  'zh-CN': [
    '你的模块工作台。',
    '业务记录',
    '名称',
    '新增',
    '加载中…',
    '操作失败。',
  ],
  'zh-TW': [
    '你的模組工作台。',
    '業務記錄',
    '名稱',
    '新增',
    '載入中…',
    '操作失敗。',
  ],
  'ja-JP': [
    'モジュールのワークスペース。',
    'レコード',
    '名前',
    '作成',
    '読み込み中…',
    '操作に失敗しました。',
  ],
  'de-DE': [
    'Ihr Modul-Arbeitsbereich.',
    'Datensätze',
    'Name',
    'Erstellen',
    'Wird geladen…',
    'Der Vorgang ist fehlgeschlagen.',
  ],
  'es-ES': [
    'El espacio de trabajo del módulo.',
    'Registros',
    'Nombre',
    'Crear',
    'Cargando…',
    'La operación ha fallado.',
  ],
  'fr-FR': [
    'Votre espace de travail du module.',
    'Enregistrements',
    'Nom',
    'Créer',
    'Chargement…',
    'Échec de l’opération.',
  ],
  'pt-BR': [
    'Seu espaço de trabalho do módulo.',
    'Registros',
    'Nome',
    'Criar',
    'Carregando…',
    'A operação falhou.',
  ],
  'vi-VN': [
    'Không gian làm việc của mô-đun.',
    'Bản ghi',
    'Tên',
    'Tạo',
    'Đang tải…',
    'Thao tác không thành công.',
  ],
  'id-ID': [
    'Ruang kerja modul Anda.',
    'Catatan',
    'Nama',
    'Buat',
    'Memuat…',
    'Operasi gagal.',
  ],
};
export function moduleFiles({ id, packageName, title, titleZh, template }) {
  const records = template === 'records';
  const symbol = id
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
  const routeName = symbol[0].toLowerCase() + symbol.slice(1);
  const collection = `module${symbol}Records`;
  const files = {
    'module.ts': `import type { ModuleDescriptor } from '${foundation}/shared';
const module: ModuleDescriptor = { id: ${q(id)}, namespace: ${q(packageName)}, entry: ${q(`/modules/${id}`)}, icon: 'LayoutGrid', tone: 1 };
export default module;`,
    'client/plugin.ts': `import { defineClientPlugin, type AppClientPluginFactory } from '@nocobase/app-client/plugins';
import locales from './locales/index.js'; import routes from './routes.js';
const plugin: AppClientPluginFactory = defineClientPlugin({ packageName: ${q(packageName)}, locales, routes }); export default plugin;`,
    'client/index.ts': "export { default } from './plugin.js';",
    'client/layout.tsx': `import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { ModuleLayout, type ModuleNavigationItem } from '${foundation}/client';
import { LayoutGrid${records ? ', List' : ''} } from 'lucide-react';
import module from '../module.js';
export default function Layout({ children }: { readonly children: ReactNode }): ReactElement {
 const { t } = useTranslation(module.namespace);
 const navigation: readonly ModuleNavigationItem[] = [{ path: module.entry, title: t('title'), icon: LayoutGrid, end: true }${records ? ", { path: module.entry + '/records', title: t('section'), icon: List }" : ''}];
 return <ModuleLayout module={module} navigation={navigation}>{children}</ModuleLayout>;
}`,
    'client/routes.ts': `import { defineAppRoutes, type AppClientRouteContribution } from '@nocobase/app-client/plugins';
const routes: AppClientRouteContribution = defineAppRoutes([
 { name: '${routeName}Overview', path: '/modules/${id}', auth: 'required', authz: 'unrestricted', breadcrumb: { title: 'title' }, componentLoader: () => import('./pages/overview.js') },
 ${records ? `{ name: '${routeName}Records', path: '/modules/${id}/records', auth: 'required', authz: 'unrestricted', breadcrumb: { title: 'section' }, componentLoader: () => import('./pages/records.js') },` : ''}
]); export default routes;`,
    'client/pages/overview.tsx': `import type { ReactElement } from 'react'; import { ModulePage } from '${foundation}/client'; import module from '../../module.js'; import Layout from '../layout.js';
export default function Page(): ReactElement { return <Layout><ModulePage module={module} /></Layout>; }`,
    'server/index.ts': "export { default } from './plugin.js';",
    'server/plugin.ts': `import path from 'node:path'; import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins'; import serviceProviders from './providers/index.js'; ${records ? "import routes from './routes/index.js';" : ''}
const plugin: AppServerPlugin = defineServerPlugin({ packageName: ${q(packageName)}, baseDir: path.resolve(import.meta.dirname, '..'), serviceProviders, ${records ? 'routes,' : ''} database: { connections: { main: {} } } }); export default plugin;`,
    'server/providers/index.ts': `import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins'; import { ModuleProvider } from './module.js'; const providers: readonly AppPluginProviderConstructor[] = [ModuleProvider]; export default providers;`,
    'server/providers/module.ts': `import { ServiceProvider } from '@nocobase/service-provider'; import type { AppPluginApplication } from '@nocobase/app-server/plugins'; import { modulesServiceToken } from '${foundation}/server'; import module from '../../module.js';
export class ModuleProvider extends ServiceProvider<AppPluginApplication> { public readonly name: string = ${q(packageName)}; public override register(): void { this.app.container.resolve(modulesServiceToken).register({ ...module, packageName: ${q(packageName)} }); } }`,
    'database/main/migrations/.gitkeep': '',
    'database/main/seeds/.gitkeep': '',
    'client/locales/index.ts': `import type { LocaleLoaders } from '@nocobase/i18n'; const locales: LocaleLoaders = { ${Object.keys(
      copy,
    )
      .map((locale) => `${q(locale)}: () => import('./${locale}.js'),`)
      .join('\n')} }; export default locales;`,
    'README.md': `# ${title}\n\nBusiness module: \`${packageName}\`. Register its Server and Client entries in the host App. It starts with the App after its database tasks complete. No commercial management plugin or installation seed is required. The host can optionally register a module management policy. Routes require an unrestricted administrator; add domain permissions before broadening access.\n\nRun checks from the App root: \`pnpm --filter ${packageName} check\`.\n`,
  };
  for (const [locale, values] of Object.entries(copy)) {
    const data = {
      title: locale.startsWith('zh') ? titleZh || title : title,
      description: values[0],
      section: values[1],
      name: values[2],
      create: values[3],
      loading: values[4],
      error: values[5],
    };
    files[`client/locales/${locale}.ts`] =
      locale === 'en-US'
        ? `import type { LocaleResource } from '@nocobase/i18n'; const messages = ${JSON.stringify(data, null, 2)}; export type ModuleResource = LocaleResource<typeof messages>; export default messages;`
        : `import type { ModuleResource } from './en-US.js'; const messages: ModuleResource = ${JSON.stringify(data, null, 2)}; export default messages;`;
  }
  if (records) {
    for (const name of ['button.tsx', 'input.tsx'])
      files[`client/components/ui/${name}`] = readFileSync(
        new URL(`../template/client/components/ui/${name}`, import.meta.url),
        'utf8',
      );
    files[
      `database/main/migrations/module_${id.replaceAll('-', '_')}_records.ts`
    ] =
      `import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({ name: 'module_${id.replaceAll('-', '_')}_records', async up({ builder }) { await builder.createCollection(${q(collection)}, c => { c.string('id', { primaryKey: true, length: 64, nullable: false }); c.string('name', { length: 120, nullable: false }); c.string('createdAt', { length: 32, nullable: false }); c.index(['createdAt', 'id']); }); }, async down({ builder }) { await builder.dropCollection(${q(collection)}); } }); export default migration;`;
    files['server/routes/index.ts'] = `import { randomUUID } from 'node:crypto';
import { Hono, type Context } from 'hono'; import { z } from 'zod';
import { authenticationToken, type AuthEnv } from '@nocobase/app-plugin-authentication';
import { authorizationToken, type AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import { databaseManagerToken } from '@nocobase/db';
import { modulesServiceToken } from '${foundation}/server';
import { ApiError, defineApiRoutes, apiValidator, describeRoute, dataResponse, apiErrorResponses, executeIdempotentMutation, type AppApiRouteContribution } from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
type Env = AuthEnv & AuthorizationEnv;
const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [defineApiRoutes(app => {
 const router = new Hono<Env>(); const path = '/modules/${id}/records';
 const database = app.container.resolve(databaseManagerToken); const modules = app.container.resolve(modulesServiceToken);
 const authorize = async (c: Context<Env>): Promise<void> => {
  if (!(await c.get('authz').snapshot()).unrestricted) throw new ApiError({ status: 'PERMISSION_DENIED', domain: '${routeName}', reason: 'ADMIN_REQUIRED', message: 'Administrator access is required.' });
  await modules.requireAvailable(${q(id)});
 };
 router.use(path, app.container.resolve(authenticationToken).required(), app.container.resolve(authorizationToken).middleware(), async (c, next) => { await authorize(c); await next(); });
 const document = (operationId: string): ReturnType<typeof describeRoute> => describeRoute({ operationId, tags: [${q(title)}], summary: operationId, responses: { 200: dataResponse(z.unknown()), ...apiErrorResponses } });
 router.get(path, document('${routeName}ListRecords'), async c => c.json({ data: await database.repository(${q(collection)}).findMany({ limit: 50, sort: s => [s.field('createdAt').desc(), s.field('id').desc()] }) }));
 router.post(path, document('${routeName}CreateRecord'), apiValidator('json', z.strictObject({ name: z.string().trim().min(1).max(120) })), async c => {
  const auth = c.get('auth'); if (!auth || auth.credential) throw new ApiError({ status: 'PERMISSION_DENIED', domain: '${routeName}', reason: 'USER_REQUIRED', message: 'A user session is required.' });
  const input = c.req.valid('json');
  const result = await executeIdempotentMutation({ connection: database.connection(), key: c.req.header('Idempotency-Key') || '', principal: auth.user.id, operation: '${routeName}/createRecord', input, authorize: () => authorize(c), authorizeReplay: () => authorize(c), execute: async tx => { await modules.requireAvailable(${q(id)}, tx); return (await tx.repository(${q(collection)}).createOne({ values: { id: randomUUID(), name: input.name, createdAt: new Date().toISOString() } })).record; } });
  c.header('Idempotency-Replayed', String(result.replayed)); return c.json({ data: result.data });
 }); return new Hono().route('/', router);
})]; export default routes;`;
    files['client/pages/records.tsx'] =
      `import { useState, useId, type ReactElement } from 'react';
import { useApiClient, useSubmission } from '@nocobase/app-client'; import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query'; import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { Button } from '#components/ui/button'; import { Input } from '#components/ui/input';
import Layout from '../layout.js';
export default function Page(): ReactElement {
 const api = useApiClient(), client = useQueryClient(), { t } = useTranslation(${q(packageName)}), fieldId = useId();
 const { session } = useAuthentication();
 const [name, setName] = useState(''), [error, setError] = useState(false); const submission = useSubmission({ scope: session?.user.id + '/${routeName}/create' });
 const records = useQuery({ enabled: !!session?.user, queryKey: ['${packageName}', session?.user.id, 'records'], queryFn: ({ signal }) => api.request<{ data: { id: string; name: string }[] }>({ path: 'modules/${id}/records', signal }) });
 return <Layout><h1 className='text-xl font-semibold'>{t('section')}</h1><form className='flex max-w-lg flex-col gap-3' onSubmit={event => { event.preventDefault(); setError(false); void submission.run({ name }, (key, signal, input) => api.request({ path: 'modules/${id}/records', method: 'POST', json: input, headers: { 'Idempotency-Key': key }, signal })).then(async result => { if (result) { setName(''); await client.invalidateQueries({ queryKey: ['${packageName}', session?.user.id, 'records'] }); } }).catch(() => setError(true)); }}><label htmlFor={fieldId}>{t('name')}</label><Input id={fieldId} required maxLength={120} value={name} onChange={event => setName(event.target.value)} /><Button type='submit' disabled={submission.submitting}>{t('create')}</Button></form>{error || records.error ? <p role='alert'>{t('error')}</p> : null}{records.isPending ? <p role='status'>{t('loading')}</p> : <ul>{records.data?.data.map(record => <li key={record.id}>{record.name}</li>)}</ul>}</Layout>;
}`;
  }
  return files;
}
