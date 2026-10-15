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
