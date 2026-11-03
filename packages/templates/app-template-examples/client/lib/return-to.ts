/** Accept only an application-relative destination, resolved by the app router's basename. */
export function safeReturnTo(value: string | null): string | undefined {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    [...value].some(
      (character) =>
        character === '\\' ||
        character.charCodeAt(0) <= 32 ||
        character.charCodeAt(0) === 127,
    )
  )
    return;
  const base = 'https://app.invalid';
  const url = new URL(value, base);
  if (url.origin !== base || url.pathname.startsWith('//')) return;
  return `${url.pathname}${url.search}${url.hash}`;
}
