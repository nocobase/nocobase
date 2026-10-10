export type WorkflowParameterScalar = string | number | boolean;

export type WorkflowParameterOption = {
  label: string;
  value: string | number;
};

export type WorkflowParameterDeclaration = {
  type: 'string' | 'number' | 'boolean';
  title?: string;
  description?: string;
  default?: WorkflowParameterScalar;
  enum?: WorkflowParameterOption[];
};

export type WorkflowParameterSchema = Record<
  string,
  WorkflowParameterDeclaration
>;
export type WorkflowParameterValues = Record<string, WorkflowParameterScalar>;

const PARAMETER_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FORBIDDEN_PARAMETER_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);
const DECLARATION_FIELDS = new Set([
  'type',
  'title',
  'description',
  'default',
  'enum',
]);
const OPTION_FIELDS = new Set(['label', 'value']);

export class WorkflowParameterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowParameterValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isScalarOfType(
  value: unknown,
  type: WorkflowParameterDeclaration['type'],
): value is WorkflowParameterScalar {
  return typeof value === type && (type !== 'number' || Number.isFinite(value));
}

function assertKnownFields(
  value: Record<string, unknown>,
  fields: Set<string>,
  location: string,
): void {
  for (const field of Object.keys(value)) {
    if (!fields.has(field)) {
      throw new WorkflowParameterValidationError(
        `${location} contains unknown field "${field}"`,
      );
    }
  }
}

export function normalizeWorkflowParameterSchema(
  value: unknown,
  location: string = 'workflow.parameters',
): WorkflowParameterSchema {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw new WorkflowParameterValidationError(`${location} must be an object`);
  }

  // Authoring uses the same JSON Schema object shape as inputSchema. The
  // runtime keeps a flat declaration map for the existing parameter editor
  // and value resolver, so lower the object schema at this boundary.
  if (value.type === 'object') {
    if (
      value.additionalProperties !== undefined &&
      value.additionalProperties !== false
    ) {
      throw new WorkflowParameterValidationError(
        `${location}.additionalProperties must be false`,
      );
    }
    if (value.properties !== undefined && !isRecord(value.properties)) {
      throw new WorkflowParameterValidationError(
        `${location}.properties must be an object`,
      );
    }
    const properties = isRecord(value.properties) ? value.properties : {};
    const lowered = Object.create(null) as Record<string, unknown>;
    for (const [key, rawDeclaration] of Object.entries(properties)) {
      if (!isRecord(rawDeclaration)) {
        throw new WorkflowParameterValidationError(
          `${location}.properties.${key} must be an object`,
        );
      }
      const {
        type,
        title,
        description,
        default: defaultValue,
        enum: enumValues,
      }: Record<string, unknown> = rawDeclaration;
      if (!['string', 'number', 'boolean'].includes(String(type))) {
        throw new WorkflowParameterValidationError(
          `${location}.properties.${key}.type must be string, number, or boolean`,
        );
      }
      const declaration: Record<string, unknown> = { type };
      if (title !== undefined) declaration.title = title;
      if (description !== undefined) declaration.description = description;
      if (defaultValue !== undefined) declaration.default = defaultValue;
      if (enumValues !== undefined) {
        if (!Array.isArray(enumValues)) {
          throw new WorkflowParameterValidationError(
            `${location}.properties.${key}.enum must be an array`,
          );
        }
        declaration.enum = (enumValues as readonly unknown[]).map(
          (enumValue) => ({ label: String(enumValue), value: enumValue }),
        );
      }
      lowered[key] = declaration;
    }
    value = lowered;
  }

  const result: WorkflowParameterSchema = Object.create(
    null,
  ) as WorkflowParameterSchema;
  for (const [key, rawDeclaration] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const declarationLocation = `${location}.${key}`;
    if (!PARAMETER_KEY_PATTERN.test(key) || FORBIDDEN_PARAMETER_KEYS.has(key)) {
      throw new WorkflowParameterValidationError(
        `${declarationLocation} has an invalid input key`,
      );
    }
    if (!isRecord(rawDeclaration)) {
      throw new WorkflowParameterValidationError(
        `${declarationLocation} must be an object`,
      );
    }
    assertKnownFields(rawDeclaration, DECLARATION_FIELDS, declarationLocation);
    if (
      !['string', 'number', 'boolean'].includes(String(rawDeclaration.type))
    ) {
      throw new WorkflowParameterValidationError(
        `${declarationLocation}.type must be string, number, or boolean`,
      );
    }
    const type = rawDeclaration.type as WorkflowParameterDeclaration['type'];
    if (
      Object.hasOwn(rawDeclaration, 'title') &&
      typeof rawDeclaration.title !== 'string'
    ) {
      throw new WorkflowParameterValidationError(
        `${declarationLocation}.title must be a string`,
      );
    }
    if (
      Object.hasOwn(rawDeclaration, 'description') &&
      typeof rawDeclaration.description !== 'string'
    ) {
      throw new WorkflowParameterValidationError(
        `${declarationLocation}.description must be a string`,
      );
    }
    if (
      Object.hasOwn(rawDeclaration, 'default') &&
      !isScalarOfType(rawDeclaration.default, type)
    ) {
      throw new WorkflowParameterValidationError(
        `${declarationLocation}.default must be a ${type}`,
      );
    }

    let inputEnum: WorkflowParameterOption[] | undefined;
    if (Object.hasOwn(rawDeclaration, 'enum')) {
      if (type === 'boolean') {
        throw new WorkflowParameterValidationError(
          `${declarationLocation}.enum is not supported for boolean parameters`,
        );
      }
      if (!Array.isArray(rawDeclaration.enum)) {
        throw new WorkflowParameterValidationError(
          `${declarationLocation}.enum must be an array`,
        );
      }
      const seen = new Set<string | number>();
      inputEnum = rawDeclaration.enum.map((rawOption, index) => {
        const optionLocation = `${declarationLocation}.enum[${index}]`;
        if (!isRecord(rawOption)) {
          throw new WorkflowParameterValidationError(
            `${optionLocation} must be an object`,
          );
        }
        assertKnownFields(rawOption, OPTION_FIELDS, optionLocation);
        if (typeof rawOption.label !== 'string') {
          throw new WorkflowParameterValidationError(
            `${optionLocation}.label must be a string`,
          );
        }
        if (!isScalarOfType(rawOption.value, type)) {
          throw new WorkflowParameterValidationError(
            `${optionLocation}.value must be a ${type}`,
          );
        }
        const optionValue = rawOption.value as string | number;
        if (seen.has(optionValue)) {
          throw new WorkflowParameterValidationError(
            `${declarationLocation}.enum contains duplicate value ${optionValue}`,
          );
        }
        seen.add(optionValue);
        return { label: rawOption.label, value: optionValue };
      });
      if (
        Object.hasOwn(rawDeclaration, 'default') &&
        !seen.has(rawDeclaration.default as string | number)
      ) {
        throw new WorkflowParameterValidationError(
          `${declarationLocation}.default must be one of the enum values`,
        );
      }
    }

    result[key] = {
      type,
      ...(rawDeclaration.title === undefined
        ? {}
        : { title: rawDeclaration.title as string }),
      ...(rawDeclaration.description === undefined
        ? {}
        : { description: rawDeclaration.description as string }),
      ...(Object.hasOwn(rawDeclaration, 'default')
        ? { default: rawDeclaration.default as WorkflowParameterScalar }
        : {}),
      ...(inputEnum === undefined ? {} : { enum: inputEnum }),
    };
  }
  return result;
}

export function normalizeWorkflowParameterValues(
  schema: WorkflowParameterSchema | null | undefined,
  value: unknown,
  location: string = 'parameterValues',
): WorkflowParameterValues {
  if (!isRecord(value)) {
    throw new WorkflowParameterValidationError(`${location} must be an object`);
  }
  const declarations = schema ?? {};
  const result: WorkflowParameterValues = Object.create(
    null,
  ) as WorkflowParameterValues;
  for (const [key, inputValue] of Object.entries(value)) {
    if (!Object.hasOwn(declarations, key)) {
      throw new WorkflowParameterValidationError(
        `${location}.${key} is not declared`,
      );
    }
    const declaration = declarations[key];
    if (!isScalarOfType(inputValue, declaration.type)) {
      throw new WorkflowParameterValidationError(
        `${location}.${key} must be a ${declaration.type}`,
      );
    }
    if (
      declaration.enum &&
      !declaration.enum.some((option) => Object.is(option.value, inputValue))
    ) {
      throw new WorkflowParameterValidationError(
        `${location}.${key} must be one of the declared enum values`,
      );
    }
    result[key] = inputValue;
  }
  return result;
}

export function retainCompatibleWorkflowParameterValues(
  schema: WorkflowParameterSchema,
  value: unknown,
): WorkflowParameterValues {
  if (!isRecord(value)) {
    return {};
  }
  const result: WorkflowParameterValues = Object.create(
    null,
  ) as WorkflowParameterValues;
  for (const [key, inputValue] of Object.entries(value)) {
    const declaration = schema[key];
    if (!declaration || !isScalarOfType(inputValue, declaration.type)) {
      continue;
    }
    if (
      declaration.enum &&
      !declaration.enum.some((option) => Object.is(option.value, inputValue))
    ) {
      continue;
    }
    result[key] = inputValue;
  }
  return result;
}

export function resolveWorkflowParameters(
  schema: WorkflowParameterSchema | null | undefined,
  values: WorkflowParameterValues | null | undefined,
): WorkflowParameterValues {
  const result: WorkflowParameterValues = Object.create(
    null,
  ) as WorkflowParameterValues;
  for (const [key, declaration] of Object.entries(schema ?? {})) {
    if (Object.hasOwn(values ?? {}, key)) {
      result[key] = (values as WorkflowParameterValues)[key];
    } else if (Object.hasOwn(declaration, 'default')) {
      result[key] = declaration.default as WorkflowParameterScalar;
    }
  }
  return result;
}
