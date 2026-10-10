// @vitest-environment node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwind from '@tailwindcss/postcss';
import postcss, { type Root } from 'postcss';
import { beforeAll, describe, expect, it } from 'vitest';

import { themePresets } from '../../client/theme/theme-presets';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const sizes = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
];
const shadows = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const colors = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  ...Array.from({ length: 5 }, (_, i) => `chart-${i + 1}`),
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
];
const sharedTokens = [
  'radius',
  'spacing',
  'font-sans',
  'font-serif',
  'font-mono',
  'font-heading',
  ...sizes.flatMap((size) => [`text-${size}`, `text-${size}--line-height`]),
  ...shadows.map((size) => `shadow-${size}`),
];
const radii = {
  sm: 0.6,
  md: 0.8,
  lg: 1,
  xl: 1.4,
  '2xl': 1.8,
  '3xl': 2.2,
  '4xl': 2.6,
};

function declarations(root: Root, selector: string): Record<string, string> {
  const values: Record<string, string> = {};
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      rule.walkDecls((decl) => {
        values[decl.prop] = decl.value;
      });
    }
  });
  return values;
}

describe('theme token contract', () => {
  it('keeps compact identical to default except for dimensions', () => {
    const readPreset = (id: string) =>
      postcss.parse(
        readFileSync(
          new URL(`../../client/theme/themes/${id}.css`, import.meta.url),
          'utf8',
        ),
      );
    const defaultCss = readPreset('default');
    const compactCss = readPreset('compact');
    const withoutDimensions = (values: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(values).filter(
          ([key]) =>
            key !== '--spacing' &&
            key !== '--radius' &&
            !key.startsWith('--text-'),
        ),
      );
    for (const mode of ['', '.dark']) {
      expect(
        withoutDimensions(
          declarations(compactCss, `:root${mode}[data-theme='compact']`),
        ),
      ).toEqual(
        withoutDimensions(
          declarations(defaultCss, `:root${mode}[data-theme='default']`),
        ),
      );
    }
    const compact = declarations(compactCss, ":root[data-theme='compact']");
    const standard = declarations(defaultCss, ":root[data-theme='default']");
    expect(parseFloat(compact['--spacing'])).toBeLessThan(
      parseFloat(standard['--spacing']),
    );
  });

  for (const { id } of themePresets) {
    it(`${id} defines complete tokens for the page and isolated previews`, () => {
      const root = postcss.parse(
        readFileSync(
          new URL(`../../client/theme/themes/${id}.css`, import.meta.url),
          'utf8',
        ),
      );
      const light = declarations(root, `:root[data-theme='${id}']`);
      const dark = declarations(root, `:root.dark[data-theme='${id}']`);
      for (const token of [...colors, ...sharedTokens]) {
        expect(light[`--${token}`], `${id} light: ${token}`).toBeTruthy();
      }
      for (const token of colors) {
        expect(dark[`--${token}`], `${id} dark: ${token}`).toBeTruthy();
      }
      expect(declarations(root, `.theme-preview[data-theme='${id}']`)).toEqual(
        light,
      );
      expect(
        declarations(root, `:root.dark .theme-preview[data-theme='${id}']`),
      ).toEqual(dark);
    });
  }
});

describe('compiled theme utilities', () => {
  let compiled: Root;
  beforeAll(async () => {
    const candidates = [
      ...colors.map((color) => `bg-${color}`),
      ...sizes.map((size) => `text-${size}`),
      ...shadows.map((size) => `shadow-${size}`),
      ...Object.keys(radii).map((size) => `rounded-${size}`),
      'font-sans',
      'font-serif',
      'font-mono',
      'font-heading',
      'p-4',
      'gap-2',
      'h-8',
      'fill-chart-1',
      'stroke-chart-5',
    ];
    const source = readFileSync(
      new URL('../../client/styles.css', import.meta.url),
      'utf8',
    );
    const result = await postcss([
      tailwind({ base: appRoot, optimize: false }),
    ]).process(source + `\n@source inline("${candidates.join(' ')}");`, {
      from: fileURLToPath(new URL('../../client/styles.css', import.meta.url)),
    });
    compiled = result.root;
  }, 30_000);

  it('maps every semantic color to a runtime variable', () => {
    for (const color of colors) {
      expect(declarations(compiled, `.bg-${color}`)['background-color']).toBe(
        `var(--${color})`,
      );
    }
    expect(declarations(compiled, '.fill-chart-1').fill).toBe('var(--chart-1)');
    expect(declarations(compiled, '.stroke-chart-5').stroke).toBe(
      'var(--chart-5)',
    );
  });

  it('keeps fonts, sizes, line heights, spacing and shadows overridable', () => {
    for (const font of ['sans', 'serif', 'mono', 'heading']) {
      expect(declarations(compiled, `.font-${font}`)['font-family']).toBe(
        `var(--font-${font})`,
      );
    }
    for (const size of sizes) {
      const rule = declarations(compiled, `.text-${size}`);
      expect(rule['font-size']).toBe(`var(--text-${size})`);
      expect(rule['line-height']).toContain(`var(--text-${size}--line-height)`);
    }
    for (const [selector, property, multiplier] of [
      ['.p-4', 'padding', '4'],
      ['.gap-2', 'gap', '2'],
      ['.h-8', 'height', '8'],
    ]) {
      expect(declarations(compiled, selector)[property]).toBe(
        `calc(var(--spacing) * ${multiplier})`,
      );
    }
    for (const size of shadows) {
      expect(
        Object.values(declarations(compiled, `.shadow-${size}`)).join(' '),
      ).toContain(`var(--shadow-${size})`);
    }
  });

  it('derives all seven corner sizes from the current preset', () => {
    for (const [size, multiplier] of Object.entries(radii)) {
      const expected =
        multiplier === 1
          ? 'var(--radius)'
          : `calc(var(--radius) * ${multiplier})`;
      expect(declarations(compiled, `.rounded-${size}`)['border-radius']).toBe(
        expected,
      );
    }
  });

  it('connects default text, headings and code to font tokens', () => {
    expect(declarations(compiled, 'body')['font-family']).toBe(
      'var(--font-sans)',
    );
    expect(declarations(compiled, 'body')['font-size']).toBe(
      'var(--text-base)',
    );
    expect(declarations(compiled, 'h1')['font-family']).toBe(
      'var(--font-heading)',
    );
    expect(declarations(compiled, 'code')['font-family']).toBe(
      'var(--font-mono)',
    );
  });
});
