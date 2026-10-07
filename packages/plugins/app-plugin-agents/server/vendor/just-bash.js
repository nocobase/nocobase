// The part of `just-bash` an online run's shell uses (`../online/sandbox.ts`, `../online/cli-command.ts`), typed by
// `just-bash.d.ts`. From source this re-exports the development dependency; `pnpm build` replaces its output with a
// bundle of this file (`scripts/bundle-just-bash.mjs`), so a published plugin does not depend on `just-bash`.
export { Bash, defineCommand, getCommandNames, InMemoryFs } from 'just-bash';
