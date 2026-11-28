import js from '@eslint/js';
import type { DummyRuleMap } from 'oxlint';
import { additionalTestBlockFunctions } from '../lint/policy.js';

// The pinned parser accepts these forms in scripts, so the preset uses ESLint rules for them.
const compatibilityRules = new Set(['no-dupe-args', 'no-octal']);

export const baseRules: DummyRuleMap = Object.fromEntries(
  Object.entries(js.configs.recommended.rules).filter(
    ([rule]) => !compatibilityRules.has(rule),
  ),
);

// Match the legacy TypeScript preset's overrides of core rules and its syntax-only rules.
export const typescriptRules: DummyRuleMap = {
  'constructor-super': 'off',
  'getter-return': 'off',
  'no-class-assign': 'off',
  'no-const-assign': 'off',
  'no-dupe-class-members': 'off',
  'no-dupe-keys': 'off',
  'no-func-assign': 'off',
  'no-import-assign': 'off',
  'no-new-native-nonconstructor': 'off',
  'no-obj-calls': 'off',
  'no-redeclare': 'off',
  'no-setter-return': 'off',
  'no-this-before-super': 'off',
  'no-unreachable': 'off',
  'no-unsafe-negation': 'off',
  'no-var': 'error',
  'no-with': 'off',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'no-array-constructor': 'error',
  'no-unused-expressions': 'error',
  'no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  'typescript/ban-ts-comment': 'error',
  'typescript/no-duplicate-enum-values': 'error',
  'typescript/no-empty-object-type': 'error',
  'typescript/no-explicit-any': 'error',
  'typescript/no-extra-non-null-assertion': 'error',
  'typescript/no-misused-new': 'error',
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-asserted-optional-chain': 'error',
  'typescript/no-require-imports': 'error',
  'typescript/no-this-alias': 'error',
  'typescript/no-unnecessary-type-constraint': 'error',
  'typescript/no-unsafe-declaration-merging': 'error',
  'typescript/no-unsafe-function-type': 'error',
  'typescript/no-wrapper-object-types': 'error',
  'typescript/prefer-as-const': 'error',
  'typescript/prefer-namespace-keyword': 'error',
  'typescript/triple-slash-reference': 'error',
  'no-undef': 'off',
};

// Enabled rules from typescript-eslint's recommendedTypeChecked preset. Type-aware rules run in tsgolint.
export const typeAwareRules: DummyRuleMap = {
  'typescript/await-thenable': 'error',
  'typescript/no-array-delete': 'error',
  'typescript/no-base-to-string': 'error',
  'typescript/no-duplicate-type-constituents': 'error',
  'typescript/no-floating-promises': 'error',
  'typescript/no-for-in-array': 'error',
  'typescript/no-implied-eval': 'error',
  'typescript/no-misused-promises': 'error',
  'typescript/no-redundant-type-constituents': 'error',
  'typescript/no-unnecessary-type-assertion': 'error',
  'typescript/no-unsafe-argument': 'error',
  'typescript/no-unsafe-assignment': 'error',
  'typescript/no-unsafe-call': 'error',
  'typescript/no-unsafe-enum-comparison': 'error',
  'typescript/no-unsafe-member-access': 'error',
  'typescript/no-unsafe-return': 'error',
  'typescript/no-unsafe-unary-minus': 'error',
  'typescript/only-throw-error': 'error',
  'typescript/prefer-promise-reject-errors': 'error',
  'typescript/restrict-plus-operands': 'error',
  'typescript/restrict-template-expressions': 'error',
  'typescript/unbound-method': 'error',
};

export const untypedRules: DummyRuleMap = Object.fromEntries(
  Object.keys(typeAwareRules).map((rule) => [rule, 'off']),
);

// Oxlint fixes the React Compiler options and has no gating mode. The legacy
// react-hooks/config and react-hooks/gating rules validate those settings.
export const reactRules: DummyRuleMap = {
  'react/rules-of-hooks': 'error',
  'react/exhaustive-deps': 'warn',
  'react/static-components': 'error',
  'react/use-memo': 'error',
  'react/preserve-manual-memoization': 'error',
  'react/incompatible-library': 'warn',
  'react/immutability': 'error',
  'react/globals': 'error',
  'react/refs': 'error',
  'react/set-state-in-effect': 'error',
  'react/error-boundaries': 'error',
  'react/purity': 'error',
  'react/set-state-in-render': 'error',
  'react/unsupported-syntax': 'warn',
  'react/only-export-components': [
    'error',
    {
      allowConstantExport: true,
    },
  ],
};

// Extended database tests and migration callbacks contain valid Vitest assertions.
export const vitestRules: DummyRuleMap = {
  'vitest/expect-expect': 'off',
  'vitest/no-commented-out-tests': 'error',
  'vitest/no-conditional-expect': 'off',
  'vitest/no-disabled-tests': 'warn',
  'vitest/no-focused-tests': 'error',
  'vitest/no-identical-title': 'error',
  'vitest/no-import-node-test': 'error',
  'vitest/no-interpolation-in-snapshots': 'error',
  'vitest/no-mocks-import': 'error',
  'vitest/no-unneeded-async-expect-function': 'error',
  'vitest/prefer-called-exactly-once-with': 'error',
  'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
  'vitest/valid-describe-callback': 'error',
  'vitest/valid-expect': 'error',
  'vitest/valid-expect-in-promise': 'error',
  'vitest/valid-title': 'error',
  'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions }],
};
