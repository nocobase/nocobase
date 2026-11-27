/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// json-templates
// Simple templating within JSON structures.
//
// Created by Curran Kelleher and Chrostophe Serafin.
// Contributions from Paul Brewer and Javier Blanco Martinez.
import { get } from 'object-path';

function type(value) {
  let valueType: string = typeof value;
  if (Array.isArray(value)) {
    valueType = 'array';
  } else if (value instanceof Date) {
    valueType = 'date';
  } else if (value === null) {
    valueType = 'null';
  }

  return valueType;
}

// Constructs a template function with deduped `parameters` property.
function Template(fn, parameters) {
  fn.parameters = Array.from(new Map(parameters.map((parameter) => [parameter.key, parameter])).values());
  return fn;
}

type ParseOptions = {
  rawKey?: boolean;
};

type Parameter = { key: string; defaultValue?: string };

// Parses leaf nodes of the template object that are strings.
// Also used for parsing keys that contain templates.
function parseString(str, options: ParseOptions = {}) {
  const regex = /\{\{\s*([\p{L}\p{N}_.$-]*)(?::([^}]*))?\s*\}\}/gu;

  let templateFn = () => str;

  const matches = Array.from(str.matchAll(regex));
  const parameters: Parameter[] = matches.map((match) => {
    const r: Parameter = {
      key: match[1],
    };
    if (match[2]) {
      r.defaultValue = match[2];
    }
    return r;
  });

  if (matches.length > 0) {
    templateFn = (context = {}) => {
      return matches.reduce((result, match, i) => {
        const parameter = parameters[i];
        let value = get(context, options.rawKey ? [parameter.key] : parameter.key);

        if (typeof value === 'undefined') {
          value = parameter.defaultValue;
        }

        if (typeof value === 'function') {
          value = value();
        }

        if (matches.length === 1 && str.trim() === match[0]) {
          return value;
        }

        if (value instanceof Date) {
          value = value.toISOString();
        }

        return (<string>result).replace(match[0], value == null ? '' : value);
      }, str);
    };
  }

  return Template(templateFn, parameters);
}

// Parses non-leaf-nodes in the template object that are objects.
function parseObject(object, options) {
  const children = Object.keys(object).map((key) => ({
    keyTemplate: parseString(key, options),
    valueTemplate: parse(object[key], options),
  }));
  const templateParameters = children.reduce(
    (parameters, child) => parameters.concat(child.valueTemplate.parameters, child.keyTemplate.parameters),
    [],
  );
  const templateFn = (context) => {
    return children.reduce((newObject, child) => {
      newObject[child.keyTemplate(context)] = child.valueTemplate(context);
      return newObject;
    }, {});
  };

  return Template(templateFn, templateParameters);
}

// Parses non-leaf-nodes in the template object that are arrays.
function parseArray(array, options) {
  const templates = array.map((t) => parse(t, options));
  const templateParameters = templates.reduce((parameters, template) => parameters.concat(template.parameters), []);
  const templateFn = (context) => templates.map((template) => template(context));

  return Template(templateFn, templateParameters);
}

// Parses the given template object.
//
// Returns a function `template(context)` that will "fill in" the template
// with the context object passed to it.
//
// The returned function has a `parameters` property,
// which is an array of parameter descriptor objects,
// each of which has a `key` property and possibly a `defaultValue` property.
export function parse(value, options?: ParseOptions) {
  switch (type(value)) {
    case 'string':
      return parseString(value, options);
    case 'object':
      return parseObject(value, options);
    case 'array':
      return parseArray(value, options);
    default:
      return Template(function () {
        return value;
      }, []);
  }
}
