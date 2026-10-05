// Copies the Swagger UI files the API documentation page serves into dist/swagger-ui, so the published package
// carries them while swagger-ui-dist stays a development dependency. The list matches `swaggerUiAssets` in
// src/router/openapi/docs-routes.ts; the license files travel with the bundle they cover.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const source = path.dirname(
  createRequire(import.meta.url).resolve('swagger-ui-dist/package.json'),
);
const target = path.join(packageRoot, 'dist', 'swagger-ui');
const files = [
  'swagger-ui-bundle.js',
  'swagger-ui-bundle.js.LICENSE.txt',
  'swagger-ui.css',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'LICENSE',
  'NOTICE',
];

fs.mkdirSync(target, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(source, file), path.join(target, file));
}
