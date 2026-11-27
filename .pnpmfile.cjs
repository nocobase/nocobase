const { existsSync } = require('node:fs');
const path = require('node:path');

// Optional peers declared by workspace projects are auto-installed by pnpm.
// Omit only commercial peers from OSS development resolution; package.json and
// published manifests retain their compatibility contracts. Pro uses its own workspace root.
const commercialDrivers = [
  '@nocobase/db-kingbase',
  '@nocobase/db-dameng',
  '@nocobase/db-oceanbase',
];

module.exports = {
  hooks: {
    // pnpm prunes importers for absent workspace directories during non-frozen installs, including on release
    // branches. Preserve the optional app's locked resolutions even in a checkout that never generated it.
    afterAllResolved(lockfile) {
      const template = 'packages/templates/app-template-default';
      const local = 'local/default';
      const original = lockfile.importers[template];
      if (!original || existsSync(path.join(__dirname, local, 'package.json')))
        return lockfile;
      const mirror = { ...original };
      for (const section of [
        'dependencies',
        'devDependencies',
        'optionalDependencies',
      ]) {
        mirror[section] = {};
        for (const [name, version] of Object.entries(original[section] ?? {})) {
          mirror[section][name] = version.startsWith('link:')
            ? 'link:' +
              path.posix.relative(
                local,
                path.posix.join(template, version.slice(5)),
              )
            : version;
        }
      }
      const sqlite = '@nocobase/db-sqlite';
      if (mirror.devDependencies[sqlite]) {
        mirror.dependencies[sqlite] = mirror.devDependencies[sqlite];
        delete mirror.devDependencies[sqlite];
      }
      lockfile.importers[local] = mirror;
      return lockfile;
    },
    readPackage(pkg) {
      if (
        ![
          '@nocobase/app-server',
          '@nocobase/db-testing',
          '@nocobase/app-testing',
        ].includes(pkg.name)
      )
        return pkg;
      for (const name of commercialDrivers) {
        if (pkg.peerDependenciesMeta?.[name]?.optional) {
          delete pkg.peerDependencies?.[name];
          delete pkg.peerDependenciesMeta[name];
        }
      }
      return pkg;
    },
  },
};
