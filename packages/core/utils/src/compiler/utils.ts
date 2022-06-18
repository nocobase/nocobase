export const SchemaStateMap = {
  title: 'title',
  description: 'description',
  default: 'initialValue',
  enum: 'dataSource',
  readOnly: 'readOnly',
  writeOnly: 'editable',
  'x-content': 'content',
  'x-data': 'data',
  'x-value': 'value',
  'x-editable': 'editable',
  'x-disabled': 'disabled',
  'x-read-pretty': 'readPretty',
  'x-read-only': 'readOnly',
  'x-visible': 'visible',
  'x-hidden': 'hidden',
  'x-display': 'display',
  'x-pattern': 'pattern',
  'x-validator': 'validator',
  'x-decorator': 'decoratorType',
  'x-component': 'componentType',
  'x-decorator-props': 'decoratorProps',
  'x-component-props': 'componentProps',
};

export const SchemaValidatorMap = {
  required: true,
  format: true,
  maxItems: true,
  minItems: true,
  maxLength: true,
  minLength: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  pattern: true,
  const: true,
  multipleOf: true,
  maxProperties: true,
  minProperties: true,
  uniqueItems: true,
};

export const SchemaNestedMap = {
  parent: true,
  root: true,
  properties: true,
  patternProperties: true,
  additionalProperties: true,
  items: true,
  additionalItems: true,
  'x-linkages': true,
  'x-reactions': true,
};
