import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteComponentLoader,
} from '@nocobase/app-client/plugins';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import applicationRoutes from '../../client/routes.ts';
import { PAGES } from '../../shared/pages.ts';

// The reference-page scan below reads application source from disk, so its root comes from this file's own URL — taken
// apart rather than written as `new URL('..', import.meta.url)`, the idiom the other tests use, because Vite rewrites
// that pattern into an asset URL in the jsdom environment this file shares with the page tests.
const applicationRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const clientRoot = path.join(applicationRoot, 'client');
const referenceRoot = path.join(clientRoot, 'pages', 'reference');

describe('app client routes', () => {
  it('keeps the landing page and the authentication pages', () => {
    // The authentication plugin and this application have to agree on these paths: it sends an unknown visitor to
    // /login, sends a signed-in user who opens a guest page back to /, and mails a reset link to /reset-password,
    // while the sign-in form links to /register and /forgot-password. Only their presence is asserted, so a page the
    // application adds is not a defect. Whether these four are guest pages is not checked here either: app-client
    // refuses any route that claims one of those paths without `auth: 'guest'`.
    expect(pagePaths(resolveRoutes().routes)).toEqual(
      expect.arrayContaining([
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        // The page `deviceAuthorization()`'s verificationUri names, where a CLI's sign-in is approved.
        '/device',
      ]),
    );
  });

  it('loads every page component', async () => {
    const resolved = resolveRoutes();
    // Studio declares no back-office settings pages: `/settings` is not mounted (`client/routing/app-router.tsx`).
    const loaders = componentLoadersIn(resolved.routes);
    // The trees above are filtered by loader, so an empty list would make the loop below pass without loading
    // anything at all.
    expect(loaders).not.toHaveLength(0);

    for (const componentLoader of loaders) {
      // The registered loader is already the wrapped one, so awaiting it holds every page to the contract that its
      // module default-exports a component. A page that moved or lost its default export fails here.
      await expect(componentLoader()).resolves.toMatchObject({
        default: expect.any(Function),
      });
    }
    // Importing every page takes longer than the default 5 s when the whole suite runs at once.
  }, 60_000);

  it('never imports or routes a reference page', () => {
    // The reference pages are worked source to read while building a page, not screens this application serves. A
    // route reaches one through an `import()` its page loader names, so scanning specifiers catches the route as well
    // as the plain import. Reaching into the directory at all fails: a shadcn gallery inside somebody's product is
    // the defect this pins.
    const offenders: string[] = [];
    for (const file of clientSourceFiles()) {
      for (const specifier of moduleSpecifiersIn(file)) {
        const referencePage = specifierPathsIn(specifier, file).find(
          isReferencePage,
        );
        if (referencePage) {
          offenders.push(
            `${path.relative(applicationRoot, file)} names "${specifier}", which resolves to ` +
              `${path.relative(applicationRoot, referencePage)}`,
          );
        }
      }
    }

    expect(
      offenders,
      'Application source reaches into client/pages/reference/, which is not part of the running application.',
    ).toEqual([]);
  });

  it('orders the sidebar with Home and Dashboard first, then My issues, the Development, Releases and Agent team sections, and Settings', () => {
    // The inbox is not among them: it is the header's button (`client/inbox/header-button.tsx`).
    const menu = (routes: readonly AppClientRegisteredRoute[]) =>
      routes.flatMap((route) =>
        route.navigation ? [route.navigation.title] : [],
      );
    const { routes } = resolveRoutes();
    expect(menu(routes)).toEqual([
      'navigation.home',
      'navigation.dashboard',
      'navigation.myIssues',
      'navigation.development',
      'navigation.releases',
      'navigation.agentTeam',
      'navigation.config',
    ]);
    const section = (name: string) =>
      menu(routes.find((route) => route.name === name)?.children ?? []);
    expect(section('development')).toEqual([
      'navigation.issues',
      'navigation.projects',
      'navigation.knowledge',
    ]);
    expect(section('releases')).toEqual([
      'navigation.releaseApps',
      'navigation.environments',
    ]);
    expect(section('agent-team')).toEqual([
      'navigation.agents',
      'navigation.runtimes',
      'navigation.skills',
      'navigation.models',
      'navigation.usage',
    ]);
  });

  it('pins the route names page grants are stored against', () => {
    // A route's `name` is the identifier a stored page grant records. Renaming one is a data change that has to
    // migrate the grants that name it, not a refactor — so changing this list deliberately is the point. A new page
    // that requires sign-in adds an entry here, because that is a new grant somebody has to be given.
    const resolved = resolveRoutes();

    // The landing page opted out of page authorization, so it is reachable by every signed-in user; so are the
    // account settings, which only edit the viewer's own account, the inbox, which lists only the viewer's own items, and
    // `/config`, whose tabs each stand behind their settings item. The projects plugin's work pages and the agents
    // plugin's Agent team pages stand behind their own page grants, named like the routes; what an agent page shows
    // is still decided by the agents plugin's settings items, on its API.
    const all = pageAuthorizations(resolved.routes);
    const team = resolved.routes.find((route) => route.name === 'agent-team');
    const teamPages = pageAuthorizations(team?.children ?? []);
    const teamNames = new Set(teamPages.map((page) => page.name));
    expect(
      teamPages.filter((page) =>
        ['agents', 'runtimes', 'skills', 'models', 'usage'].includes(page.name),
      ),
    ).toEqual([
      { name: 'agents', authorizedAs: 'agents' },
      { name: 'runtimes', authorizedAs: 'runtimes' },
      { name: 'skills', authorizedAs: 'skills' },
      // The models stand behind the agents plugin's model services settings item.
      { name: 'models', authorizedAs: 'settings:agents.services' },
      { name: 'usage', authorizedAs: 'usage' },
    ]);
    // Each agent team page's own routes (its dialogs and detail pages) stand behind what the page does.
    for (const root of team?.children ?? []) {
      const own = pageAuthorizations([root]);
      expect(new Set(own.map((page) => page.authorizedAs)).size).toBe(1);
    }
    expect(all.filter((page) => !teamNames.has(page.name))).toEqual([
      { name: 'home', authorizedAs: null },
      // One conversation full screen: a conversation is its owner's alone, which its API checks.
      { name: 'chat', authorizedAs: null },
      // The person's own settings; every category's API checks what it serves.
      { name: 'account', authorizedAs: null },
      { name: 'account-category', authorizedAs: null },
      // The viewer's own inbox, opened from the header rather than the menu.
      { name: 'inbox', authorizedAs: null },
      // Legacy `/pm` links: redirects that open the agents' chat panel, which checks what it opens.
      { name: 'chat-pm', authorizedAs: null },
      { name: 'chat-pm-conversation', authorizedAs: null },
      // The dashboard, behind the reports grant its figures' API checks too.
      { name: 'dashboard', authorizedAs: 'reports' },
      { name: 'pm-my-issues', authorizedAs: 'pm-my-issues' },
      { name: 'pm-my-issues-owned', authorizedAs: 'pm-my-issues' },
      // An issue opened from a list is declared under it, behind the list's grant (`issueDetailRoute`).
      { name: 'pm-my-issues-owned-issue-detail', authorizedAs: 'pm-my-issues' },
      { name: 'pm-my-issues-owned-subtask-new', authorizedAs: 'pm-my-issues' },
      { name: 'pm-my-issues-owned-issue-plan', authorizedAs: 'pm-my-issues' },
      { name: 'pm-my-issues-owned-issue-run', authorizedAs: 'pm-my-issues' },
      { name: 'pm-my-issues-executing', authorizedAs: 'pm-my-issues' },
      {
        name: 'pm-my-issues-executing-issue-detail',
        authorizedAs: 'pm-my-issues',
      },
      {
        name: 'pm-my-issues-executing-subtask-new',
        authorizedAs: 'pm-my-issues',
      },
      {
        name: 'pm-my-issues-executing-issue-plan',
        authorizedAs: 'pm-my-issues',
      },
      {
        name: 'pm-my-issues-executing-issue-run',
        authorizedAs: 'pm-my-issues',
      },
      { name: 'pm-issues', authorizedAs: 'pm-issues' },
      { name: 'pm-issue-new', authorizedAs: 'pm-issues' },
      { name: 'pm-plan', authorizedAs: 'pm-issues' },
      { name: 'pm-issue-detail', authorizedAs: 'pm-issues' },
      { name: 'pm-subtask-new', authorizedAs: 'pm-issues' },
      { name: 'pm-issue-plan', authorizedAs: 'pm-issues' },
      { name: 'pm-issue-run', authorizedAs: 'pm-issues' },
      { name: 'pm-projects', authorizedAs: 'pm-projects' },
      { name: 'studio-project-new', authorizedAs: 'pm-projects' },
      { name: 'pm-project-detail', authorizedAs: 'pm-projects' },
      // A project's tabs, the page's child routes, each hosting the "New issue" dialog.
      { name: 'pm-project-overview', authorizedAs: 'pm-projects' },
      { name: 'pm-project-overview-new-issue', authorizedAs: 'pm-projects' },
      { name: 'pm-project-issues', authorizedAs: 'pm-projects' },
      { name: 'pm-project-issues-new-issue', authorizedAs: 'pm-projects' },
      { name: 'pm-project-issues-issue-detail', authorizedAs: 'pm-projects' },
      { name: 'pm-project-issues-subtask-new', authorizedAs: 'pm-projects' },
      { name: 'pm-project-issues-issue-plan', authorizedAs: 'pm-projects' },
      { name: 'pm-project-issues-issue-run', authorizedAs: 'pm-projects' },
      { name: 'pm-project-knowledge', authorizedAs: 'pm-projects' },
      { name: 'pm-project-knowledge-new-issue', authorizedAs: 'pm-projects' },
      { name: 'pm-project-members', authorizedAs: 'pm-projects' },
      { name: 'pm-project-members-new-issue', authorizedAs: 'pm-projects' },
      { name: 'pm-project-releases', authorizedAs: 'pm-projects' },
      { name: 'pm-project-releases-new-issue', authorizedAs: 'pm-projects' },
      { name: 'pm-project-settings', authorizedAs: 'pm-projects' },
      { name: 'pm-project-settings-new-issue', authorizedAs: 'pm-projects' },
      // The system's knowledge, behind its own page grant.
      { name: 'knowledge', authorizedAs: 'knowledge' },
      // Release management's pages: Apps and their detail behind `rel-apps`, the environments behind the plugin's
      // settings item.
      { name: 'rel-apps', authorizedAs: 'rel-apps' },
      { name: 'rel-app-new', authorizedAs: 'rel-apps' },
      { name: 'rel-request', authorizedAs: 'rel-apps' },
      { name: 'rel-app', authorizedAs: 'rel-apps' },
      { name: 'rel-app-request', authorizedAs: 'rel-apps' },
      { name: 'rel-environments', authorizedAs: 'settings:rel.environments' },
      { name: 'rel-environment', authorizedAs: 'settings:rel.environments' },
      { name: 'config', authorizedAs: null },
      { name: 'config-general', authorizedAs: 'settings:pm.general' },
      { name: 'config-members', authorizedAs: 'settings:pm.members' },
      { name: 'config-member-reset-password', authorizedAs: null },
      { name: 'config-roles', authorizedAs: 'settings:pm.members' },
      { name: 'config-role', authorizedAs: 'settings:pm.members' },
      { name: 'config-api-keys', authorizedAs: 'settings:studio.apiKeys' },
      {
        name: 'config-knowledge-search',
        authorizedAs: 'settings:studio.knowledgeSearch',
      },
      { name: 'config-git', authorizedAs: 'settings:studio.git' },
      { name: 'config-workflows', authorizedAs: 'settings:pm.workflows' },
      { name: 'config-workflow', authorizedAs: 'settings:pm.workflows' },
      { name: 'config-labels', authorizedAs: 'settings:pm.labels' },
    ]);
  });

  it('offers a role exactly the pages the routes authorize', () => {
    // A page grant no route reads would be a checkbox that does nothing, and a route behind a page the role editor
    // does not list could never be opened by anyone but a system administrator.
    const granted = new Set(
      pageAuthorizations(resolveRoutes().routes)
        .map((page) => page.authorizedAs)
        .filter(
          (id): id is string =>
            id !== null && id !== 'unrestricted' && !id.includes(':'),
        ),
    );
    expect([...granted].sort()).toEqual([...PAGES].sort());
  });
});

/** This application's own contribution, registered the way the client runtime registers it. */
function resolveRoutes() {
  return resolveAppClientContributions([
    {
      packageName: '@nocobase/app-template-default',
      routes: applicationRoutes,
      source: 'application',
    },
  ]);
}

/**
 * The paths of the pages a route tree registers. A menu group names no component, so it carries no path of its own
 * and inherits its parent's — filtering on `componentLoader` is what keeps that inherited path out of the list.
 */
function pagePaths(routes: readonly AppClientRegisteredRoute[]): string[] {
  return routes.flatMap((route) => [
    ...(route.componentLoader ? [route.path] : []),
    ...pagePaths(route.children ?? []),
  ]);
}

/** Every page loader in a tree, at any depth. */
function componentLoadersIn(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRouteComponentLoader[] {
  return routes.flatMap((route) => [
    ...(route.componentLoader ? [route.componentLoader] : []),
    ...componentLoadersIn(route.children ?? []),
  ]);
}

/** Every client source file outside `client/pages/reference/`, where the reference pages legitimately name each other. */
function clientSourceFiles(): string[] {
  return readdirSync(clientRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /[.]tsx?$/u.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => !isReferencePage(file))
    .sort();
}

/**
 * Every module specifier a client source file names, however it reaches one: a static or side-effect import, a
 * re-export, a dynamic `import()`, or an `import.meta.glob()` pattern. TypeScript reads the file rather than a regular
 * expression because a specifier inside a comment or an ordinary string is not a dependency, and this check must not
 * fail on prose about one.
 */
function moduleSpecifiersIn(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    false,
  );
  const specifiers: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node)) {
      const [first] = node.arguments;
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        specifiers.push(...literalSpecifiers(first));
      } else if (isImportMetaGlob(node.expression)) {
        specifiers.push(...literalSpecifiers(first));
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);

  return specifiers;
}

function isImportMetaGlob(expression: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    expression.name.text === 'glob' &&
    ts.isMetaProperty(expression.expression) &&
    expression.expression.keywordToken === ts.SyntaxKind.ImportKeyword
  );
}

/** A glob takes one pattern or a list of them. Whatever cannot be read statically names no path this check can judge. */
function literalSpecifiers(argument: ts.Expression | undefined): string[] {
  if (!argument) {
    return [];
  }
  if (ts.isArrayLiteralExpression(argument)) {
    return argument.elements.flatMap((element) => literalSpecifiers(element));
  }
  if (ts.isStringLiteralLike(argument)) {
    return [argument.text];
  }
  // A template literal knows its own head: what it interpolates is a runtime choice, but the directory it starts in
  // is already written down.
  if (ts.isTemplateExpression(argument)) {
    return [argument.head.text];
  }
  return [];
}

/**
 * The absolute paths a specifier could name. A bare package specifier resolves into node_modules and names no
 * application source, so it has none.
 */
function specifierPathsIn(specifier: string, fromFile: string): string[] {
  if (specifier.startsWith('.')) {
    return [path.resolve(path.dirname(fromFile), specifier)];
  }
  // `@/` is the client alias in vite.config.ts.
  if (specifier.startsWith('@/')) {
    return [path.join(clientRoot, specifier.slice('@/'.length))];
  }
  if (specifier.startsWith('/')) {
    // Vite resolves a leading `/` from the client root, which is this application's Vite root, while a reader is at
    // least as likely to mean the application root. Both readings name a real file, so both are checked.
    return [
      path.join(clientRoot, specifier),
      path.join(applicationRoot, specifier),
    ];
  }
  return [];
}

/** Whether a path is `client/pages/reference/` itself or something under it. */
function isReferencePage(candidate: string): boolean {
  const relative = path.relative(referenceRoot, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

/** Page authorization comes directly from the registered tree. */
function pageAuthorizations(
  routes: readonly AppClientRegisteredRoute[],
): { name: string; authorizedAs: string | null }[] {
  return routes.flatMap((route) => [
    ...(route.componentLoader && route.auth === 'required'
      ? [
          {
            name: route.name,
            authorizedAs:
              route.authz === 'skip'
                ? null
                : route.authz === 'unrestricted'
                  ? 'unrestricted'
                  : route.authz.resource.type === 'page'
                    ? route.authz.resource.id
                    : `${route.authz.resource.type}:${route.authz.resource.id}`,
          },
        ]
      : []),
    ...pageAuthorizations(route.children ?? []),
  ]);
}
