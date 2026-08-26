import path from 'node:path';

export function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function splitPathAction(pathTemplate: string) {
  const normalizedPath = pathTemplate.replace(/^\/+/, '');
  const separatorIndex = normalizedPath.lastIndexOf(':');

  if (separatorIndex === -1) {
    return {
      resourcePath: normalizedPath,
      action: 'call',
    };
  }

  return {
    resourcePath: normalizedPath.slice(0, separatorIndex),
    action: normalizedPath.slice(separatorIndex + 1),
  };
}

export function toLogicalResourceName(pathTemplate: string) {
  const {resourcePath} = splitPathAction(pathTemplate);
  return resourcePath
    .split('/')
    .filter(Boolean)
    .filter((segment) => !segment.startsWith('{'))
    .map((segment) => toKebabCase(segment))
    .join('.');
}

export function toLogicalActionName(pathTemplate: string) {
  return toKebabCase(splitPathAction(pathTemplate).action);
}

export function toResourceSegments(pathTemplate: string, options?: {includeParams?: boolean}) {
  const {resourcePath, action} = splitPathAction(pathTemplate);
  const pathSegments = resourcePath
    .split('/')
    .filter(Boolean)
    .flatMap((segment) => {
      if (!segment.startsWith('{')) {
        return [toKebabCase(segment)];
      }

      if (!options?.includeParams) {
        return [];
      }

      return [`by-${toKebabCase(segment.slice(1, -1))}`];
    });

  return [...pathSegments, toKebabCase(action)].filter(Boolean);
}

export function toCommandSegments(moduleName: string, pathTemplate: string, options?: {includeParams?: boolean; omitModule?: boolean}) {
  const resourceSegments = toResourceSegments(pathTemplate, options);
  const segments = [options?.omitModule ? '' : toKebabCase(moduleName), ...resourceSegments].filter(Boolean);

  return segments.length ? segments : [toKebabCase(moduleName), 'call'];
}

export function toClassName(segments: string[]) {
  return segments
    .map((segment) => segment.replace(/(^\w|-\w)/g, (token) => token.replace('-', '').toUpperCase()))
    .join('');
}

export function toOutputFile(outputRoot: string, segments: string[]) {
  const folder = path.join(outputRoot, ...segments.slice(0, -1));
  const filePath = path.join(folder, `${segments.at(-1)}.ts`);
  return filePath;
}

export function toImportPath(fromFile: string, targetFile: string) {
  const relative = path.relative(path.dirname(fromFile), targetFile).replace(/\\/g, '/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}
