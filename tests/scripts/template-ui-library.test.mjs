import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const libraryRoot = path.join(repoRoot, 'ui-library');
const templates = ['default', 'examples', 'hub'];

// The UI Library items the templates preinstall. The library is the source of truth, so each template carries exactly
// the files `shadcn add` would install today, at their targets; a change to one of these items is carried into every
// template that preinstalls it in the same pull request. `templates` names the templates an item is preinstalled in,
// every template when left out: the inbox needs the in-app notification plugin, which the Hub does not register.
const preinstalled = [
  { group: 'auth', item: 'auth-forms' },
  { group: 'auth', item: 'auth-methods' },
  { group: 'auth', item: 'auth-split-layout' },
  { group: 'auth', item: 'device-approval' },
  { group: 'components', item: 'page-container' },
  { group: 'components', item: 'page-header' },
  { group: 'components', item: 'route-dialog' },
  { group: 'components', item: 'route-drawer' },
  { group: 'components', item: 'route-child-page' },
  { group: 'inbox', item: 'inbox', templates: ['default', 'examples'] },
  { group: 'inbox', item: 'inbox-button', templates: ['default', 'examples'] },
];

function registryItem(group, name) {
  const registry = JSON.parse(
    fs.readFileSync(
      path.join(libraryRoot, 'registry', group, 'registry.json'),
      'utf8',
    ),
  );
  const item = registry.items.find((candidate) => candidate.name === name);
  assert.ok(item, `ui-library/registry/${group} must declare ${name}`);
  return item;
}

for (const kind of templates) {
  const templateRoot = path.join(
    repoRoot,
    'packages/templates',
    `app-template-${kind}`,
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(templateRoot, 'package.json'), 'utf8'),
  );

  for (const { group, item: name, templates: only } of preinstalled) {
    if (only && !only.includes(kind)) {
      test(`${kind} does not preinstall ${name}`, () => {
        for (const file of registryItem(group, name).files)
          assert.ok(
            !fs.existsSync(path.join(templateRoot, file.target)),
            `${kind}: ${file.target} belongs to ${name}, which ${kind} does not preinstall`,
          );
      });
      continue;
    }
    test(`${kind} ships the current ${name} from the UI Library`, () => {
      const item = registryItem(group, name);

      for (const file of item.files) {
        const installed = path.join(templateRoot, file.target);
        assert.ok(
          fs.existsSync(installed),
          `${kind}: ${name} installs ${file.target}`,
        );
        assert.equal(
          fs.readFileSync(installed, 'utf8'),
          fs.readFileSync(
            path.join(libraryRoot, 'registry', group, file.path),
            'utf8',
          ),
          `${kind}: refresh ${file.target} from ui-library/registry/${group}/${file.path}`,
        );
      }

      // A block owns its directory, so that directory holds the item's files and nothing else. A file the item does
      // not install, such as an old copy of its README, would otherwise ship in every generated application unchecked.
      if (item.type === 'registry:block') {
        const blockDirectory = `client/extensions/nocobase-${name}`;
        const present = fs
          .readdirSync(path.join(templateRoot, blockDirectory), {
            recursive: true,
            withFileTypes: true,
          })
          .filter((entry) => entry.isFile())
          .map((entry) =>
            path
              .relative(templateRoot, path.join(entry.parentPath, entry.name))
              .split(path.sep)
              .join('/'),
          )
          .sort();
        assert.deepEqual(
          present,
          item.files.map((file) => file.target).sort(),
          `${kind}: ${blockDirectory}/ holds exactly the files ${name} installs`,
        );
      }

      for (const dependency of item.registryDependencies ?? []) {
        // `utils` is shadcn's `#lib/utils`, which re-exports `cn`; every other registry dependency is a shadcn primitive.
        if (dependency === 'utils') {
          assert.match(
            fs.readFileSync(
              path.join(templateRoot, 'client/lib/utils.ts'),
              'utf8',
            ),
            /export \{ cn \} from 'cn'/u,
            `${kind}: ${name} needs cn from client/lib/utils.ts`,
          );
          continue;
        }
        // `@nocobase/<item>` is another item of this library, which the template must preinstall too.
        if (dependency.startsWith('@nocobase/')) {
          const other = dependency.slice('@nocobase/'.length);
          assert.ok(
            preinstalled.some(
              (entry) =>
                entry.item === other &&
                (!entry.templates || entry.templates.includes(kind)),
            ),
            `${kind}: ${name} needs ${dependency}, which ${kind} must preinstall`,
          );
          continue;
        }
        assert.ok(
          fs.existsSync(
            path.join(templateRoot, `client/components/ui/${dependency}.tsx`),
          ),
          `${kind}: ${name} needs the ${dependency} primitive`,
        );
      }
      for (const specifier of item.dependencies ?? []) {
        const dependency = specifier.slice(0, specifier.lastIndexOf('@'));
        assert.ok(
          manifest.dependencies?.[dependency] ??
            manifest.devDependencies?.[dependency],
          `${kind}: ${name} imports ${dependency}, which package.json must declare`,
        );
      }
    });
  }
}
