// The part of `ini` (which ships no types) the npm launcher uses: npm and pnpm read npmrc files with it.
declare module 'ini' {
  /** The settings of `text`: a string, `true` for a key without `=`, an array for `key[]`, an object for a section. */
  export function parse(text: string): Record<string, unknown>;
}
