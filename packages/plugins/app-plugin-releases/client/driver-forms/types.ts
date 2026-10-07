/**
 * How a deployment driver describes its environment form. A driver package contributes one description per driver
 * kind (`releasesDriverFormsToken`); the environments page renders it instead of the raw JSON editors. Labels, hints and
 * option names are locale keys in the description's own namespace (`ns`, the driver package's client namespace), so a
 * driver ships its words with its form. Placeholders are literal examples (URLs, paths), not translated.
 *
 * Every field maps to one place:
 * - `config.<dotted path>`: the environment's settings (`Environment.config`), validated by the driver on save;
 * - `secret.<key>`: a write-only credential; the form shows whether it is set and sends only what changed;
 * - `environment.publicUrl`: the environment's public URL pattern;
 * - `facts.<key>`: read-only, how the application configured the driver (`DriverSummary.facts`).
 * A field without a path is virtual: the description's `codec` reads it from and writes it into the settings, for a
 * value that is split over several inputs (the Docker endpoint's connection mode, for example).
 */

/** A locale key in the description's namespace. */
export type DriverFormText = string;

/** Shows a field or group only while another field holds one of these values. */
export interface DriverFormCondition {
  readonly field: string;
  readonly equals: string | boolean | readonly (string | boolean)[];
}

export interface DriverFormOption {
  readonly value: string;
  readonly label: DriverFormText;
  readonly hint?: DriverFormText;
}

interface FieldBase {
  /** Unique within the form; the field's state key. */
  readonly id: string;
  readonly label: DriverFormText;
  readonly hint?: DriverFormText;
  /** A literal example shown while the field is empty. */
  readonly placeholder?: string;
  readonly visibleWhen?: DriverFormCondition;
  /** Saving is refused while a shown required field is empty. */
  readonly required?: boolean;
  /** Monospace input, for paths, URLs and names. */
  readonly mono?: boolean;
  /** Takes the whole row, for a long value such as an address. */
  readonly wide?: boolean;
}

export interface DriverFormTextField extends FieldBase {
  readonly type: 'text';
  readonly path?: string;
  readonly default?: string;
  /** A textarea instead of a single line. */
  readonly multiline?: boolean;
}

export interface DriverFormNumberField extends FieldBase {
  readonly type: 'number';
  readonly path: string;
  readonly default?: number;
  readonly integer?: boolean;
  readonly min?: number;
  readonly max?: number;
  /** A locale key naming the unit, shown after the input. */
  readonly unit?: DriverFormText;
}

export interface DriverFormSwitchField extends FieldBase {
  readonly type: 'switch';
  readonly path: string;
  readonly default: boolean;
}

export interface DriverFormChoiceField extends FieldBase {
  readonly type: 'choice';
  readonly path?: string;
  readonly options: readonly DriverFormOption[];
  readonly default: string;
  /**
   * The options are the driver's variants (`DriverSummary.variants`, such as the Host driver's run modes): only those
   * the application offers are shown.
   */
  readonly variants?: boolean;
  /** Radio cards for a few options that need explaining, a select otherwise. */
  readonly display?: 'radio' | 'select';
}

/** Strings, one per line. */
export interface DriverFormListField extends FieldBase {
  readonly type: 'list';
  readonly path: string;
}

/** Names and values, `NAME=value` per line. */
export interface DriverFormMapField extends FieldBase {
  readonly type: 'map';
  readonly path: string;
}

/** A shell command line, stored as `['sh', '-c', <line>]`. */
export interface DriverFormCommandField extends FieldBase {
  readonly type: 'command';
  readonly path: string;
}

/** A write-only credential (`secret.<key>`): a text, or `NAME=value` lines with `format: 'map'`. */
export interface DriverFormSecretField extends FieldBase {
  readonly type: 'secret';
  readonly path: string;
  readonly format?: 'text' | 'multiline' | 'map';
  /** Removed from the stored credentials when the field is hidden (it belongs to a run mode no longer chosen). */
  readonly clearWhenHidden?: boolean;
}

/** Read-only: how the application configured the driver (`facts.<key>`). */
export interface DriverFormFactField extends FieldBase {
  readonly type: 'fact';
  readonly path: string;
  /** What an absent fact means, as a locale key. */
  readonly empty?: DriverFormText;
  /** What an empty list means, when that differs from absent. */
  readonly emptyList?: DriverFormText;
}

export type DriverFormField =
  | DriverFormTextField
  | DriverFormNumberField
  | DriverFormSwitchField
  | DriverFormChoiceField
  | DriverFormListField
  | DriverFormMapField
  | DriverFormCommandField
  | DriverFormSecretField
  | DriverFormFactField;

export interface DriverFormGroup {
  readonly id: string;
  readonly title: DriverFormText;
  readonly description?: DriverFormText;
  /** Collapsed until opened; its fields keep their defaults. */
  readonly advanced?: boolean;
  /**
   * An optional settings object (`config.<path>`): present while the switch is on, removed when it is off.
   */
  readonly toggle?: {
    readonly path: string;
    readonly label: DriverFormText;
    readonly hint?: DriverFormText;
  };
  readonly visibleWhen?: DriverFormCondition;
  readonly fields: readonly DriverFormField[];
}

/** Values of the virtual fields: what the inputs hold, as text, switch and choice state. */
export type DriverFormValues = Record<string, string | boolean>;

export interface DriverFormDescription {
  /** The driver kind (`DeploymentDriver.kind`) the form is for. */
  readonly kind: string;
  /** The locale namespace of every key in the description. */
  readonly ns: string;
  readonly title: DriverFormText;
  /** One line under the title in the driver picker. */
  readonly description: DriverFormText;
  readonly groups: readonly DriverFormGroup[];
  /** Reads and writes the virtual fields (those without a `path`). */
  readonly codec?: {
    decode(config: Readonly<Record<string, unknown>>): DriverFormValues;
    /** Writes the virtual fields into `config`, a copy the form owns. */
    encode(values: DriverFormValues, config: Record<string, unknown>): void;
  };
  /** What an environment's settings come down to in the environment list, such as its run mode; the title otherwise. */
  summary?(config: Readonly<Record<string, unknown>>): DriverFormText | null;
  /** How the connection test's result reads. */
  readonly check?: {
    /** `details` entries worth showing after a successful check, by key. */
    readonly details?: readonly {
      readonly key: string;
      readonly label: DriverFormText;
      /** Locale keys for known values, such as a container state. */
      readonly values?: Readonly<Record<string, DriverFormText>>;
    }[];
    /** A failure the driver reports in English, as a locale key with values; null leaves it as sent. */
    explain?(message: string): {
      readonly key: DriverFormText;
      readonly values?: Record<string, string>;
    } | null;
  };
}

/** Driver forms by driver kind. */
export interface DriverFormRegistry {
  register(form: DriverFormDescription): () => void;
  get(kind: string): DriverFormDescription | undefined;
}
