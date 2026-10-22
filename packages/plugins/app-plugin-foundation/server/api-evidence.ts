import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';
import { StaticValues } from './static-values.js';
import {
  objectProperty,
  returned,
  REPOSITORY_ACTIONS,
  type ApiReference,
} from './request-evidence.js';

export interface EndpointEvidence extends ApiReference {
  readonly providers: readonly string[];
  readonly collections?: readonly string[];
}

/** Compose only routers reachable from the selected API exports, retaining method and handler boundaries. */
export function apiDependencies(
  entry: ts.SourceFile,
  sources: readonly {
    readonly ast: ts.SourceFile;
    readonly nodes: ReadonlySet<ts.Node>;
  }[],
  analysis: SourceEvidence,
  providers: (file: string, nodes: readonly ts.Node[]) => readonly string[],
): EndpointEvidence[] {
  const endpoints: EndpointEvidence[] = [];
  const roots = new Set<ts.Node>();
  const visited = new Set<ts.Node>();
  const imported = (node: ts.Node, module: string, name: string): boolean =>
    (analysis.symbol(node)?.declarations ?? []).some((declaration) => {
      if (
        !ts.isImportSpecifier(declaration) ||
        (declaration.propertyName?.text ?? declaration.name.text) !== name
      )
        return false;
      const statement = declaration.parent.parent.parent;
      return (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteralLike(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === module
      );
    });
  const identity = (
    node: ts.Node,
    seen = new Set<ts.Node>(),
  ): ts.Node | undefined => {
    if (seen.has(node)) return undefined;
    seen.add(node);
    for (const value of analysis.values(node)) {
      if (
        ts.isNewExpression(value) &&
        imported(value.expression, 'hono', 'Hono')
      )
        return value;
      if (
        ts.isCallExpression(value) &&
        ts.isPropertyAccessExpression(value.expression)
      )
        return identity(value.expression.expression, seen);
      if (value !== node) {
        const result = identity(value, seen);
        if (result) return result;
      }
    }
    return undefined;
  };
  const repository = (call: ts.CallExpression): void => {
    const option = call.arguments[0];
    for (const config of option ? analysis.values(option) : []) {
      if (!ts.isObjectLiteralExpression(config)) continue;
      const declared = objectProperty(config, 'repositories');
      for (const array of declared ? analysis.values(declared) : []) {
        if (!ts.isArrayLiteralExpression(array)) continue;
        for (const element of array.elements)
          for (const exposure of analysis.values(element)) {
            if (!ts.isObjectLiteralExpression(exposure)) continue;
            const name = objectProperty(exposure, 'name');
            const actions = objectProperty(exposure, 'actions');
            const collection = objectProperty(exposure, 'collection');
            const names = name
              ? analysis.values(name).filter(ts.isStringLiteralLike)
              : [];
            const collectionName = collection
              ? analysis.values(collection).find(ts.isStringLiteralLike)?.text
              : names[0]?.text;
            for (const actionObject of actions
              ? analysis.values(actions)
              : []) {
              if (!ts.isObjectLiteralExpression(actionObject)) continue;
              for (const action of actionObject.properties) {
                const key =
                  action.name &&
                  (ts.isIdentifier(action.name) ||
                    ts.isStringLiteralLike(action.name))
                    ? action.name.text
                    : '';
                if (!REPOSITORY_ACTIONS.has(key)) continue;
                for (const exposureName of names)
                  endpoints.push({
                    path: `${exposureName.text}/${key}`,
                    method: 'POST',
                    providers: ['@nocobase/db'],
                    ...(collectionName
                      ? { collections: [collectionName] }
                      : {}),
                  });
              }
            }
          }
      }
    }
  };
  const root = (node: ts.Node): void => {
    if (visited.has(node)) return;
    visited.add(node);
    for (const value of analysis.values(node)) {
      if (ts.isArrayLiteralExpression(value)) value.elements.forEach(root);
      else if (ts.isFunctionLike(value)) returned(value).forEach(root);
      else if (ts.isCallExpression(value)) {
        if (
          imported(
            value.expression,
            '@nocobase/app-server/router',
            'defineRepositoryApiRoutes',
          )
        )
          repository(value);
        else if (
          imported(
            value.expression,
            '@nocobase/app-server/router',
            'defineApiRoutes',
          )
        )
          value.arguments.forEach(root);
        else {
          const router = identity(value);
          if (router) roots.add(router);
        }
      } else {
        const router = identity(value);
        if (router) roots.add(router);
      }
    }
  };
  for (const statement of entry.statements) {
    if (ts.isExportAssignment(statement)) root(statement.expression);
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.modifiers?.some(
        (item) => item.kind === ts.SyntaxKind.DefaultKeyword,
      )
    )
      root(statement);
  }
  const mounts = new Map<ts.Node, { prefix: string; child: ts.Node }[]>();
  const paths = new Map<ts.Node, EndpointEvidence[]>();
  const bases = new Map<ts.Node, string>();
  const literals = new StaticValues(analysis);
  for (const source of sources) {
    const visit = (node: ts.Node): void => {
      if (ts.isFunctionLike(node) && !source.nodes.has(node)) return;
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const router = identity(node.expression.expression);
        const first = node.arguments[0];
        const resolved = first ? literals.strings(first) : [];
        for (const path of router ? resolved : []) {
          if (!router) continue;
          const method = node.expression.name.text;
          if (method === 'basePath' && resolved.length === 1)
            bases.set(router, path);
          else if (method === 'route' && node.arguments[1]) {
            const child = identity(node.arguments[1]);
            if (child)
              mounts.set(router, [
                ...(mounts.get(router) ?? []),
                { prefix: path, child },
              ]);
          } else if (
            ['get', 'post', 'put', 'patch', 'delete'].includes(method)
          ) {
            paths.set(router, [
              ...(paths.get(router) ?? []),
              {
                path,
                method: method.toUpperCase(),
                providers: providers(
                  source.ast.fileName,
                  node.arguments.slice(1),
                ),
              },
            ]);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source.ast);
  }
  const join = (a: string, b: string): string =>
    '/' + [a, b].join('/').split('/').filter(Boolean).join('/');
  const walk = (router: ts.Node, prefix: string, seen: Set<ts.Node>): void => {
    if (seen.has(router)) return;
    const visited = new Set(seen).add(router);
    const base = join(prefix, bases.get(router) ?? '');
    for (const endpoint of paths.get(router) ?? [])
      endpoints.push({ ...endpoint, path: join(base, endpoint.path) });
    for (const mount of mounts.get(router) ?? [])
      walk(mount.child, join(base, mount.prefix), visited);
  };
  roots.forEach((router) => walk(router, '', new Set()));
  return endpoints;
}
