import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

function getPackageRoot(packageName: string) {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

export default defineConfig({
  afterBuild: async (log) => {
    const packagesToCopy = [
      '@modelcontextprotocol/sdk',
      'openapi-mcp-generator',
      '@apidevtools/swagger-parser',
      '@apidevtools/json-schema-ref-parser',
      '@apidevtools/openapi-schemas',
      '@apidevtools/swagger-methods',
      '@jsdevtools/ono',
      'call-me-maybe',
    ];
    for (const packageName of packagesToCopy) {
      const source = getPackageRoot(packageName);
      const target = path.resolve(__dirname, 'dist/node_modules', packageName);
      log(`copying ${packageName} to dist/node_modules`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.cp(source, target, {
        recursive: true,
        force: true,
      });
    }
  },
});
