export function addAppVersion(schema: any, appVersion: string) {
  if (!schema) {
    return;
  }

  schema.appVersion = appVersion;

  Object.keys(schema.properties || {}).forEach((key) => {
    addAppVersion(schema.properties?.[key], appVersion);
  });

  return schema;
}
