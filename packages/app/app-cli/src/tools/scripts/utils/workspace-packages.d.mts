export function findWorkspaceRoot(startDir: string): string | undefined;
export function listWorkspacePackageDirectories(
  workspaceRoot: string,
): string[] | undefined;
export function listWorkspacePackages(rootDir: string): Map<string, string>;
