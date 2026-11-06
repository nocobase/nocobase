/** Expire the old, unpartitioned counterpart of each partitioned authentication cookie before setting its replacement. */
export function migratePartitionedCookies(
  cookies: readonly string[],
): string[] {
  return cookies.flatMap((cookie) => {
    const [pair = '', ...attributes] = cookie
      .split(';')
      .map((part) => part.trim());
    if (!attributes.some((attribute) => /^partitioned$/iu.test(attribute)))
      return [cookie];
    const separator = pair.indexOf('=');
    if (separator < 1) return [cookie];

    // Partitioned cookies do not overwrite ordinary cookies with the same name. Both otherwise reach a direct visit,
    // where Authentication may read the stale ordinary value first. Derive the scope from Authentication's response,
    // including custom names, Domain and Path; never delete arbitrary cookies supplied by the request.
    const legacy = [
      `${pair.slice(0, separator)}=`,
      ...attributes.filter(
        (attribute) =>
          !/^(?:partitioned$|max-age\s*=|expires\s*=)/iu.test(attribute),
      ),
      'Max-Age=0',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ].join('; ');
    return [legacy, cookie];
  });
}
