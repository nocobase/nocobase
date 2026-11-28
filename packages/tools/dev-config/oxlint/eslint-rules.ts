// Reuse the pinned ESLint core implementations that have no native equivalent
// with the same options and diagnostics. Oxlint runs these on its own AST.
import type { ESLint, Rule } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';

const rules: Record<string, Rule.RuleModule> = {};
for (const name of [
  'jsx-quotes',
  'no-dupe-args',
  'no-octal',
  'quotes',
  'no-restricted-imports',
  'no-restricted-syntax',
]) {
  const rule = builtinRules.get(name);
  if (!rule) throw new Error(`Missing ESLint compatibility rule: ${name}`);
  rules[name] = rule;
}

const plugin: ESLint.Plugin = { rules };
export default plugin;
