/**
 * The semantic hues of tags, badges and dots: a pale tint of the hue behind a darker ink of the same hue. In dark mode
 * the tint is a dim translucent wash and the ink a lighter shade, so a pill never glows.
 *
 * The colours are written out as Tailwind arbitrary values rather than theme tokens: a plugin cannot add tokens to the
 * application's stylesheet. Every class is spelled in full so the application's Tailwind build finds it.
 */
export type PmTone =
  'grey' | 'blue' | 'violet' | 'amber' | 'green' | 'slate' | 'red' | 'orange';

/** The tag colours of each hue. */
export const PM_TONE_CLASS: Readonly<Record<PmTone, string>> = {
  grey: 'bg-[oklch(0.955_0.004_264)] text-[oklch(0.46_0.015_264)] dark:bg-[oklch(0.72_0.01_264/0.14)] dark:text-[oklch(0.8_0.01_264)]',
  blue: 'bg-[oklch(0.95_0.035_245)] text-[oklch(0.5_0.15_250)] dark:bg-[oklch(0.65_0.13_250/0.2)] dark:text-[oklch(0.8_0.1_250)]',
  violet:
    'bg-[oklch(0.95_0.035_295)] text-[oklch(0.5_0.17_295)] dark:bg-[oklch(0.65_0.14_295/0.2)] dark:text-[oklch(0.8_0.11_295)]',
  amber:
    'bg-[oklch(0.96_0.05_85)] text-[oklch(0.52_0.12_65)] dark:bg-[oklch(0.75_0.13_75/0.18)] dark:text-[oklch(0.84_0.12_80)]',
  green:
    'bg-[oklch(0.955_0.04_155)] text-[oklch(0.5_0.12_155)] dark:bg-[oklch(0.65_0.12_155/0.2)] dark:text-[oklch(0.8_0.12_155)]',
  slate:
    'bg-[oklch(0.935_0.008_264)] text-[oklch(0.42_0.02_264)] dark:bg-[oklch(0.6_0.02_264/0.2)] dark:text-[oklch(0.72_0.015_264)]',
  red: 'bg-[oklch(0.955_0.03_25)] text-[oklch(0.52_0.18_27)] dark:bg-[oklch(0.62_0.18_25/0.2)] dark:text-[oklch(0.78_0.13_25)]',
  orange:
    'bg-[oklch(0.955_0.045_60)] text-[oklch(0.55_0.15_50)] dark:bg-[oklch(0.7_0.15_55/0.2)] dark:text-[oklch(0.82_0.12_60)]',
};

/** The ink alone, for dots (board column heads, the status distribution). */
export const PM_TONE_DOT_CLASS: Readonly<Record<PmTone, string>> = {
  grey: 'bg-[oklch(0.46_0.015_264)] dark:bg-[oklch(0.8_0.01_264)]',
  blue: 'bg-[oklch(0.5_0.15_250)] dark:bg-[oklch(0.8_0.1_250)]',
  violet: 'bg-[oklch(0.5_0.17_295)] dark:bg-[oklch(0.8_0.11_295)]',
  amber: 'bg-[oklch(0.52_0.12_65)] dark:bg-[oklch(0.84_0.12_80)]',
  green: 'bg-[oklch(0.5_0.12_155)] dark:bg-[oklch(0.8_0.12_155)]',
  slate: 'bg-[oklch(0.42_0.02_264)] dark:bg-[oklch(0.72_0.015_264)]',
  red: 'bg-[oklch(0.52_0.18_27)] dark:bg-[oklch(0.78_0.13_25)]',
  orange: 'bg-[oklch(0.55_0.15_50)] dark:bg-[oklch(0.82_0.12_60)]',
};

/** The identity colour of a kind other than people and the system (its avatar and marker; `lib/kinds.ts`). */
export const PM_OTHER_KIND_CLASS: string =
  'bg-[oklch(0.55_0.2_295/0.15)] text-[oklch(0.55_0.2_295)] dark:bg-[oklch(0.74_0.15_295/0.15)] dark:text-[oklch(0.74_0.15_295)]';
export const PM_OTHER_KIND_TEXT_CLASS: string =
  'text-[oklch(0.55_0.2_295)] dark:text-[oklch(0.74_0.15_295)]';
