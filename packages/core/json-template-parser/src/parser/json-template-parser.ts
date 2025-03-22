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

type ScopeFnWrapperResult = {
  getValue: (params: { field: string[]; keys: string[] }) => any;
  afterApplyHelpers: (params: { field: string[]; keys: string[]; value: any }) => any;
};

type ScopeFnWrapper = (params: {
  fields: string[];
  data: any;
  context?: Record<string, any>;
}) => Promise<ScopeFnWrapperResult>;

type ScopeMapValue = { fieldSet: Set<string>; scopeFnWrapper: ScopeFnWrapper; scopeFn?: ScopeFnWrapperResult };
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

  async render(template: string, data: any = {}, context?: Record<string, any>): Promise<any> {
    const NamespaceMap = new Map<string, ScopeMapValue>();
    Object.keys(data).forEach((key) => {
      if (key.startsWith('$') || typeof data[key] === 'function') {
        NamespaceMap.set(escape(key), { fieldSet: new Set<string>(), scopeFnWrapper: data[key] });
      }
    });
    const parsed = this.parse(template, { NamespaceMap });
    const fnPromises = Array.from(NamespaceMap.entries()).map(
      async ([key, { fieldSet, scopeFnWrapper: fnWrapper }]): Promise<{
        key: string;
        scopeFn: ScopeFnWrapperResult;
      } | null> => {
        const fields = Array.from(fieldSet);
        if (fields.length === 0) {
          return null;
        }
        const hooks: Record<'afterApplyHelpers', any> = { afterApplyHelpers: null };

        const scopeFn = await fnWrapper({ fields, data, context });
        return { key, scopeFn };
      },
    );
    const scopeFns = (await Promise.all(fnPromises)).filter(Boolean);
    scopeFns.forEach(({ key, scopeFn }) => {
      const NS = NamespaceMap.get(key);
      NS.scopeFn = scopeFn;
    });

    return parsed(data);
  }

  parse = (value: any, opts?: { NamespaceMap: Map<string, ScopeMapValue> }) => {
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
      const getFieldName = ({ variableName, variableSegments }) =>
        revertEscape(variableName.slice(variableSegments[0].length + 1));
      return (str, preKeys: string[]) => {
        const escapeStr = escape(str);
        const rawTemplates = engine.parse(escapeStr);
        const templates = rawTemplates.map((rawTemplate) => {
          const content = rawTemplate.token.input.slice(rawTemplate.token.begin, rawTemplate.token.end);
          if (rawTemplate.token.kind === TokenKind.Output) {
            // @ts-ignore
            const fullVariables = engine.fullVariablesSync(content);
            const variableName = fullVariables[0];
            // @ts-ignore
            const variableSegments = (engine.variableSegmentsSync(content)[0] ?? []) as string[];
            /* collect scope fields to map
           eg: '{{ $user.name }} - {{$user.id}}'
           fieldsMap = {'$user': ['name', 'id']}
           */
            if (
              opts?.NamespaceMap &&
              variableName.startsWith(escape('$')) &&
              variableSegments.length > 1 &&
              opts.NamespaceMap.has(variableSegments[0])
            ) {
              const fieldSet = opts.NamespaceMap.get(variableSegments[0]).fieldSet;
              const field = getFieldName({ variableName, variableSegments });
              fieldSet.add(field);
            }
            return {
              variableName: fullVariables[0],
              variableSegments,
              tokenKind: rawTemplate.token.kind,
              tokenBegin: rawTemplate.token.begin,
              tokenEnd: rawTemplate.token.end,
              content,
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
              content,
            };
          }
        });

        const templateFn = (context) => {
          const escapedContext = escape(context);

          const templatesValue = templates.map((template) => {
            if (template.tokenKind === TokenKind.Output) {
              let value;
              const ctxVal = get(escapedContext, template.variableName);

              if (opts?.NamespaceMap && opts.NamespaceMap.has(template.variableSegments[0])) {
                const scopeKey = template.variableSegments[0];
                const NS = opts.NamespaceMap.get(scopeKey);
                const scopeFn = NS.scopeFn;
                const field = getFieldName({
                  variableName: template.variableName,
                  variableSegments: template.variableSegments,
                });
                if (!scopeFn?.getValue) {
                  throw new Error(`fn not found for ${scopeKey}`);
                }
                value = scopeFn.getValue({ field: revertEscape(field), keys: preKeys });

                const appliedHelpersValue = template.filters.reduce(
                  (acc, filter) => filter.handler(...[acc, ...filter.args]),
                  typeof value === 'function' ? value() : value,
                );

                if (scopeFn?.afterApplyHelpers) {
                  return scopeFn.afterApplyHelpers({ field: preKeys, keys: preKeys, value: appliedHelpersValue });
                }
                return appliedHelpersValue;
              } else if (typeof ctxVal === 'function') {
                const ctxVal = get(escapedContext, template.variableName);
                value = ctxVal();
              } else {
                value = get(escapedContext, template.variableName);
              }
              return template.filters.reduce(
                (acc, filter) => filter.handler(...[acc, ...filter.args]),
                typeof value === 'function' ? value() : value,
              );
            } else {
              return template.content;
            }
          });
          if (templates.length === 1 && templates[0].tokenBegin === 0 && templates[0].tokenEnd === escapeStr.length) {
            return revertEscape(templatesValue[0]);
          } else {
            return revertEscape(templatesValue.join(''));
          }
        };

        // Accommodate non-string as original values.

        const parameters = templates.map((template) => ({ key: revertEscape(template.variableName) }));

        return Template(templateFn, parameters);
      };
    })();

    function parseObject(object, preKeys) {
      const children = Object.keys(object).map((key) => ({
        keyTemplate: parseString(key, preKeys),
        valueTemplate: _parse(object[key], [...preKeys, key]),
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
    function parseArray(array, preKeys) {
      const templates = array.map((item, index) => _parse(item, [...preKeys, index]));
      const templateParameters = templates.reduce((parameters, template) => parameters.concat(template.parameters), []);
      const templateFn = (context) => templates.map((template) => template(context));

      return Template(templateFn, templateParameters);
    }

    function _parse(value, keys = []) {
      switch (type(value)) {
        case 'string':
          return parseString(value, keys);
        case 'object':
          return parseObject(value, keys);
        case 'array':
          return parseArray(value, keys);
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

export const parse = parser.parse;
