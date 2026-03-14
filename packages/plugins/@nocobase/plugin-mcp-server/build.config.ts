import { defineConfig } from '@nocobase/build';
import fs from 'fs/promises';
import path from 'path';

function getPackageRoot(packageName: string) {
  let resolved = '';
  try {
    resolved = require.resolve(packageName);
  } catch (error) {
    resolved = require.resolve(`${packageName}/package.json`);
  }
  const marker = `${path.sep}node_modules${path.sep}${packageName.split('/').join(path.sep)}${path.sep}`;
  const markerIndex = resolved.lastIndexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Cannot resolve package root for ${packageName} from ${resolved}`);
  }
  return resolved.slice(0, markerIndex + marker.length - 1);
}

async function patchOpenapiMcpGenerator(targetRoot: string, log: (msg: string) => void) {
  const file = path.join(targetRoot, 'dist/parser/extract-tools.js');
  const src = await fs.readFile(file, 'utf8');
  const afterImport = src.replace(
    "import { OpenAPIV3 } from 'openapi-types';",
    "import OpenapiTypes from 'openapi-types';\nconst { OpenAPIV3 } = OpenapiTypes;",
  );
  const afterHttpMethods = afterImport.replace(
    'Object.values(OpenAPIV3.HttpMethods)',
    "Object.values((OpenAPIV3 && OpenAPIV3.HttpMethods) || { GET: 'get', PUT: 'put', POST: 'post', DELETE: 'delete', OPTIONS: 'options', HEAD: 'head', PATCH: 'patch', TRACE: 'trace' })",
  );
  if (afterHttpMethods !== src) {
    await fs.writeFile(file, afterHttpMethods, 'utf8');
    log('patched openapi-mcp-generator extract-tools.js (openapi-types CJS interop)');
  } else {
    log('skip patch openapi-mcp-generator: target text not found');
  }
}

export default defineConfig({
  afterBuild: async (log) => {
    const packagesToCopy = [
      '@modelcontextprotocol/sdk',
      '@hono/node-server',
      'hono',
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
        dereference: false,
        verbatimSymlinks: true,
      });
      if (packageName === 'openapi-mcp-generator') {
        await patchOpenapiMcpGenerator(target, log);
      }
    }
  },
});
