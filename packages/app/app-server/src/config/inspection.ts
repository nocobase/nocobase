import type { Config } from '@nocobase/config';

export interface InspectedSetting {
  path: string;
  source: string;
  value: string;
  variable?: string;
  fileValue?: string;
}

// Explicitly allow only reviewed fields. A custom section, URL parameter or
// unexpectedly structured value must never be serialized to the browser.
const formats = {
  'app.publicOrigin': 'origin',
  'app.sampleData': 'boolean',
  'server.port': 'number',
  'server.startLog': 'boolean',
  'i18n.defaultLocale': 'locale',
  'logging.level': 'level',
  'logging.file.enabled': 'boolean',
  'logging.console.enabled': 'boolean',
  'auth.emailAndPassword.enabled': 'boolean',
  'database.connections.main.password': 'presence',
  'users.initialAdmin.password': 'presence',
  'secrets.keys': 'presence',
} as const;

type Field = keyof typeof formats;
const fields = Object.keys(formats) as Field[];

function display(field: Field, value: unknown): string {
  if (value == null || value === '') return '—';
  switch (formats[field]) {
    case 'presence':
      return '[configured]';
    case 'number':
      return typeof value === 'number' ? String(value) : '[hidden]';
    case 'boolean':
      return typeof value === 'boolean' ? String(value) : '[hidden]';
    case 'locale':
      return typeof value === 'string' &&
        /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(value)
        ? value
        : '[hidden]';
    case 'level':
      return typeof value === 'string' &&
        ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'].includes(
          value,
        )
        ? value
        : '[hidden]';
    case 'origin': {
      if (typeof value === 'string' && URL.canParse(value)) {
        const url = new URL(value);
        if (['https:', 'http:'].includes(url.protocol)) return url.origin;
      }
      return '[hidden]';
    }
  }
}

export class ConfigInspection {
  private readonly sources = new Map<Field, string>();
  private readonly files = new Map<Field, string>();

  record(layer: Config, kind: 'file' | 'environment' | 'unknown'): void {
    for (const field of fields) {
      if (!layer.has(field)) continue;
      this.sources.set(field, kind);
      if (kind === 'file')
        this.files.set(field, display(field, layer.get(field)));
    }
  }

  rows(
    config: Config,
    variables: Readonly<Record<string, string>>,
  ): InspectedSetting[] {
    return fields
      .filter((field) => config.has(field) || this.files.has(field))
      .map((path) => ({
        path,
        source: this.sources.get(path) ?? 'default',
        value: display(path, config.get(path)),
        variable: Object.keys(variables).find((key) => variables[key] === path),
        fileValue: this.files.get(path),
      }));
  }
}
