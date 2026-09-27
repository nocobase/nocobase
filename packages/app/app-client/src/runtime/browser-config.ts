const RUNTIME_CONFIG_ELEMENT_ID = 'nocobase-runtime-config';
const RUNTIME_CONFIG_VERSION = 1;

export interface AppClientRuntimeConfigPayload {
  readonly version: 1;
  readonly config: unknown;
  /** Values the server publishes, read through `config.public`. Absent when the server publishes none. */
  readonly public?: unknown;
}

export function readAppClientRuntimeConfig(
  document: Document | undefined = globalThis.document,
): unknown {
  return readRuntimeConfigPayload(document)?.config ?? {};
}

/** The values the server published, or an empty object when the page carries none. */
export function readAppClientPublicConfig(
  document: Document | undefined = globalThis.document,
): unknown {
  return readRuntimeConfigPayload(document)?.public ?? {};
}

function readRuntimeConfigPayload(
  document: Document | undefined,
): AppClientRuntimeConfigPayload | undefined {
  if (!document) {
    return undefined;
  }
  const element = document.getElementById(RUNTIME_CONFIG_ELEMENT_ID);
  if (!element) {
    return undefined;
  }
  // `resolveAppUrl` reads the mount path on every call, so the block is parsed once per element rather than per read.
  const cached = parsedPayloads.get(element);
  if (cached && cached.source === element.textContent) {
    return cached.payload;
  }
  const payload = parseRuntimeConfigPayload(element.textContent);
  parsedPayloads.set(element, { source: element.textContent, payload });
  return payload;
}

const parsedPayloads = new WeakMap<
  Element,
  {
    readonly source: string | null;
    readonly payload: AppClientRuntimeConfigPayload;
  }
>();

function parseRuntimeConfigPayload(
  text: string | null,
): AppClientRuntimeConfigPayload {
  const source = text?.trim();
  if (!source) {
    throw new Error('Client runtime config data block is empty.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error('Client runtime config data block contains invalid JSON.', {
      cause: error,
    });
  }
  if (!isRuntimeConfigPayload(payload)) {
    throw new Error(
      `Client runtime config data block must use version ${RUNTIME_CONFIG_VERSION} and contain a config object.`,
    );
  }
  return payload;
}

function isRuntimeConfigPayload(
  value: unknown,
): value is AppClientRuntimeConfigPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'version' in value &&
    value.version === RUNTIME_CONFIG_VERSION &&
    'config' in value &&
    typeof value.config === 'object' &&
    value.config !== null &&
    !Array.isArray(value.config)
  );
}
