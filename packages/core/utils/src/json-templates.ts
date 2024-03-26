// json-templates
// Simple templating within JSON structures.
//
// Created by Curran Kelleher and Chrostophe Serafin.
// Contributions from Paul Brewer and Javier Blanco Martinez.
import { get } from 'lodash';
import dedupe from 'dedupe';

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

// Constructs a parameter object from a match result.
// e.g. "['{{foo}}']" --> { key: "foo" }
// e.g. "['{{foo:bar}}']" --> { key: "foo", defaultValue: "bar" }
function Parameter(match) {
  let param;
  const matchValue = match.substr(2, match.length - 4).trim();
  const i = matchValue.indexOf(':');

  if (i !== -1) {
    param = {
      key: matchValue.substr(0, i),
      defaultValue: matchValue.substr(i + 1),
    };
  } else {
    param = { key: matchValue };
  }

  return param;
}

// Constructs a template function with deduped `parameters` property.
function Template(fn, parameters) {
  // Paul Brewer Dec 2017 add deduplication call, use only key property to eliminate
  Object.assign(fn, {
    parameters: dedupe(parameters, (item) => item.key),
  });

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
  const regex = /{{(\w|:|[\s-+.,@///()?=*_$])+}}/g;

  return (str) => {
    let parameters = [];
    let templateFn = (context) => str;

    const matches = str.match(regex);
    if (matches) {
      parameters = matches.map(Parameter);
      templateFn = (context) => {
        context = context || {};
        return matches.reduce((result, match, i) => {
          const parameter = parameters[i];
          let value = get(context, parameter.key);

          if (typeof value === 'undefined') {
            value = parameter.defaultValue;
          }

          if (typeof value === 'function') {
            value = value();
          }

          // Accommodate numbers as values.
          if (str.startsWith('{{') && str.endsWith('}}')) {
            return value;
          }

          if (value instanceof Date) {
            value = value.toISOString();
          }

          return result.replace(match, value == null ? '' : value);
        }, str);
      };
    }

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
