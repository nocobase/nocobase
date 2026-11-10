/** Whether a package follows the scoped application plugin or module convention. */
export function isPluginPackageName(packageName: string): boolean {
  return /^@[a-z0-9][a-z0-9-]*\/app-(?:plugin|module|portal)-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(
    packageName,
  );
}
