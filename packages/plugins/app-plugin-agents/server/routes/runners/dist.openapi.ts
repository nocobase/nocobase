import {
  apiErrorResponse,
  apiErrorResponses,
  dataResponse,
  cliRoute,
  resolver,
  type DescribeRouteOptions,
} from '@nocobase/app-server/router';
import {
  DistManifestSchema,
  DistResolutionSchema,
} from '@nocobase/agent-protocol';
import { z } from 'zod';
import { DownloadTokenSchema } from '../schemas.js';
import { tags, downloadSecurity } from '../openapi.js';
const credentials =
  'A runner (its key), the install script (an unused registration token, or a download token for its platform) or a signed-in person may download.';
const downloadErrors = {
  401: apiErrorResponse(
    401,
    'No runner key, registration token, download token or signed-in person, or one that is not valid (`UNAUTHORIZED`, `REGISTRATION_TOKEN_INVALID`, `DOWNLOAD_TOKEN_INVALID`, `RUNNER_KEY_INVALID`).',
  ),
  500: apiErrorResponse(500),
};
export const distributionOpenapi: Record<
  'mint' | 'manifest' | 'resolve' | 'file',
  DescribeRouteOptions
> = {
  mint: {
    tags,
    summary: 'Create a CLI download token',
    operationId: 'agentsCreateDistDownloadToken',
    // Minted by the page that shows the install prompt; a signed-in CLI has no use for one.
    ...cliRoute(false),
    description:
      'A short-lived token the install script downloads the application CLI with (`curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <token>`) on a machine where nobody is signed in yet; it is shown only in this answer. It downloads only the CLI, for the platform of its first request, a few times within 30 minutes, and registers no runner. Any signed-in person may create one: it reaches nothing they could not download themselves. Scoped API keys are refused (`SCOPED_KEY_FORBIDDEN`).',
    responses: {
      201: dataResponse(DownloadTokenSchema, 'Created.'),
      ...apiErrorResponses,
    },
  },
  manifest: {
    tags,
    summary: 'Get the distribution manifest',
    operationId: 'agentsGetDistManifest',
    // Plumbing: the runner, its install script and `acme` itself download from here.
    ...cliRoute(false),
    description: `Every version of the runner and the CLI the application serves, per platform. ${credentials}`,
    security: downloadSecurity,
    responses: {
      200: dataResponse(DistManifestSchema),
      ...downloadErrors,
    },
  },
  resolve: {
    tags,
    summary: "Resolve a product's current artifact for a platform",
    operationId: 'agentsResolveDistArtifact',
    // Plumbing: the runner, its install script and `acme` itself download from here.
    ...cliRoute(false),
    description: `The current version of \`product\` (the application's CLI, which carries the runner, or \`nocobase-runner\`) for \`target\` (such as \`darwin-arm64\` or \`linux-x64\`), with its download path and SHA-256: the tarball built for that platform, else the universal one (\`universal: true\`), which carries no Node and needs Node.js 24 or newer on the machine. \`format=env\` answers the same as \`key=value\` lines a POSIX shell reads, as the install script does. With \`accept=npm\`, a product the application has no tarball of but names on npm (\`agents.dist.npm\`) is answered as \`{ kind: 'npm', product, version, package, channel }\`, the package and exact version to install with Node.js 24 or later, for every platform; without it such a product is 404 as before. A product with a tarball is answered the same either way. Never cached. ${credentials}`,
    security: downloadSecurity,
    responses: {
      200: {
        description:
          "The artifact: `{ data }` in JSON, or with `format=env` the lines `product=`, `version=`, `target=`, `url=`, `sha256=`, `size=` and `channel=` as `text/plain`, and `universal=true` when the platform gets the universal tarball, which needs Node.js 24 or newer on the machine. An npm answer (only with `accept=npm`) is `{ data: { kind: 'npm', ... } }`, or the lines `kind=npm`, `product=`, `version=`, `package=` and `channel=`.",
        content: {
          'application/json': {
            schema: resolver(z.object({ data: DistResolutionSchema })),
          },
          'text/plain': {
            schema: {
              type: 'string',
              description: 'One `key=value` line per field.',
            },
          },
        },
      },
      404: apiErrorResponse(
        404,
        'The product is not served, or not for this platform (`PRODUCT_NOT_FOUND`, `PLATFORM_UNSUPPORTED`).',
      ),
      ...downloadErrors,
    },
  },
  file: {
    tags,
    summary: 'Download a distribution file',
    operationId: 'agentsDownloadDistFile',
    // Plumbing: the runner, its install script and `acme` itself download from here.
    ...cliRoute(false),
    description: `A tarball the manifest lists, as \`application/gzip\`, with its SHA-256 in \`x-checksum-sha256\`. Immutable, so it may be cached. ${credentials}`,
    security: downloadSecurity,
    responses: {
      200: {
        description: 'The file.',
        headers: {
          'x-checksum-sha256': {
            description: "The file's SHA-256, in hex.",
            schema: { type: 'string' },
          },
        },
        content: {
          'application/gzip': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: apiErrorResponse(
        404,
        'The manifest lists no such file (`DIST_FILE_NOT_FOUND`).',
      ),
      ...downloadErrors,
    },
  },
};
