/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* globals define,module */

/*
Using a Universal Module Loader that should be browser, require, and AMD friendly
http://ricostacruz.com/cheatsheets/umdjs.html
*/

import { getDayRangeByParams } from '@nocobase/utils/client';

export function getOperators() {
  'use strict';
  /* globals console:false */

  if (!Array.isArray) {
    Array.isArray = function (arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }

  /**
   * Return an array that contains no duplicates (original not modified)
   * @param  {array} array   Original reference array
   * @return {array}         New array with no duplicates
   */
  function arrayUnique(array) {
    var a = [];
    for (var i = 0, l = array.length; i < l; i++) {
      if (a.indexOf(array[i]) === -1) {
        a.push(array[i]);
      }
    }
    return a;
  }
  function areArraysEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  var jsonLogic = {};
  var operations = {
    $is: function (a, b) {
      return a === b;
    },
    $match: function (a, b) {
      if (Array.isArray(a) && Array.isArray(b) && a.some((element) => Array.isArray(element))) {
        return a.some(
          (subArray) => subArray?.length === b.length && subArray?.every((element, index) => element === b[index]),
        );
      }
      return JSON.stringify(a) === JSON.stringify(b);
    },
    $eq: function (a, b) {
      if (Array.isArray(a) && Array.isArray(b)) return areArraysEqual(a, b);
      if (Array.isArray(a)) {
        return a.includes(b);
      }
      return a == b;
    },
    $ne: function (a, b) {
      return a != b;
    },
    '!==': function (a, b) {
      return a !== b;
    },
    $gt: function (a, b) {
      if (Array.isArray(a)) return a.some((k) => k > b);
      return a > b;
    },
    $gte: function (a, b) {
      return a >= b;
    },
    $lt: function (a, b, c) {
      if (Array.isArray(a)) return a.some((k) => k < b);
      return c === undefined ? a < b : a < b && b < c;
    },
    $lte: function (a, b, c) {
      return c === undefined ? a <= b : a <= b && b <= c;
    },
    $exists: function (a) {
      return jsonLogic.truthy(a);
    },
    $notEmpty: function (a) {
      return jsonLogic.truthy(a);
    },
    $empty: function (a) {
      if (Array.isArray(a)) return a.length === 0;
      return !jsonLogic.truthy(a);
    },
    $notExists: function (a) {
      return !jsonLogic.truthy(a);
    },
    '%': function (a, b) {
      return a % b;
    },
    log: function (a) {
      return a;
    },
    $in: function (a, b) {
      if (!b || typeof b.indexOf === 'undefined') return false;
      if (Array.isArray(a) && Array.isArray(b)) {
        return b.some((elementB) => a.includes(elementB));
      }
      return b.indexOf(a) !== -1;
    },
    $notIn: function (a, b) {
      if (!b || typeof b.indexOf === 'undefined') return false;
      return !(b.indexOf(a) !== -1);
    },
    $includes: function (a, b) {
      if (!a || typeof a.indexOf === 'undefined') return false;
      if (Array.isArray(a)) return a.some((element) => element?.includes(b));
      return a.indexOf(b) !== -1;
    },
    $notIncludes: function (a, b) {
      if (Array.isArray(a)) return !a.some((element) => (element || '').includes(b));

      a = a || '';

      return !a.includes(b);
    },
    $anyOf: function (a, b) {
      if (a == null || a.length === 0) {
        return false;
      }
      if (Array.isArray(a) && Array.isArray(b) && a.some((element) => Array.isArray(element))) {
        return a.some((subArray) => subArray.some((element) => b.includes(element)));
      }
      return a.some((element) => b.includes(element));
    },
    $noneOf: function (a, b) {
      if (!a || a.length === 0) return true;
      if (!b || b.length === 0) return true;

      if (!Array.isArray(a)) a = [a];
      if (!Array.isArray(b)) b = [b];
      return !b.some((item) => a.includes(item));
    },
    $notMatch: function (a, b) {
      if (a.length !== b.length) {
        return true;
      }

      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return true;
        }
      }
      return false;
    },
    //日期比较操作符
    $dateOn: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      if (Array.isArray(b)) {
        return operations.$dateBetween(a, b);
      }

      const dateA = parseDate(a);
      const dateB = parseDate(b);
      if (!dateA || !dateB) {
        return false;
      }

      return dateA.getTime() === dateB.getTime();
    },
    $dateBefore: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      if (Array.isArray(b)) {
        b = b[0];
      }
      // Parse both date strings
      const dateA = parseDate(a);
      const dateB = parseDate(b);
      if (!dateA || !dateB) {
        return false;
      }
      return dateA.getTime() < dateB.getTime();
    },
    $dateNotBefore: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      if (Array.isArray(b)) {
        b = b[0];
      }
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      if (!dateA || !dateB) {
        throw new Error('Invalid date format');
      }

      // Compare the two dates
      return dateA.getTime() >= dateB.getTime();
    },
    $dateAfter: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      if (Array.isArray(b)) {
        b = b[1];
      }
      // Parse both date strings
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      return dateA.getTime() > dateB.getTime();
    },
    $dateNotAfter: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      if (Array.isArray(b)) {
        b = b[1];
      }
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      if (!dateA || !dateB) {
        throw new Error('Invalid date format');
      }
      return dateA.getTime() <= dateB.getTime();
    },
    $dateBetween: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      const dateA = parseDate(a);
      const dateBStart = parseFullDate(b[0]);
      const dateBEnd = parseFullDate(b[1]);
      if (!dateA || !dateBStart || !dateBEnd) {
        throw new Error('Invalid date format');
      }
      return dateA.getTime() >= dateBStart.getTime() && dateA.getTime() <= dateBEnd.getTime();
    },
    $dateNotOn: function (a, b) {
      if (!a || !b) {
        return false;
      }
      if (b.type) {
        b = getDayRangeByParams(b);
      }
      if (Array.isArray(b)) {
        return !operations.$dateBetween(a, b);
      }
      const dateA = parseDate(a);
      const dateB = parseDate(b);
      return dateA.getTime() !== dateB.getTime();
    },
    $isTruly: function (a) {
      if (Array.isArray(a)) return a.some((k) => k === true || k === 1);
      return a === true || a === 1;
    },
    $isFalsy: function (a) {
      if (Array.isArray(a)) return a.some((k) => !jsonLogic.truthy(k));
      return !jsonLogic.truthy(a);
    },
    cat: function () {
      return Array.prototype.join.call(arguments, '');
    },
    substr: function (source, start, end) {
      if (end < 0) {
        // JavaScript doesn't support negative end, this emulates PHP behavior
        var temp = String(source).substr(start);
        return temp.substr(0, temp.length + end);
      }
      return String(source).substr(start, end);
    },
    '+': function () {
      return Array.prototype.reduce.call(
        arguments,
        function (a, b) {
          return parseFloat(a, 10) + parseFloat(b, 10);
        },
        0,
      );
    },
    '*': function () {
      return Array.prototype.reduce.call(arguments, function (a, b) {
        return parseFloat(a, 10) * parseFloat(b, 10);
      });
    },
    '-': function (a, b) {
      if (b === undefined) {
        return -a;
      } else {
        return a - b;
      }
    },
    '/': function (a, b) {
      return a / b;
    },
    min: function () {
      return Math.min.apply(this, arguments);
    },
    max: function () {
      return Math.max.apply(this, arguments);
    },
    merge: function () {
      return Array.prototype.reduce.call(
        arguments,
        function (a, b) {
          return a.concat(b);
        },
        [],
      );
    },
    var: function (a, b) {
      var not_found = b === undefined ? null : b;
      var data = this;
      if (typeof a === 'undefined' || a === '' || a === null) {
        return data;
      }
      var sub_props = String(a).split('.');
      for (var i = 0; i < sub_props.length; i++) {
        if (data === null || data === undefined) {
          return not_found;
        }
        // Descending into data
        data = data[sub_props[i]];
        if (data === undefined) {
          return not_found;
        }
      }
      return data;
    },
    missing: function () {
      /*
          Missing can receive many keys as many arguments, like {"missing:[1,2]}
          Missing can also receive *one* argument that is an array of keys,
          which typically happens if it's actually acting on the output of another command
          (like 'if' or 'merge')
          */

      var missing = [];
      var keys = Array.isArray(arguments[0]) ? arguments[0] : arguments;

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = jsonLogic.apply({ var: key }, this);
        if (value === null || value === '') {
          missing.push(key);
        }
      }

      return missing;
    },
    missing_some: function (need_count, options) {
      // missing_some takes two arguments, how many (minimum) items must be present, and an array of keys (just like 'missing') to check for presence.
      var are_missing = jsonLogic.apply({ missing: options }, this);

      if (options.length - are_missing.length >= need_count) {
        return [];
      } else {
        return are_missing;
      }
    },
  };

  jsonLogic.is_logic = function (logic) {
    return (
      typeof logic === 'object' && // An object
      logic !== null && // but not null
      !Array.isArray(logic) && // and not an array
      Object.keys(logic).length === 1 &&
      !logic.type // with exactly one key
    );
  };

  /*
      This helper will defer to the JsonLogic spec as a tie-breaker when different language interpreters define different behavior for the truthiness of primitives.  E.g., PHP considers empty arrays to be falsy, but Javascript considers them to be truthy. JsonLogic, as an ecosystem, needs one consistent answer.

      Spec and rationale here: http://jsonlogic.com/truthy
      */
  jsonLogic.truthy = function (value) {
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return !!value;
  };

  jsonLogic.getOperator = function (logic) {
    return Object.keys(logic)[0];
  };

  jsonLogic.getValues = function (logic) {
    return logic[jsonLogic.getOperator(logic)];
  };

  jsonLogic.apply = function (logic, data) {
    // Does this array contain logic? Only one way to find out.
    if (Array.isArray(logic)) {
      return logic.map(function (l) {
        return jsonLogic.apply(l, data);
      });
    }
    // You've recursed to a primitive, stop!
    if (!jsonLogic.is_logic(logic)) {
      return logic;
    }

    var op = jsonLogic.getOperator(logic);
    var values = logic[op];
    var i;
    var current;
    var scopedLogic;
    var scopedData;
    var initial;

    // easy syntax for unary operators, like {"var" : "x"} instead of strict {"var" : ["x"]}
    if (!Array.isArray(values)) {
      values = [values];
    }

    // 'if', 'and', and 'or' violate the normal rule of depth-first calculating consequents, let each manage recursion as needed.
    if (op === 'if' || op == '?:') {
      /* 'if' should be called with a odd number of parameters, 3 or greater
          This works on the pattern:
          if( 0 ){ 1 }else{ 2 };
          if( 0 ){ 1 }else if( 2 ){ 3 }else{ 4 };
          if( 0 ){ 1 }else if( 2 ){ 3 }else if( 4 ){ 5 }else{ 6 };

          The implementation is:
          For pairs of values (0,1 then 2,3 then 4,5 etc)
          If the first evaluates truthy, evaluate and return the second
          If the first evaluates falsy, jump to the next pair (e.g, 0,1 to 2,3)
          given one parameter, evaluate and return it. (it's an Else and all the If/ElseIf were false)
          given 0 parameters, return NULL (not great practice, but there was no Else)
          */
      for (i = 0; i < values.length - 1; i += 2) {
        if (jsonLogic.truthy(jsonLogic.apply(values[i], data))) {
          return jsonLogic.apply(values[i + 1], data);
        }
      }
      if (values.length === i + 1) {
        return jsonLogic.apply(values[i], data);
      }
      return null;
    } else if (op === '$and') {
      // Return first falsy, or last
      for (i = 0; i < values.length; i += 1) {
        current = jsonLogic.apply(values[i], data);
        if (!jsonLogic.truthy(current)) {
          return current;
        }
      }
      return current; // Last
    } else if (op === 'or') {
      // Return first truthy, or last
      for (i = 0; i < values.length; i += 1) {
        current = jsonLogic.apply(values[i], data);
        if (jsonLogic.truthy(current)) {
          return current;
        }
      }
      return current; // Last
    } else if (op === 'filter') {
      scopedData = jsonLogic.apply(values[0], data);
      scopedLogic = values[1];

      if (!Array.isArray(scopedData)) {
        return [];
      }
      // Return only the elements from the array in the first argument,
      // that return truthy when passed to the logic in the second argument.
      // For parity with JavaScript, reindex the returned array
      return scopedData.filter(function (datum) {
        return jsonLogic.truthy(jsonLogic.apply(scopedLogic, datum));
      });
    } else if (op === 'map') {
      scopedData = jsonLogic.apply(values[0], data);
      scopedLogic = values[1];

      if (!Array.isArray(scopedData)) {
        return [];
      }

      return scopedData.map(function (datum) {
        return jsonLogic.apply(scopedLogic, datum);
      });
    } else if (op === 'reduce') {
      scopedData = jsonLogic.apply(values[0], data);
      scopedLogic = values[1];
      initial = typeof values[2] !== 'undefined' ? values[2] : null;

      if (!Array.isArray(scopedData)) {
        return initial;
      }

      return scopedData.reduce(function (accumulator, current) {
        return jsonLogic.apply(scopedLogic, { current: current, accumulator: accumulator });
      }, initial);
    } else if (op === 'all') {
      scopedData = jsonLogic.apply(values[0], data);
      scopedLogic = values[1];
      // All of an empty set is false. Note, some and none have correct fallback after the for loop
      if (!Array.isArray(scopedData) || !scopedData.length) {
        return false;
      }
      for (i = 0; i < scopedData.length; i += 1) {
        if (!jsonLogic.truthy(jsonLogic.apply(scopedLogic, scopedData[i]))) {
          return false; // First falsy, short circuit
        }
      }
      return true; // All were truthy
    } else if (op === 'none') {
      scopedData = jsonLogic.apply(values[0], data);
      scopedLogic = values[1];

      if (!Array.isArray(scopedData) || !scopedData.length) {
        return true;
      }
      for (i = 0; i < scopedData.length; i += 1) {
        if (jsonLogic.truthy(jsonLogic.apply(scopedLogic, scopedData[i]))) {
          return false; // First truthy, short circuit
        }
      }
      return true; // None were truthy
    } else if (op === 'some') {
      scopedData = jsonLogic.apply(values[0], data);
      scopedLogic = values[1];

      if (!Array.isArray(scopedData) || !scopedData.length) {
        return false;
      }
      for (i = 0; i < scopedData.length; i += 1) {
        if (jsonLogic.truthy(jsonLogic.apply(scopedLogic, scopedData[i]))) {
          return true; // First truthy, short circuit
        }
      }
      return false; // None were truthy
    }
    // Everyone else gets immediate depth-first recursion
    values = values.map(function (val) {
      return jsonLogic.apply(val, data);
    });

    // The operation is called with "data" bound to its "this" and "values" passed as arguments.
    // Structured commands like % or > can name formal arguments while flexible commands (like missing or merge) can operate on the pseudo-array arguments
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
    if (operations.hasOwnProperty(op) && typeof operations[op] === 'function') {
      return operations[op].apply(data, values);
    } else if (op.indexOf('.') > 0) {
      // Contains a dot, and not in the 0th position
      var sub_ops = String(op).split('.');
      var operation = operations;
      for (i = 0; i < sub_ops.length; i++) {
        if (!operation.hasOwnProperty(sub_ops[i])) {
          throw new Error('Unrecognized operation ' + op + ' (failed at ' + sub_ops.slice(0, i + 1).join('.') + ')');
        }
        // Descending into operations
        operation = operation[sub_ops[i]];
      }
      return operation.apply(data, values);
    }
    throw new Error('Unrecognized operation ' + op);
  };

  jsonLogic.uses_data = function (logic) {
    var collection = [];

    if (jsonLogic.is_logic(logic)) {
      var op = jsonLogic.getOperator(logic);
      var values = logic[op];

      if (!Array.isArray(values)) {
        values = [values];
      }

      if (op === 'var') {
        // This doesn't cover the case where the arg to var is itself a rule.
        collection.push(values[0]);
      } else {
        // Recursion!
        values.forEach(function (val) {
          collection.push.apply(collection, jsonLogic.uses_data(val));
        });
      }
    }

    return arrayUnique(collection);
  };

  jsonLogic.addOperation = function (name, code) {
    operations[name] = code;
  };

  jsonLogic.rmOperation = function (name) {
    delete operations[name];
  };

  jsonLogic.rule_like = function (rule, pattern) {
    // console.log("Is ". JSON.stringify(rule) . " like " . JSON.stringify(pattern) . "?");
    if (pattern === rule) {
      return true;
    } // TODO : Deep object equivalency?
    if (pattern === '@') {
      return true;
    } // Wildcard!
    if (pattern === 'number') {
      return typeof rule === 'number';
    }
    if (pattern === 'string') {
      return typeof rule === 'string';
    }
    if (pattern === 'array') {
      // !logic test might be superfluous in JavaScript
      return Array.isArray(rule) && !jsonLogic.is_logic(rule);
    }

    if (jsonLogic.is_logic(pattern)) {
      if (jsonLogic.is_logic(rule)) {
        var pattern_op = jsonLogic.getOperator(pattern);
        var rule_op = jsonLogic.getOperator(rule);

        if (pattern_op === '@' || pattern_op === rule_op) {
          // echo "\nOperators match, go deeper\n";
          return jsonLogic.rule_like(jsonLogic.get_values(rule, false), jsonLogic.get_values(pattern, false));
        }
      }
      return false; // pattern is logic, rule isn't, can't be eq
    }

    if (Array.isArray(pattern)) {
      if (Array.isArray(rule)) {
        if (pattern.length !== rule.length) {
          return false;
        }
        /*
              Note, array order MATTERS, because we're using this array test logic to consider arguments, where order can matter. (e.g., + is commutative, but '-' or 'if' or 'var' are NOT)
            */
        for (var i = 0; i < pattern.length; i += 1) {
          // If any fail, we fail
          if (!jsonLogic.rule_like(rule[i], pattern[i])) {
            return false;
          }
        }
        return true; // If they *all* passed, we pass
      } else {
        return false; // Pattern is array, rule isn't
      }
    }

    // Not logic, not array, not a === match for rule.
    return false;
  };

  return jsonLogic;
}

function parseFullDate(dateStr) {
  if (dateStr.includes('T') && dateStr.endsWith('Z')) {
    // ISO 格式，包含时区（如 '2025-06-05T16:00:00.000Z'）
    return new Date(dateStr);
  }

  if (dateStr.includes(' ')) {
    // 有日期+时间（如 '2025-06-06 23:59:59'）
    return new Date(dateStr.replace(' ', 'T'));
  }

  // 只有日期（如 '2025-06-06'）
  return new Date(`${dateStr}T00:00:00`);
}

function parseMonth(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1);
}

function parseQuarter(dateStr) {
  const year = parseInt(dateStr.slice(0, 4));
  const quarter = parseInt(dateStr.slice(5, 6));
  const month = (quarter - 1) * 3;
  return new Date(year, month);
}

function parseYear(dateStr) {
  const year = parseInt(dateStr);
  return new Date(year, 0);
}

function parseDate(targetDateStr) {
  let dateStr = Array.isArray(targetDateStr) ? targetDateStr[1] ?? targetDateStr[0] : targetDateStr;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateStr)) {
    return new Date(dateStr);
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T'));
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // YYYY-MM-DD 格式
    return parseFullDate(dateStr);
  } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
    // YYYY-MM 格式
    return parseMonth(dateStr);
  } else if (/^\d{4}Q[1-4]$/.test(dateStr)) {
    // YYYYQn 格式
    return parseQuarter(dateStr);
  } else if (/^\d{4}$/.test(dateStr)) {
    // YYYY 格式
    return parseYear(dateStr);
  }

  return null;
}
