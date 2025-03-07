/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Liquid, TokenKind } from 'liquidjs';
import { get } from 'lodash';
import { variableFilters, filterGroups } from '../filters';
import { escape, revertEscape } from '../escape';
type FilterGroup = {
  name: string;
  title: string;
  sort: number;
};

type Filter = {
  name: string;
  title: string;
  handler: (...args: any[]) => any;
  group: string;
  uiSchema?: any;
  sort: number;
};

export class JSONTemplateParser {
  private _engine: Liquid;
  private _filterGroups: Array<FilterGroup>;
  private _filters: Array<Filter>;

  constructor() {
    this._engine = new Liquid();
    this._filterGroups = [];
    this._filters = [];
  }

  get filters(): Array<Filter> {
    return this._filters;
  }

  get engine(): Liquid {
    return this._engine;
  }

  get filterGroups(): Array<
    FilterGroup & {
      filters: Array<Filter>;
    }
  > {
    return this._filterGroups.map((group) => ({
      ...group,
      filters: this._filters.filter((filter) => filter.group === group.name),
    }));
  }

  registerFilterGroup(group: FilterGroup): void {
    this._filterGroups.push(group);
  }
  registerFilter(filter: Filter): void {
    this._filters.push(filter);
    this._engine.registerFilter(filter.name, filter.handler);
  }

  render(template: string, data: any = {}): any {
    const scopeFieldsMap = new Map<string, string[]>();
    Object.keys(data).forEach((key) => {
      if (key.startsWith('$') || typeof data[key] === 'function') {
        scopeFieldsMap.set(key, []);
      }
    });
    const parsed = this.parse(template, { scopeFieldsMap });
    return parsed(data);
  }

  parse = (value: any, opts?: { scopeFieldsMap: Map<string, string[]> }) => {
    const engine = this.engine;
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

    function Template(fn, parameters) {
      fn.parameters = Array.from(new Map(parameters.map((parameter) => [parameter.key, parameter])).values());
      return fn;
    }

    // This regular expression detects instances of the
    // template parameter syntax such as {{foo}} or {{foo:someDefault}}.
    const parseString = (() => {
      // This regular expression detects instances of the
      // template parameter syntax such as {{foo}} or {{foo:someDefault}}.

      return (str) => {
        const escapeStr = escape(str);
        const rawTemplates = engine.parse(escapeStr);
        const templates = rawTemplates
          .filter((rawTemplate) => rawTemplate.token.kind === TokenKind.Output)
          .map((rawTemplate) => {
            if (rawTemplate.token.kind === TokenKind.Output) {
              // @ts-ignore
              const fullVariables = engine.fullVariablesSync(rawTemplate.token.content);
              const variableName = fullVariables[0];
              // @ts-ignore
              const variableSegments = (engine.variableSegmentsSync(rawTemplate.token.content)[0] ?? []) as string[];
              /* collect scope fields to map
           eg: '{{ $user.name }} - {{$user.id}}'
           fieldsMap = {'$user': ['name', 'id']}
           */
              if (
                opts?.scopeFieldsMap &&
                variableName.startsWith('$') &&
                variableSegments.length > 1 &&
                opts.scopeFieldsMap.has(variableSegments[0])
              ) {
                opts.scopeFieldsMap.set(variableName, variableSegments.slice(1));
              }
              return {
                // @ts-ignore
                variableName: fullVariables[0],
                variableSegments,
                tokenKind: rawTemplate.token.kind,
                tokenBegin: rawTemplate.token.begin,
                tokenEnd: rawTemplate.token.end,
                // @ts-ignore
                filters: rawTemplate.value?.filters.map(({ name, handler, args }) => ({
                  name,
                  handler,
                  args: args.map((arg) => arg.content),
                })),
              };
            } else {
              return {
                tokenKind: rawTemplate.token.kind,
                tokenBegin: rawTemplate.token.begin,
                tokenEnd: rawTemplate.token.end,
                // @ts-ignore
                content: rawTemplate.token.content,
              };
            }
          });
        const templateFn = (context) => {
          const escapedContext = escape(context);
          if (templates.length === 1 && templates[0].tokenBegin === 0 && templates[0].tokenEnd === escapeStr.length) {
            let value = get(escapedContext, templates[0].variableName);
            if (typeof value === 'function') {
              value = value();
            }
            if (Array.isArray(templates[0].filters)) {
              return templates[0].filters.reduce((acc, filter) => filter.handler(...[acc, ...filter.args]), value);
            }
          } else {
            return revertEscape(engine.renderSync(rawTemplates, escapedContext));
          }

          templates.map((template) => {
            if (template.tokenKind === TokenKind.Output) {
              const value = get(escapedContext, template.variableName);
            }
          });
        };

        // Accommodate non-string as original values.

        const parameters = templates.map((template) => ({ key: revertEscape(template.variableName) }));

        return Template(templateFn, parameters);
      };
    })();

    function parseObject(object) {
      const children = Object.keys(object).map((key) => ({
        keyTemplate: parseString(key),
        valueTemplate: _parse(object[key]),
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
      const templates = array.map(_parse);
      const templateParameters = templates.reduce((parameters, template) => parameters.concat(template.parameters), []);
      const templateFn = (context) => templates.map((template) => template(context));

      return Template(templateFn, templateParameters);
    }

    function _parse(value) {
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

    return _parse(value);
  };
}

const parser = new JSONTemplateParser();

export function createJSONTemplateParser() {
  return parser;
}
