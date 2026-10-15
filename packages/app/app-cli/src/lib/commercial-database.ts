/** User-facing licensing and installation notice for commercial database drivers. */
export function commercialDatabaseNotice(dialect: string): string | undefined {
  if (!['dameng', 'kingbase', 'oceanbase'].includes(dialect)) return undefined;
  return `@nocobase/db-${dialect} is a NocoBase Pro commercial package. Use requires the appropriate commercial license and access to the private package registry. Configure authenticated access to that registry before installing the driver.`;
}
