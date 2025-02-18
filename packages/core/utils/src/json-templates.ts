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
import { get, template } from 'lodash';
import liquidjsEngine from './liquidjs';
import { TokenKind } from 'liquidjs';
import engine from './liquidjs';
import raw from 'liquidjs/dist/tags/raw';
import b from 'packages/core/database/src/__tests__/fixtures/c1/b';

// An enhanced version of `typeof` that handles arrays and dates as well.
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

// Parses the given template object.
//
// Returns a function `template(context)` that will "fill in" the template
// with the context object passed to it.
//
// The returned function has a `parameters` property,
// which is an array of parameter descriptor objects,
// each of which has a `key` property and possibly a `defaultValue` property.
export function parse(value) {
  switch (type(value)) {
    case 'string':
      return parseString(value);
    case 'object':
      return parseObject(value);
    case 'array':
      return parseArray(value);
    default:
      return Template(function () {
        return value;
      }, []);
  }
}

// Parses leaf nodes of the template object that are strings.
// Also used for parsing keys that contain templates.
const parseString = (() => {
  // This regular expression detects instances of the
  // template parameter syntax such as {{foo}} or {{foo:someDefault}}.

  return (str) => {
    const rawTemplates = liquidjsEngine.parse(str);
    // const ref = {};
    // rawTemplates.forEach((template) => {
    //   if (template.token.kind === TokenKind.Output) {
    //     // @ts-ignore
    //     const variable = template.value?.initial?.postfix;
    //     // @ts-ignore
    //     ref.variableName = variable[0].props[0].content;
    //     // @ts-ignore
    //     ref.filters = template.value?.filters.map(({ name, handler, args }) => ({
    //       name,
    //       handler,
    //       args: args.map((arg) => arg.content),
    //     }));
    //   }
    // });

    const templates = rawTemplates
      .filter((rawTemplate) => rawTemplate.token.kind === TokenKind.Output)
      .map((rawTemplate) => {
        const fullVariables = liquidjsEngine.fullVariablesSync(rawTemplate.token.input);
        return {
          // @ts-ignore
          variableName: fullVariables[0],
          tokenBegin: rawTemplate.token.begin,
          tokenEnd: rawTemplate.token.end,
          // @ts-ignore
          filters: rawTemplate.value?.filters.map(({ name, handler, args }) => ({
            name,
            handler,
            args: args.map((arg) => arg.content),
          })),
        };
      });
    const templateFn = (context) => {
      if (templates.length === 1 && templates[0].tokenBegin === 0 && templates[0].tokenEnd === str.length) {
        let value = get(context, templates[0].variableName);
        if (typeof value === 'function') {
          value = value();
        }
        if (Array.isArray(templates[0].filters)) {
          return templates[0].filters.reduce((acc, filter) => filter.handler(...[acc, ...filter.args]), value);
        }
      }
      return engine.renderSync(rawTemplates, context);
    };

    // Accommodate non-string as original values.

    const parameters = templates.map((template) => ({ key: template.variableName }));

    return Template(templateFn, parameters);
  };
})();

// Parses non-leaf-nodes in the template object that are objects.
function parseObject(object) {
  const children = Object.keys(object).map((key) => ({
    keyTemplate: parseString(key),
    valueTemplate: parse(object[key]),
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
function parseArray(array) {
  const templates = array.map(parse);
  const templateParameters = templates.reduce((parameters, template) => parameters.concat(template.parameters), []);
  const templateFn = (context) => templates.map((template) => template(context));

  return Template(templateFn, templateParameters);
}
