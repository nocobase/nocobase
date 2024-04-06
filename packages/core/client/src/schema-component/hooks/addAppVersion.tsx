export function addAppVersion(schema: any, appVersion: string) {
  if (!schema) {
    return;
  }

  // 复制的场景中可能已经存在了 x-app-version
  if (!schema['x-app-version']) {
    schema['x-app-version'] = appVersion;
  }

  Object.keys(schema.properties || {}).forEach((key) => {
    addAppVersion(schema.properties?.[key], appVersion);
  });

  return schema;
}
