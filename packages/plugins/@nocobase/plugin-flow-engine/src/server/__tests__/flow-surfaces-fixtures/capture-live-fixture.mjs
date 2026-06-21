#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const NOISY_KEYS = new Set([
  'id',
  'uid',
  'schemaUid',
  'routeId',
  'tabSchemaName',
  'sort',
  'createdAt',
  'updatedAt',
  'createdById',
  'updatedById',
]);

const GRID_USES = new Set([
  'BlockGridModel',
  'FormGridModel',
  'DetailsGridModel',
  'FilterFormGridModel',
  'AssignFormGridModel',
]);
const WRAPPER_USES = new Set(['FormItemModel', 'DetailsItemModel', 'FilterFormItemModel', 'TableColumnModel']);
const BLOCK_USE_ALIAS = {
  TableBlockModel: 'table',
  CreateFormModel: 'createForm',
  EditFormModel: 'editForm',
  FormBlockModel: 'form',
  DetailsBlockModel: 'details',
  FilterFormBlockModel: 'filterForm',
  ListBlockModel: 'list',
  GridCardBlockModel: 'gridCard',
  MarkdownBlockModel: 'markdown',
  IframeBlockModel: 'iframe',
  MapBlockModel: 'map',
  ChartBlockModel: 'chart',
  CommentsBlockModel: 'comments',
  ActionPanelBlockModel: 'actionPanel',
};
const ACTION_USE_ALIAS = {
  AddNewActionModel: 'addNew',
  ViewActionModel: 'view',
  EditActionModel: 'edit',
  PopupCollectionActionModel: 'popup',
  DeleteActionModel: 'delete',
  UpdateRecordActionModel: 'updateRecord',
  FormSubmitActionModel: 'submit',
  FilterFormSubmitActionModel: 'submit',
};

const args = parseArgs(process.argv.slice(2));
if (args.help === 'true') {
  printHelp();
  process.exit(0);
}
const fixtureName = requiredArg(args, 'name');
const modelUid = requiredArg(args, 'uid');
const fixtureRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const baseUrl = envOrArg(args, 'base-url', 'FLOW_FIXTURE_BASE_URL');
const email = envOrArg(args, 'email', 'FLOW_FIXTURE_EMAIL');
const password = envOrArg(args, 'password', 'FLOW_FIXTURE_PASSWORD');

const dbConfig = {
  host: envOrArg(args, 'db-host', 'FLOW_FIXTURE_DB_HOST'),
  port: envOrArg(args, 'db-port', 'FLOW_FIXTURE_DB_PORT'),
  user: envOrArg(args, 'db-user', 'FLOW_FIXTURE_DB_USER'),
  password: envOrArg(args, 'db-password', 'FLOW_FIXTURE_DB_PASSWORD'),
  database: envOrArg(args, 'db-name', 'FLOW_FIXTURE_DB_NAME'),
};

const token = await signIn({ baseUrl, email, password });
const tree = await fetchJson(
  `${stripTrailingSlash(baseUrl)}/api/flowModels:findOne?uid=${encodeURIComponent(modelUid)}&includeAsyncNode=true`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
).then((payload) => payload?.data || payload);

if (!tree?.uid) {
  throw new Error(`flowModels:findOne did not return a node for uid=${modelUid}`);
}

const ancestry = queryAncestors(modelUid, dbConfig);
const persistedRoutes = queryRouteSnapshot(ancestry, dbConfig);
const readback = normalizeReadbackSnapshot(
  await fetchJson(`${stripTrailingSlash(baseUrl)}/api/flowSurfaces:get?uid=${encodeURIComponent(modelUid)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => payload?.data || payload),
  {
    uid: modelUid,
    kind: inferTargetKind(tree.use),
  },
);

const rawPersisted = compactObject({
  target: compactObject({
    uid: tree.uid,
    kind: inferTargetKind(tree.use),
    node: {
      uid: tree.uid,
      use: tree.use,
    },
    pageSchemaUid: ancestry.pageSchemaUid,
    tabSchemaUid: ancestry.tabSchemaUid,
  }),
  tree,
  pageRoute: persistedRoutes.pageRoute,
});

const bundle = createFlowSurfaceFixture({ rawPersisted, readback });
writeFixtureLayer(fixtureRoot, fixtureName, 'raw-persisted', rawPersisted);
writeFixtureLayer(fixtureRoot, fixtureName, 'readback', readback);
writeFixtureLayer(fixtureRoot, fixtureName, 'refs', bundle.refs);
writeFixtureLayer(fixtureRoot, fixtureName, 'canonical', bundle.canonical);

console.log(
  JSON.stringify(
    {
      fixtureName,
      modelUid,
      pageRouteId: ancestry.pageRouteId || null,
      tabRouteId: ancestry.tabRouteId || null,
      output: {
        rawPersisted: path.join(fixtureRoot, `${fixtureName}.raw-persisted.json`),
        readback: path.join(fixtureRoot, `${fixtureName}.readback.json`),
        refs: path.join(fixtureRoot, `${fixtureName}.refs.json`),
        canonical: path.join(fixtureRoot, `${fixtureName}.canonical.json`),
      },
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = 'true';
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function printHelp() {
  console.log(
    `
Usage:
  node capture-live-fixture.mjs --name <fixture-name> --uid <flow-model-uid>

Environment variables:
  FLOW_FIXTURE_BASE_URL
  FLOW_FIXTURE_EMAIL
  FLOW_FIXTURE_PASSWORD
  FLOW_FIXTURE_DB_HOST
  FLOW_FIXTURE_DB_PORT
  FLOW_FIXTURE_DB_USER
  FLOW_FIXTURE_DB_PASSWORD
  FLOW_FIXTURE_DB_NAME
  `.trim(),
  );
}

function requiredArg(argsMap, key) {
  const value = argsMap[key];
  if (!value) {
    throw new Error(`Missing required argument --${key}`);
  }
  return value;
}

function envOrArg(argsMap, key, envName) {
  const value = argsMap[key] || process.env[envName];
  if (!value) {
    throw new Error(`Missing --${key} or environment variable ${envName}`);
  }
  return value;
}

async function signIn({ baseUrl, email, password }) {
  const payload = await fetchJson(`${stripTrailingSlash(baseUrl)}/api/auth:signIn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const token = payload?.data?.token || payload?.token;
  if (!token) {
    throw new Error('auth:signIn did not return a token');
  }
  return token;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function stripTrailingSlash(input) {
  return input.replace(/\/$/, '');
}

function queryAncestors(uid, dbConfig) {
  const sql = `
with
tab_route as (
  select dr.id, dr."parentId", dr."schemaUid"
  from "flowModelTreePath" p
  join "desktopRoutes" dr on dr."schemaUid" = p.ancestor
  where p.descendant = '${escapeSql(uid)}'
    and dr.type = 'tabs'
  order by p.depth desc
  limit 1
),
page_route as (
  select dr.id, dr."schemaUid"
  from "flowModelTreePath" p
  join "desktopRoutes" dr on dr."schemaUid" = p.ancestor
  where p.descendant = '${escapeSql(uid)}'
    and dr.type in ('flowPage', 'page')
  order by p.depth desc
  limit 1
),
resolved_page_route as (
  select pr.id, pr."schemaUid"
  from page_route pr
  union all
  select dr.id, dr."schemaUid"
  from tab_route tr
  join "desktopRoutes" dr on dr.id = tr."parentId"
  where tr."parentId" is not null
  limit 1
)
select json_build_object(
  'pageRouteId', (select id from resolved_page_route),
  'pageSchemaUid', (select "schemaUid" from resolved_page_route),
  'tabRouteId', (select id from tab_route),
  'tabSchemaUid', (select "schemaUid" from tab_route)
);
  `.trim();

  return queryJson(sql, dbConfig);
}

function queryRouteSnapshot(ancestry, dbConfig) {
  const pageRouteId = ancestry.pageRouteId || 0;
  const sql = `
select json_build_object(
  'pageRoute', (
    select to_jsonb(dr)
    from "desktopRoutes" dr
    where dr.id = ${Number(pageRouteId) || 0}
  )
);
  `.trim();

  return queryJson(sql, dbConfig);
}

function queryJson(sql, dbConfig) {
  const result = spawnSync(
    'psql',
    ['-h', dbConfig.host, '-p', String(dbConfig.port), '-U', dbConfig.user, '-d', dbConfig.database, '-Atc', sql],
    {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      },
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `psql exited with ${result.status}`);
  }
  return JSON.parse((result.stdout || '').trim() || '{}');
}

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function inferTargetKind(use) {
  if (use === 'RootPageModel' || use === 'ChildPageModel') {
    return 'page';
  }
  if (use === 'RootPageTabModel' || use === 'ChildPageTabModel') {
    return 'tab';
  }
  if ((use || '').endsWith('GridModel')) {
    return 'grid';
  }
  if ((use || '').endsWith('BlockModel')) {
    return 'block';
  }
  return 'node';
}

function writeFixtureLayer(root, name, layer, data) {
  const filepath = path.join(root, `${name}.${layer}.json`);
  fs.writeFileSync(filepath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function createFlowSurfaceFixture({ rawPersisted, readback }) {
  const normalized = normalizeCanonicalSource(
    materializeCanonicalSource(readback) || materializeCanonicalSource(rawPersisted),
  );
  return {
    canonical: normalized.canonical,
    refs: normalized.refs,
  };
}

function materializeCanonicalSource(input) {
  const raw = toPlainObject(input);
  const persisted = raw?.persisted ? toPlainObject(raw.persisted) : undefined;
  const tree = persisted?.tree || raw?.tree;
  const pageRoute = persisted?.pageRoute || raw?.pageRoute;
  return compactObject({
    target: raw?.target,
    tree,
    pageRoute,
  });
}

function normalizeReadbackSnapshot(readback, fallbackTarget) {
  const raw = toPlainObject(readback);
  const tree = raw?.tree;
  const target = normalizeReadTarget(raw?.target, fallbackTarget, tree);

  return compactObject({
    target,
    tree,
    nodeMap: isPlainObject(raw?.nodeMap) ? raw.nodeMap : buildNodeMap(tree),
    pageRoute: raw?.pageRoute,
    route: raw?.route,
  });
}

function normalizeReadTarget(target, fallbackTarget, tree) {
  const explicitLocator = toPlainObject(target?.locator);
  const resolvedUid = target?.uid || target?.node?.uid || fallbackTarget?.uid || tree?.uid;
  const locator =
    explicitLocator ||
    (resolvedUid
      ? {
          uid: resolvedUid,
        }
      : compactObject({
          pageSchemaUid: target?.pageSchemaUid,
          tabSchemaUid: target?.tabSchemaUid,
          routeId: target?.routeId,
        }));

  return compactObject({
    locator,
    uid: resolvedUid || locator?.uid,
    kind: target?.kind || fallbackTarget?.kind,
  });
}

function buildNodeMap(node, carry = {}) {
  if (!node?.uid) {
    return carry;
  }
  carry[node.uid] = compactObject({
    uid: node.uid,
    use: node.use,
    props: node.props,
    decoratorProps: node.decoratorProps,
    stepParams: node.stepParams,
    flowRegistry: node.flowRegistry,
  });
  Object.values(node?.subModels || {}).forEach((value) => {
    const children = Array.isArray(value) ? value : [value].filter(Boolean);
    children.forEach((child) => buildNodeMap(child, carry));
  });
  return carry;
}

function normalizeCanonicalSource(source) {
  const state = {
    aliases: new Set(),
    counts: {},
    topLevelTabIndex: 0,
  };
  const refs = {};
  const raw = toPlainObject(source);

  const canonical = compactObject({
    target: compactObject({
      kind: raw?.target?.kind,
      use: raw?.target?.node?.use || raw?.tree?.use,
    }),
    tree: raw?.tree ? normalizeNode(raw.tree, state, refs) : undefined,
    pageRoute: raw?.pageRoute ? normalizeRoute(raw.pageRoute, 'page.route', refs) : undefined,
  });

  return {
    canonical,
    refs,
  };
}

function normalizeNode(node, state, refs, forcedAlias) {
  const alias = uniqueAlias(forcedAlias || inferNodeAlias(node, state), state);
  if (node?.uid) {
    refs[alias] = {
      ...(refs[alias] || {}),
      uid: node.uid,
      schemaUid: node.schemaUid,
    };
  }

  const subModels = Object.fromEntries(
    Object.entries(node?.subModels || {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([subKey, subValue]) => [subKey, Array.isArray(subValue) ? subValue : [subValue].filter(Boolean)])
      .map(([subKey, children]) => [
        subKey,
        children.map((child) => normalizeNode(child, state, refs, inferChildAlias(alias, subKey, child, state))),
      ])
      .filter(([, value]) => value.length > 0),
  );

  return compactObject({
    alias,
    use: node?.use,
    props: normalizeValue(omit(node?.props || {}, ['route', 'routeId'])),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: Object.keys(subModels).length ? subModels : undefined,
  });
}

function normalizeRoute(route, alias, refs) {
  const plainRoute = toPlainObject(route);
  refs[alias] = {
    ...(refs[alias] || {}),
    routeId: plainRoute?.id,
    schemaUid: plainRoute?.schemaUid,
  };

  return compactObject({
    alias,
    type: plainRoute?.type,
    title: plainRoute?.title,
    icon: plainRoute?.icon,
    options: normalizeValue(plainRoute?.options),
  });
}

function inferNodeAlias(node, state) {
  const use = String(node?.use || '');
  if (use === 'RootPageModel') {
    return 'page';
  }
  if (use === 'RootPageTabModel') {
    return getTopLevelTabAlias(state.topLevelTabIndex++);
  }
  if (use === 'TableActionsColumnModel') {
    return nextCountAlias('column.actions', state);
  }
  if (BLOCK_USE_ALIAS[use]) {
    return nextCountAlias(`block.${BLOCK_USE_ALIAS[use]}`, state);
  }
  if (ACTION_USE_ALIAS[use]) {
    return nextCountAlias(`action.${ACTION_USE_ALIAS[use]}`, state);
  }
  if (WRAPPER_USES.has(use)) {
    const fieldPath = String(node?.stepParams?.fieldSettings?.init?.fieldPath || 'unknown');
    return `field.${fieldPath}.wrapper`;
  }
  if (use.endsWith('FieldModel')) {
    return nextCountAlias(`node.${use}`, state);
  }
  return nextCountAlias(`node.${use || 'FlowModel'}`, state);
}

function inferChildAlias(parentAlias, subKey, child, state) {
  if (subKey === 'field' && parentAlias.startsWith('field.') && parentAlias.endsWith('.wrapper')) {
    return `${parentAlias.slice(0, -'.wrapper'.length)}.inner`;
  }
  if (child?.use === 'ChildPageModel' && (parentAlias.startsWith('action.') || parentAlias.startsWith('field.'))) {
    return `${parentAlias}.popup.page`;
  }
  if (child?.use === 'ChildPageTabModel' && parentAlias.endsWith('.popup.page')) {
    return parentAlias.replace(/\.page$/, '.tab');
  }
  if (child?.use === 'BlockGridModel' && parentAlias.endsWith('.popup.tab')) {
    return parentAlias.replace(/\.tab$/, '.grid');
  }
  if (GRID_USES.has(child?.use) && (parentAlias.startsWith('block.') || parentAlias.startsWith('field.'))) {
    return `${parentAlias}.grid`;
  }
  return inferNodeAlias(child, state);
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (isPlainObject(value)) {
    return compactObject(
      Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !NOISY_KEYS.has(key))
          .map(([key, item]) => [key, normalizeValue(item)]),
      ),
    );
  }
  return value;
}

function compactObject(input) {
  return Object.fromEntries(
    Object.entries(input || {}).filter(([, value]) => {
      if (typeof value === 'undefined') {
        return false;
      }
      if (isPlainObject(value)) {
        return Object.keys(value).length > 0;
      }
      return true;
    }),
  );
}

function uniqueAlias(alias, state) {
  if (!state.aliases.has(alias)) {
    state.aliases.add(alias);
    return alias;
  }
  return nextCountAlias(alias, state);
}

function nextCountAlias(prefix, state) {
  state.counts[prefix] = (state.counts[prefix] || 0) + 1;
  return `${prefix}${state.counts[prefix]}`;
}

function getTopLevelTabAlias(index) {
  return index === 0 ? 'tab.main' : `tab.${index + 1}`;
}

function toPlainObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => toPlainObject(item));
  }
  if (value?.toJSON) {
    return value.toJSON();
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlainObject(item)]));
  }
  return value;
}

function omit(value, keys) {
  return Object.fromEntries(Object.entries(value || {}).filter(([key]) => !keys.includes(key)));
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
