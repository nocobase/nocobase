/** A host and full repository path, ignoring supported Git transport syntax only. */
export function repositoryIdentity(value: string): string | null {
  try {
    const scp = /^git@([^/:]+):(.+)$/u.exec(value);
    const url = new URL(scp ? `ssh://git@${scp[1]}/${scp[2]}` : value);
    if (
      !['https:', 'ssh:'].includes(url.protocol) ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    if (url.protocol === 'https:' && url.username) return null;
    if (
      url.protocol === 'ssh:' &&
      (url.username !== 'git' || (url.port && url.port !== '22'))
    )
      return null;
    const path = url.pathname.replace(/\/$/u, '').replace(/\.git$/u, '');
    if (!/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(path)) return null;
    if (path.split('/').some((part) => part === '.' || part === '..'))
      return null;
    return `${url.hostname.toLowerCase()}${url.protocol === 'https:' && url.port ? `:${url.port}` : ''}${path.toLowerCase()}`;
  } catch {
    return null;
  }
}

/** Derived from the server's Git API endpoint, never from a user-editable checkout URL. */
export function confirmedRepositoryUrl(
  apiBaseUrl: string,
  fullName: string,
): string | null {
  try {
    const api = new URL(apiBaseUrl);
    if (
      api.protocol !== 'https:' ||
      api.username ||
      api.password ||
      api.search ||
      api.hash
    )
      return null;
    const host =
      api.origin === 'https://api.github.com' ? 'github.com' : api.host;
    if (host !== 'github.com' && !/^\/api\/v3\/?$/u.test(api.pathname))
      return null;
    const repository = `https://${host}/${fullName}.git`;
    return repositoryIdentity(repository) ? repository : null;
  } catch {
    return null;
  }
}
