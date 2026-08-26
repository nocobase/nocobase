export const DEPRECATED_DOC_RULES = [
  {
    id: 'legacy-proxy-command',
    description: 'Legacy proxy command name',
    pattern: /\bnb env proxy\b/g,
  },
  {
    id: 'legacy-proxy-link',
    description: 'Legacy proxy API doc link',
    pattern: /\/api\/cli\/env\/proxy\b/g,
  },
  {
    id: 'legacy-proxy-config-key',
    description: 'Legacy proxy configuration key',
    pattern: /\bproxy\.provider\b/g,
  },
];
