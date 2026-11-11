import { readFile } from 'node:fs/promises';

/** A conservative prerequisite check, not a substitute for lifecycle acceptance. Never modifies the Host. */
export async function assertHostStopSupport() {
  const deployment = new URL('../dist/package.json', import.meta.url).href;
  const releases = import.meta.resolve(
    '@nocobase/app-plugin-releases/server',
    deployment,
  );
  const host = import.meta.resolve('@nocobase/app-host', releases);
  const reconciler = new URL(
    './management/managed-reconciler' + (host.endsWith('.ts') ? '.ts' : '.js'),
    host,
  );
  const source = await readFile(reconciler, 'utf8');
  assertHostStopSource(source);
}

/** @param {string} source Built Host reconciler source; an unrecognized representation fails closed. */
export function assertHostStopSource(source) {
  const explicitStop = source.slice(
    source.indexOf('stopDeployment(appId'),
    source.indexOf('removeDeployment(', source.indexOf('stopDeployment(appId')),
  );
  const stoppedBranch = source.slice(
    source.indexOf("if (spec.desiredState === 'stopped')"),
  );
  if (
    !/registry\.unregister\(appId,/.test(explicitStop) ||
    !/^if \(spec\.desiredState === 'stopped'\)\s*\{\s*await this\.registry\.unregister\(spec\.appId,/.test(
      stoppedBranch,
    )
  )
    throw new Error(
      'Demo initialization is blocked: this App Host lacks explicit-stop unregister semantics. Use an authorized OSS snapshot containing the merged explicit-stop unregister correction (PR #11418), rebuild the deployment, and validate its lifecycle before initializing instances. No legacy patch is applied.',
    );
}
