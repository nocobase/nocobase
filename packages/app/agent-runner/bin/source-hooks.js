// Loaded by bin/run.js, and with `--import` by the runner's worker processes.
//
// Workspace packages such as @nocobase/agent-protocol export their TypeScript sources, which import their siblings by
// the compiled name (`./x.js`). Node strips types but does not map extensions, so a relative `.js` that does not exist
// is retried as `.ts` when the importer is a `.ts` file outside node_modules.
import { registerHooks } from 'node:module';

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
