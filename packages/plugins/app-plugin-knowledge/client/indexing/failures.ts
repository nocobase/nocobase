// Only fixed, localized messages reach the UI. Never render a persisted/provider error message.
const messages = new Map<string, string>([
  ['INDEXING_MODEL_AUTH_FAILED', 'modelAuth'],
  ['INDEXING_MODEL_QUOTA_EXCEEDED', 'modelQuota'],
  ['INDEXING_MODEL_RATE_LIMITED', 'modelRateLimit'],
  ['INDEXING_MODEL_CONFIG_INVALID', 'modelConfig'],
  ['INDEXING_MODEL_UNKNOWN', 'modelConfig'],
  ['INDEXING_MODEL_CHANGED', 'configurationChanged'],
  ['INDEXING_MODEL_INPUT_TOO_LONG', 'modelInput'],
  ['INDEXING_MODEL_INPUT_REJECTED', 'modelPolicy'],
  ['INDEXING_MODEL_RESPONSE_INVALID', 'modelResponse'],
  ['INDEXING_MODEL_UNAVAILABLE', 'modelUnavailable'],
  ['INDEXING_STORAGE_AUTH_FAILED', 'storageAuth'],
  ['INDEXING_STORAGE_PERMISSION_DENIED', 'storagePermission'],
  ['INDEXING_STORAGE_SCHEMA_UNAVAILABLE', 'storageSchema'],
  ['INDEXING_STORAGE_UNAVAILABLE', 'storageUnavailable'],
  ['INDEXING_STORAGE_BUSY', 'storageBusy'],
  ['INDEXING_TIMEOUT', 'timeout'],
  ['INDEXING_VECTOR_EXTENSION_MISSING', 'vectorExtension'],
  ['INDEXING_TARGET_OWNERSHIP_CONFLICT', 'ownership'],
  ['INDEXING_INSTANCE_UNKNOWN', 'dependencies'],
  ['INDEXING_TYPE_UNKNOWN', 'dependencies'],
  ['INDEXING_JOBS_UNAVAILABLE', 'dependencies'],
]);

export function indexingFailureKey(reason: string): string {
  const message = messages.get(reason);
  return message ? 'indexing.errors.' + message : 'indexing.workFailed';
}
