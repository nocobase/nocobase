// Development resolves the pinned package. The build replaces this entry with the lightweight bundle.
// Keep runtime exports aligned with just-bash.d.ts and scripts/bundle-just-bash.mjs.
export {
  Bash,
  createCommandContext,
  defineCommand,
  getCommandNames,
  InMemoryFs,
} from 'just-bash';
