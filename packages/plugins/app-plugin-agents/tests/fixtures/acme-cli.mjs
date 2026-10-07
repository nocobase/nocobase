// The application's CLI as a person runs it, from the sources of `@nocobase/app-cli-client`: what
// `tests/cli-parity.test.ts` compares the online shell's `acme` with.
import { registerHooks } from 'node:module';
import process from 'node:process';

// Workspace packages export their TypeScript sources, which import their siblings by the compiled name (`./x.js`).
// Node strips types but does not map extensions, so a relative `.js` that does not exist is retried as `.ts`.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const parent = context.parentURL ?? '';
      if (
        specifier.startsWith('.') &&
        specifier.endsWith('.js') &&
        parent.endsWith('.ts') &&
        !parent.includes('/node_modules/')
      )
        return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
      throw error;
    }
  },
});

const { runAppCli } = await import('@nocobase/app-cli-client');
await runAppCli(
  {
    bin: 'acme',
    displayName: 'Acme',
    stateDir: '.acme',
    homeEnv: 'ACME_HOME',
    keychainEnv: 'ACME_KEYCHAIN',
    runCredentialsFile: '.acme/run.json',
  },
  process.argv.slice(2),
);
