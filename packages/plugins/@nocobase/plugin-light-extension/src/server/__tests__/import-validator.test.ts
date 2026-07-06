/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension import and API validator', () => {
  it('rejects forbidden imports and globals with located diagnostics', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            "import React from 'react';",
            "import fs = require('fs');",
            "export * from 'react';",
            "const fs = require('fs');",
            "import('./lazy');",
            'process.env.NODE_ENV;',
            'globalThis.process.env.NODE_ENV;',
            'const proc = globalThis.process;',
            'const evil = globalThis.eval;',
            'const winEval = window["eval"];',
            'const Fn = window.Function;',
            'self.eval("1 + 1");',
            'self.Function("return 1");',
            'Reflect.get(self, "eval")("1 + 1");',
            'const s = self;',
            's.eval("1 + 1");',
            'const windowFromGlobal = globalThis.window;',
            'windowFromGlobal.eval("1 + 1");',
            'const selfFromWindow = window.self;',
            'selfFromWindow.Function("return 1");',
            'Reflect.get(globalThis, "window").eval("1 + 1");',
            'const reflectedWindow = Reflect.get(globalThis, "window");',
            'reflectedWindow.eval("1 + 1");',
            'Reflect.get(window, "self").Function("return 1");',
            'const { process: proc2, Function: Fn2, eval: evil2 } = globalThis;',
            'eval("1 + 1");',
            'window.eval("1 + 1");',
            'new Function("return 1");',
            'globalThis.Function("return 1");',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'import_not_allowed',
        'require_not_allowed',
        'dynamic_import_not_allowed',
        'blocked_global_api',
      ]),
    );
    expect(
      result.diagnostics
        .filter((item) => ['import_not_allowed', 'require_not_allowed', 'blocked_global_api'].includes(item.code))
        .every((item) => item.path === 'src/client/js-blocks/sales-kpi/index.tsx' && item.line && item.column),
    ).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toHaveLength(3);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api').length).toBeGreaterThanOrEqual(23);
  });

  it('rejects simple aliases for forbidden globals and require', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'const g = globalThis;',
            'g.eval("1 + 1");',
            'const e = eval;',
            'e("1 + 1");',
            'const F = Function;',
            'new F("return 1");',
            'const req = require;',
            'req("fs");',
            'globalThis["ev" + "al"]("1 + 1");',
            'const w = window;',
            'w.Function("return 1");',
            'let assignedGlobal;',
            'assignedGlobal = globalThis;',
            'assignedGlobal.eval("1 + 1");',
            'let assignedRequire;',
            'assignedRequire = require;',
            'assignedRequire("fs");',
            'let AssignedFunction;',
            'AssignedFunction = Function;',
            'new AssignedFunction("return 1");',
            'const { ["eval"]: computedEval, ["Function"]: computedFunction, ["process"]: computedProcess } = globalThis;',
            'computedEval("1 + 1");',
            'new computedFunction("return 1");',
            'computedProcess.env.NODE_ENV;',
            '(()=>0).constructor("return globalThis")().eval("1 + 1");',
            '[].filter.constructor("return 1")();',
            'const ConstructorAlias = (()=>0).constructor;',
            'ConstructorAlias("return 1")();',
            'Function.call(null, "return 1")();',
            'Function.bind(null, "return 1")();',
            'eval.call(null, "1 + 1");',
            '[].filter.constructor.call(null, "return 1")();',
            'let assignedEvalFromDestructure;',
            '({ ["eval"]: assignedEvalFromDestructure } = globalThis);',
            'assignedEvalFromDestructure("1 + 1");',
            'let assignedFunctionFromDestructure;',
            '({ ["Function"]: assignedFunctionFromDestructure } = globalThis);',
            'new assignedFunctionFromDestructure("return 1");',
            'let assignedProcessFromDestructure;',
            '({ ["process"]: assignedProcessFromDestructure } = globalThis);',
            'assignedProcessFromDestructure.env.NODE_ENV;',
            'Reflect.get(globalThis, "eval")("1 + 1");',
            'Reflect.get(globalThis, "Function")("return 1")();',
            'Reflect.get(globalThis, "process").env.NODE_ENV;',
            'const reflectedFunction = Reflect["get"](globalThis, "Function");',
            'new reflectedFunction("return 1");',
            'Reflect.get((()=>0), "constructor")("return 1")();',
            'Reflect["get"]((()=>0), "constructor")("return 1")();',
            'const reflectGet = Reflect.get;',
            'reflectGet(globalThis, "eval")("1 + 1");',
            'reflectGet(globalThis, "Function")("return 1")();',
            'reflectGet(globalThis, "process").env.NODE_ENV;',
            'reflectGet((()=>0), "constructor")("return 1")();',
            'const { get: destructuredReflectGet } = Reflect;',
            'destructuredReflectGet(globalThis, "eval")("1 + 1");',
            'let assignedReflectGet;',
            '({ get: assignedReflectGet } = Reflect);',
            'assignedReflectGet(globalThis, "process").env.NODE_ENV;',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'require_not_allowed').length).toBeGreaterThanOrEqual(4);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api').length).toBeGreaterThanOrEqual(36);
  });

  it('rejects higher-order Reflect.get, computed globals, and require call helpers', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'Reflect.get.call(Reflect, globalThis, "eval")("1 + 1");',
            'Reflect.get.apply(Reflect, [globalThis, "Function"])("return 1")();',
            'Reflect.get.bind(Reflect)(globalThis, "process").env.NODE_ENV;',
            'Reflect.get(Reflect, "get")((()=>0), "constructor")("return 1")();',
            'globalThis[`ev${"al"}`]("1 + 1");',
            'Reflect.get(globalThis, `ev${"al"}`)("1 + 1");',
            'require.call(null, "fs");',
            'require.apply(null, ["fs"]);',
            'globalThis.require("fs");',
            'globalThis.require.call(null, "fs");',
            'Reflect.get(globalThis, "require")("fs");',
            'const reflectedRequire = Reflect.get(globalThis, "require");',
            'reflectedRequire("fs");',
            'const reflectedRequireGet = Reflect.get;',
            'reflectedRequireGet(globalThis, "require")("fs");',
            'Reflect.apply(require, null, ["fs"]);',
            'Reflect.apply(globalThis.require, null, ["fs"]);',
            'Reflect.apply(Reflect.get(globalThis, "require"), null, ["fs"]);',
            'const requireList = [require];',
            'requireList[0]("fs");',
            '(0, require)("fs");',
            'const { require: reqFromGlobal } = globalThis;',
            'reqFromGlobal("fs");',
            'const requireCall = require.call;',
            'requireCall(null, "fs");',
            'const { call: requireCallFromFunction } = require;',
            'requireCallFromFunction(null, "fs");',
            'const reflectedRequireCall = globalThis.require.call;',
            'reflectedRequireCall(null, "fs");',
            'const reflectGetCall = Reflect.get.call;',
            'reflectGetCall(Reflect, globalThis, "eval")("1 + 1");',
            'const { call: destructuredReflectGetCall } = Reflect.get;',
            'destructuredReflectGetCall(Reflect, globalThis, "Function")("return 1")();',
            'let assignedReflectGetApply;',
            '({ apply: assignedReflectGetApply } = Reflect.get);',
            'assignedReflectGetApply(Reflect, [globalThis, "process"]).env.NODE_ENV;',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'require_not_allowed').length).toBeGreaterThanOrEqual(16);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api').length).toBeGreaterThanOrEqual(9);
  });

  it('rejects helper aliases and containerized forbidden references as error diagnostics', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'const requireCall = require.call;',
            'requireCall(null, "fs");',
            'const { call: requireCallFromFunction } = require;',
            'requireCallFromFunction(null, "fs");',
            'const reflectGetCall = Reflect.get.call;',
            'reflectGetCall(Reflect, globalThis, "eval")("1 + 1");',
            'const { call: destructuredReflectGetCall } = Reflect.get;',
            'destructuredReflectGetCall(Reflect, globalThis, "Function")("return 1")();',
            'const box = { req: require, get: Reflect.get };',
            'box.req("fs");',
            'box.get(globalThis, "eval")("1 + 1");',
            'const list = [require, Reflect.get];',
            'list[0]("fs");',
            'list[1](globalThis, "process").env.NODE_ENV;',
            'function run(req = require, get = Reflect.get) {',
            '  req("fs");',
            '  get(globalThis, "eval")("1 + 1");',
            '}',
          ].join('\n'),
        },
      ],
    });
    const blockingDiagnostics = result.diagnostics.filter((item) =>
      ['require_not_allowed', 'blocked_global_api'].includes(item.code),
    );

    expect(result.accepted).toBe(false);
    expect(blockingDiagnostics.length).toBeGreaterThanOrEqual(8);
    expect(blockingDiagnostics.every((item) => item.severity === 'error')).toBe(true);
  });

  it('rejects wrapper calls and object rest materialization for privileged roots', () => {
    const cases = [
      {
        name: 'wrapped global require',
        content: ['const id = (value) => value;', 'id(globalThis).require("fs");'].join('\n'),
        codes: ['blocked_global_api'],
      },
      {
        name: 'wrapped global eval',
        content: ['const id = (value) => value;', 'id(globalThis).eval("1 + 1");'].join('\n'),
        codes: ['blocked_global_api'],
      },
      {
        name: 'wrapped Reflect get',
        content: ['const id = (value) => value;', 'id(Reflect).get(globalThis, "eval")("1 + 1");'].join('\n'),
        codes: ['blocked_global_api'],
      },
      {
        name: 'Proxy global materialization',
        content: ['new Proxy(globalThis, {}).Function("return 1");'].join('\n'),
        codes: ['blocked_global_api'],
      },
      {
        name: 'global object rest binding',
        content: ['const { ...g } = globalThis;', 'g.require("fs");'].join('\n'),
        codes: ['blocked_global_api', 'require_not_allowed'],
      },
      {
        name: 'default parameter object rest binding',
        content: ['function run({ ...g } = globalThis) {', '  g.eval("1 + 1");', '}'].join('\n'),
        codes: ['blocked_global_api'],
      },
      {
        name: 'Reflect object rest binding',
        content: ['const { ...r } = Reflect;', 'r.get(globalThis, "eval")("1 + 1");'].join('\n'),
        codes: ['blocked_global_api'],
      },
      {
        name: 'global object rest assignment',
        content: ['let g;', '({ ...g } = globalThis);', 'g.Function("return 1");'].join('\n'),
        codes: ['blocked_global_api'],
      },
    ];

    for (const [index, item] of cases.entries()) {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: `src/client/js-blocks/wrapper-rest-case-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });
      const codes = result.diagnostics.map((diagnostic) => diagnostic.code);

      expect(result.accepted, item.name).toBe(false);
      expect(codes, item.name).toEqual(expect.arrayContaining(item.codes));
      expect(
        result.diagnostics
          .filter((diagnostic) => item.codes.includes(diagnostic.code))
          .every((diagnostic) => diagnostic.severity === 'error'),
        item.name,
      ).toBe(true);
    }
  });

  it('rejects global object aliases from destructuring, default params, and Reflect.get aliases', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'const { window: destructuredWindow } = globalThis;',
            'destructuredWindow.eval("1 + 1");',
            'let assignedSelfFromWindow;',
            '({ self: assignedSelfFromWindow } = window);',
            'assignedSelfFromWindow.Function("return 1");',
            'function run({ window: parameterWindow } = globalThis) {',
            '  parameterWindow.eval("1 + 1");',
            '}',
            'const getGlobalAlias = Reflect.get;',
            'const reflectedAliasWindow = getGlobalAlias(globalThis, "window");',
            'reflectedAliasWindow.eval("1 + 1");',
          ].join('\n'),
        },
      ],
    });
    const blockingDiagnostics = result.diagnostics.filter((item) => item.code === 'blocked_global_api');

    expect(result.accepted).toBe(false);
    expect(blockingDiagnostics.length).toBeGreaterThanOrEqual(4);
    expect(blockingDiagnostics.every((item) => item.severity === 'error')).toBe(true);
  });

  it('rejects materialized global objects and descriptor-extracted global APIs', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'const spreadBag = { ...globalThis };',
            'spreadBag.eval("1 + 1");',
            'spreadBag.process?.env?.NODE_ENV;',
            'const assignBag = Object.assign({}, globalThis);',
            'assignBag.eval("1 + 1");',
            'const evalRef = Object.getOwnPropertyDescriptor(globalThis, "eval")?.value;',
            'evalRef?.("1 + 1");',
            'const processRef = Object.getOwnPropertyDescriptor(globalThis, "process")?.value;',
            'processRef?.env?.NODE_ENV;',
            'const requireRef = Object.getOwnPropertyDescriptor(globalThis, "require")?.value;',
            'requireRef?.("fs");',
            'const descriptors = Object.getOwnPropertyDescriptors(globalThis);',
            'const functionDescriptor = descriptors.Function;',
            'const Fn = functionDescriptor.value;',
            'new Fn("return 1");',
            'const descriptorEval = Object.getOwnPropertyDescriptors(globalThis).eval.value;',
            'descriptorEval("1 + 1");',
            'const reflectedDescriptorValue = Reflect.get(Object.getOwnPropertyDescriptor(globalThis, "eval"), "value");',
            'reflectedDescriptorValue("1 + 1");',
            'function runDefaultGlobal(defaultGlobal = globalThis) {',
            '  defaultGlobal.eval("1 + 1");',
            '}',
            'const [arrayGlobal] = [globalThis];',
            'arrayGlobal.eval("1 + 1");',
            'function runArrayParam([paramGlobal] = [globalThis]) {',
            '  paramGlobal.eval("1 + 1");',
            '}',
            'function runDefaultDescriptor(defaultDescriptor = Object.getOwnPropertyDescriptor(globalThis, "eval")) {',
            '  defaultDescriptor?.value?.("1 + 1");',
            '}',
            'const [arrayDescriptor] = [Object.getOwnPropertyDescriptor(globalThis, "eval")];',
            'arrayDescriptor.value("1 + 1");',
            'const spreadDescriptor = { ...Object.getOwnPropertyDescriptor(globalThis, "eval") };',
            'spreadDescriptor.value("1 + 1");',
            'const assignDescriptor = Object.assign({}, Object.getOwnPropertyDescriptor(globalThis, "eval"));',
            'assignDescriptor.value("1 + 1");',
            'const spreadDescriptors = { ...Object.getOwnPropertyDescriptors(globalThis) };',
            'spreadDescriptors.eval.value("1 + 1");',
            'const assignDescriptors = Object.assign({}, Object.getOwnPropertyDescriptors(globalThis));',
            'assignDescriptors.eval.value("1 + 1");',
            'let logicalGlobal;',
            'logicalGlobal ??= globalThis;',
            'logicalGlobal.eval("1 + 1");',
            'let logicalDescriptor;',
            'logicalDescriptor ||= Object.getOwnPropertyDescriptor(globalThis, "eval");',
            'logicalDescriptor.value("1 + 1");',
            'let logicalDescriptors;',
            'logicalDescriptors &&= Object.getOwnPropertyDescriptors(globalThis);',
            'logicalDescriptors.eval.value("1 + 1");',
            'let defaultGlobal;',
            '({ defaultGlobal = globalThis } = {});',
            'defaultGlobal.eval("1 + 1");',
            'let defaultDescriptor;',
            '({ defaultDescriptor = Object.getOwnPropertyDescriptor(globalThis, "eval") } = {});',
            'defaultDescriptor.value("1 + 1");',
            'let defaultDescriptors;',
            '({ defaultDescriptors = Object.getOwnPropertyDescriptors(globalThis) } = {});',
            'defaultDescriptors.eval.value("1 + 1");',
            'const memberBox = {};',
            'memberBox.win = globalThis;',
            'memberBox.win.eval("1 + 1");',
            'memberBox.logicalWin ??= globalThis;',
            'memberBox.logicalWin.eval("1 + 1");',
            '[memberBox.arrayWin] = [globalThis];',
            'memberBox.arrayWin.eval("1 + 1");',
            '({ window: memberBox.destructuredWin } = globalThis);',
            'memberBox.destructuredWin.eval("1 + 1");',
            'memberBox.desc = Object.getOwnPropertyDescriptor(globalThis, "eval");',
            'memberBox.desc.value("1 + 1");',
            'memberBox.descs = Object.getOwnPropertyDescriptors(globalThis);',
            'memberBox.descs.eval.value("1 + 1");',
            'memberBox["elementWin"] = globalThis;',
            'memberBox.elementWin.eval("1 + 1");',
            'const commaGlobal = (0, globalThis);',
            'commaGlobal.eval("1 + 1");',
            'memberBox.commaWin = (0, globalThis);',
            'memberBox.commaWin.eval("1 + 1");',
            'memberBox.commaDesc = (0, Object.getOwnPropertyDescriptor(globalThis, "eval"));',
            'memberBox.commaDesc.value("1 + 1");',
            'const { window: literalGlobal } = { window: globalThis };',
            'literalGlobal.eval("1 + 1");',
            'const holder = { window: globalThis };',
            '({ window: memberBox.fromHolder } = holder);',
            'memberBox.fromHolder.eval("1 + 1");',
            'Object.assign(memberBox, { assignedDesc: Object.getOwnPropertyDescriptor(globalThis, "eval") });',
            'memberBox.assignedDesc.value("1 + 1");',
            'Object.defineProperty(memberBox, "definedWin", { value: globalThis });',
            'memberBox.definedWin.eval("1 + 1");',
            'Object.defineProperties(memberBox, { definedEval: { value: Object.getOwnPropertyDescriptor(globalThis, "eval").value } });',
            'memberBox.definedEval("1 + 1");',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'require_not_allowed').length).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api').length).toBeGreaterThanOrEqual(44);
    expect(
      result.diagnostics
        .filter((item) => ['require_not_allowed', 'blocked_global_api'].includes(item.code))
        .every((item) => item.severity === 'error'),
    ).toBe(true);
  });

  it('rejects method-based container writes and function-returned forbidden references', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'const arrayBox = [];',
            'arrayBox.push(globalThis);',
            'arrayBox[0].eval("1 + 1");',
            'const reflectBox = {};',
            'Reflect.set(reflectBox, "desc", Object.getOwnPropertyDescriptor(globalThis, "eval"));',
            'reflectBox.desc.value("1 + 1");',
            'Object.defineProperty(reflectBox, "win", { get: () => globalThis });',
            'reflectBox.win.eval("1 + 1");',
            'const getterBox = { get desc() { return Object.getOwnPropertyDescriptor(globalThis, "eval"); } };',
            'getterBox.desc.value("1 + 1");',
            'const methodBox = { getGlobal() { return globalThis; } };',
            'methodBox.getGlobal().eval("1 + 1");',
            'const descriptorMethodBox = { getDescriptor() { return Object.getOwnPropertyDescriptor(globalThis, "Function"); } };',
            'new (descriptorMethodBox.getDescriptor().value)("return 1");',
            'const aliasMethodBox = { getGlobal() { const g = globalThis; return g; } };',
            'aliasMethodBox.getGlobal().eval("1 + 1");',
            'const aliasGetterBox = { get desc() { const d = Object.getOwnPropertyDescriptor(globalThis, "eval"); return d; } };',
            'aliasGetterBox.desc.value("1 + 1");',
            'const aliasDescriptorBox = {};',
            'Object.defineProperty(aliasDescriptorBox, "win", { get: () => { const g = globalThis; return g; } });',
            'aliasDescriptorBox.win.eval("1 + 1");',
            'const iifeArrayBox = [];',
            'iifeArrayBox.push((() => globalThis)());',
            'iifeArrayBox[0].eval("1 + 1");',
            'const iifeReflectBox = {};',
            'Reflect.set(iifeReflectBox, "desc", (() => Object.getOwnPropertyDescriptor(globalThis, "eval"))());',
            'iifeReflectBox.desc.value("1 + 1");',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api').length).toBeGreaterThanOrEqual(11);
    expect(result.diagnostics.every((item) => item.severity === 'error')).toBe(true);
  });

  it('rejects each function-return and container-IIFE bypass independently', () => {
    const cases = [
      {
        name: 'method alias return',
        content: [
          'const box = { getGlobal() { const g = globalThis; return g; } };',
          'box.getGlobal().eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'getter descriptor alias return',
        content: [
          'const box = { get desc() { const d = Object.getOwnPropertyDescriptor(globalThis, "eval"); return d; } };',
          'box.desc.value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'defineProperty getter alias return',
        content: [
          'const box = {};',
          'Object.defineProperty(box, "win", { get: () => { const g = globalThis; return g; } });',
          'box.win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'array push IIFE global return',
        content: ['const list = [];', 'list.push((() => globalThis)());', 'list[0].eval("1 + 1");'].join('\n'),
      },
      {
        name: 'Reflect.set IIFE descriptor return',
        content: [
          'const box = {};',
          'Reflect.set(box, "desc", (() => Object.getOwnPropertyDescriptor(globalThis, "eval"))());',
          'box.desc.value("1 + 1");',
        ].join('\n'),
      },
    ];

    for (const [index, item] of cases.entries()) {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: `src/client/js-blocks/bypass-case-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });

      expect(result.accepted, item.name).toBe(false);
      expect(
        result.diagnostics.some(
          (diagnostic) => diagnostic.severity === 'error' && diagnostic.code === 'blocked_global_api',
        ),
        item.name,
      ).toBe(true);
    }
  });

  it('rejects static-string dynamic property keys for forbidden global APIs', () => {
    const cases = [
      {
        name: 'computed eval key',
        content: ['const key = "eval";', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'computed constructor key',
        content: ['const key = "constructor";', '[].filter[key]("return globalThis")().eval("1 + 1");'].join('\n'),
      },
      {
        name: 'computed process key',
        content: ['const key = "process";', 'globalThis[key].env.NODE_ENV;'].join('\n'),
      },
      {
        name: 'computed Reflect.get member key',
        content: ['const key = "eval";', 'Reflect.get(globalThis, key)("1 + 1");'].join('\n'),
      },
      {
        name: 'computed constructor key alias',
        content: [
          'const key = "constructor";',
          'const ConstructorAlias = [].filter[key];',
          'ConstructorAlias("return globalThis")().eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed destructuring key',
        content: ['const key = "eval";', 'const { [key]: evalRef } = globalThis;', 'evalRef("1 + 1");'].join('\n'),
      },
      {
        name: 'conditional computed key',
        content: ['const key = true ? "safe" : "eval";', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'runtime joined eval key',
        content: ['const key = ["ev", "al"].join("");', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'runtime joined constructor key',
        content: [
          'const key = ["constructor"].join("");',
          'const ConstructorAlias = [].filter[key];',
          'ConstructorAlias("return globalThis")().eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime fromCharCode eval key',
        content: ['const key = String.fromCharCode(101, 118, 97, 108);', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'runtime computed destructuring key',
        content: ['const key = ["eval"].join("");', 'const { [key]: evalRef } = globalThis;', 'evalRef("1 + 1");'].join(
          '\n',
        ),
      },
      {
        name: 'runtime computed object assignment key',
        content: [
          'let evalRef;',
          'const key = ["ev", "al"].join("");',
          '({ [key]: evalRef } = globalThis);',
          'evalRef("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime computed object assignment require key',
        content: [
          'let requireRef;',
          'const key = ["require"].join("");',
          '({ [key]: requireRef } = globalThis);',
          'requireRef("fs");',
        ].join('\n'),
      },
      {
        name: 'runtime computed descriptor value binding',
        content: [
          'const key = ["value"].join("");',
          'const { [key]: evalRef } = Object.getOwnPropertyDescriptor(globalThis, "eval");',
          'evalRef("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime computed descriptor require binding',
        content: [
          'const key = ["value"].join("");',
          'const { [key]: requireRef } = Object.getOwnPropertyDescriptor(globalThis, "require");',
          'requireRef("fs");',
        ].join('\n'),
      },
      {
        name: 'descriptor key alias value call',
        content: ['const key = "eval";', 'Object.getOwnPropertyDescriptor(globalThis, key).value("1 + 1");'].join('\n'),
      },
      {
        name: 'Reflect descriptor value call',
        content: ['Reflect.getOwnPropertyDescriptor(globalThis, "eval").value("1 + 1");'].join('\n'),
      },
      {
        name: 'runtime descriptor key alias',
        content: [
          'const key = ["ev", "al"].join("");',
          'const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);',
          'descriptor.value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime Reflect.get global key',
        content: ['const key = ["ev", "al"].join("");', 'Reflect.get(globalThis, key)("1 + 1");'].join('\n'),
      },
      {
        name: 'computed Reflect method key require',
        content: ['const method = "get";', 'Reflect[method](globalThis, "require")("fs");'].join('\n'),
      },
      {
        name: 'global Reflect alias eval',
        content: ['const R = globalThis.Reflect;', 'R.get(globalThis, "eval")("1 + 1");'].join('\n'),
      },
      {
        name: 'computed Object descriptor method key eval',
        content: [
          'const method = "getOwnPropertyDescriptor";',
          'const evalRef = Object[method](globalThis, "eval").value;',
          'evalRef("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime Object descriptor method key eval',
        content: [
          'const method = ["getOwnPropertyDescriptor"].join("");',
          'Object[method](globalThis, "eval").value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Object constructor alias descriptor eval',
        content: ['const O = Object;', 'O.getOwnPropertyDescriptor(globalThis, "eval").value("1 + 1");'].join('\n'),
      },
      {
        name: 'global Object alias descriptor eval',
        content: [
          'const O = globalThis.Object;',
          'O.getOwnPropertyDescriptor(globalThis, "eval").value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'global Object direct descriptor eval',
        content: ['globalThis.Object.getOwnPropertyDescriptor(globalThis, "eval").value("1 + 1");'].join('\n'),
      },
      {
        name: 'Object constructor alias descriptor require',
        content: ['const O = Object;', 'O.getOwnPropertyDescriptor(globalThis, "require").value("fs");'].join('\n'),
      },
      {
        name: 'Object constructor alias descriptors object',
        content: ['const O = Object;', 'O.getOwnPropertyDescriptors(globalThis).eval.value("1 + 1");'].join('\n'),
      },
      {
        name: 'computed Object assign method key global materialization',
        content: ['const method = "assign";', 'const bag = Object[method]({}, globalThis);', 'bag.eval("1 + 1");'].join(
          '\n',
        ),
      },
      {
        name: 'Object create global prototype materialization',
        content: ['const bag = Object.create(globalThis);', 'bag.eval("1 + 1");'].join('\n'),
      },
      {
        name: 'Object descriptor call helper',
        content: ['Object.getOwnPropertyDescriptor.call(Object, globalThis, "eval").value("1 + 1");'].join('\n'),
      },
      {
        name: 'runtime Object descriptor call helper',
        content: [
          'const method = ["getOwnPropertyDescriptor"].join("");',
          'Object[method].call(Object, globalThis, "eval").value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Object create bind helper',
        content: ['Object.create.bind(Object)(globalThis).eval("1 + 1");'].join('\n'),
      },
      {
        name: 'runtime Object create alias helper',
        content: [
          'const method = ["create"].join("");',
          'const create = Object[method];',
          'create.call(Object, globalThis).eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime Object create method key',
        content: ['const method = ["create"].join("");', 'Object[method](globalThis).eval("1 + 1");'].join('\n'),
      },
      {
        name: 'Object setPrototypeOf global exposure',
        content: ['const box = {};', 'Object.setPrototypeOf(box, globalThis);', 'box.eval("1 + 1");'].join('\n'),
      },
      {
        name: 'Reflect setPrototypeOf call helper',
        content: [
          'const box = {};',
          'Reflect.setPrototypeOf.call(Reflect, box, globalThis);',
          'box.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Reflect apply Object descriptor method',
        content: [
          'function run() {',
          '  return Reflect.apply(Object.getOwnPropertyDescriptor, Object, arguments).value("1 + 1");',
          '}',
          'run(globalThis, "eval");',
        ].join('\n'),
      },
      {
        name: 'runtime Reflect apply Object descriptor method',
        content: [
          'function run() {',
          '  const method = ["getOwnPropertyDescriptor"].join("");',
          '  return Reflect.apply(Object[method], Object, arguments).value("1 + 1");',
          '}',
          'run(globalThis, "eval");',
        ].join('\n'),
      },
      {
        name: 'generic call helper Object descriptor method',
        content: [
          '[].filter.call.call(Object.getOwnPropertyDescriptor, Object, globalThis, "eval").value("1+1");',
        ].join('\n'),
      },
      {
        name: 'generic call helper Object setPrototypeOf method',
        content: [
          'const box = {};',
          '[].filter.call.call(Object.setPrototypeOf, Object, box, globalThis);',
          'box.eval("1+1");',
        ].join('\n'),
      },
      {
        name: 'Object constructor alias global materialization',
        content: ['const O = Object;', 'const bag = O.assign({}, globalThis);', 'bag.eval("1 + 1");'].join('\n'),
      },
      {
        name: 'global alias Object direct materialization',
        content: ['const g = globalThis;', 'g.Object.assign({}, globalThis).eval("1 + 1");'].join('\n'),
      },
      {
        name: 'Object static method alias descriptor eval',
        content: [
          'const getDescriptor = Object.getOwnPropertyDescriptor;',
          'getDescriptor(globalThis, "eval").value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Object descriptor value method alias',
        content: [
          'const getDescriptor = Object.getOwnPropertyDescriptor(Object, "getOwnPropertyDescriptor").value;',
          'getDescriptor(globalThis, "eval").value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'prototype constructor descriptor value',
        content: [
          'Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Object), "constructor")',
          '  .value("return globalThis")()',
          '  .eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed Reflect set method key global object write',
        content: [
          'const method = "set";',
          'const box = {};',
          'Reflect[method](box, "win", globalThis);',
          'box.win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed Reflect set and get method keys global alias write',
        content: [
          'const setMethod = "set";',
          'const getMethod = "get";',
          'const box = {};',
          'Reflect[setMethod](box, "win", Reflect[getMethod](globalThis, "window"));',
          'box.win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed Object descriptor method key member assignment',
        content: [
          'const method = "getOwnPropertyDescriptor";',
          'const box = {};',
          'box.desc = Object[method](globalThis, "eval");',
          'box.desc.value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed Object descriptor method key object literal storage',
        content: [
          'const method = "getOwnPropertyDescriptor";',
          'const box = { desc: Object[method](globalThis, "eval") };',
          'box.desc.value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed Reflect get method key member assignment',
        content: [
          'const method = "get";',
          'const box = {};',
          'box.win = Reflect[method](globalThis, "window");',
          'box.win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Reflect.get descriptor value alias',
        content: [
          'const get = Object.getOwnPropertyDescriptor(Reflect, "get").value;',
          'get(globalThis, "eval")("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Reflect descriptors value alias',
        content: [
          'const get = Object.getOwnPropertyDescriptors(Reflect).get.value;',
          'get(globalThis, "eval")("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'shadowed static string key parameter',
        content: ['const key = "safe";', 'function run(key) { globalThis[key]("1 + 1"); }', 'run("eval");'].join('\n'),
      },
      {
        name: 'inner static string key does not overwrite outer key',
        content: [
          'const key = ["ev", "al"].join("");',
          'function f() { const key = "safe"; }',
          'globalThis[key]("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'block assignment updates outer static key',
        content: ['let key = "safe";', '{ key = "eval"; }', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'block scoped static key does not overwrite outer key',
        content: ['let key = "eval";', '{ let key = "safe"; }', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'block scoped static key assignment does not overwrite outer key',
        content: ['let key = "eval";', '{ let key = "safe"; key = "safe2"; }', 'globalThis[key]("1 + 1");'].join('\n'),
      },
      {
        name: 'nested block assignment updates outer key despite inner shadowing',
        content: ['let key = "safe";', '{ { let key = "safe"; } key = "eval"; }', 'globalThis[key]("1 + 1");'].join(
          '\n',
        ),
      },
      {
        name: 'destructured block key assignment does not overwrite outer key',
        content: [
          'let key = "eval";',
          '{ let { key } = { key: "safe" }; key = "safe2"; }',
          'globalThis[key]("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'computed Reflect.get global alias key',
        content: ['const key = "window";', 'Reflect.get(globalThis, key).eval("1 + 1");'].join('\n'),
      },
      {
        name: 'descriptor value global alias',
        content: ['Object.getOwnPropertyDescriptor(globalThis, "window").value.eval("1 + 1");'].join('\n'),
      },
      {
        name: 'descriptor value global alias binding',
        content: [
          'const win = Object.getOwnPropertyDescriptor(globalThis, "window").value;',
          'win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'descriptors object global alias binding',
        content: [
          'const { window: descriptor } = Object.getOwnPropertyDescriptors(globalThis);',
          'descriptor.value.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'nested descriptors object global alias value binding',
        content: [
          'const { window: { value: win } } = Object.getOwnPropertyDescriptors(globalThis);',
          'win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'nested descriptors object global alias value assignment',
        content: [
          'let win;',
          '({ window: { value: win } } = Object.getOwnPropertyDescriptors(globalThis));',
          'win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'function-local nested descriptors global alias value return',
        content: [
          'function getWin() {',
          '  let win;',
          '  ({ window: { value: win } } = Object.getOwnPropertyDescriptors(globalThis));',
          '  return win;',
          '}',
          'getWin().eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'descriptors object from computed Reflect.get global alias',
        content: [
          'const key = "window";',
          'const descriptors = Object.getOwnPropertyDescriptors(Reflect.get(globalThis, key));',
          'descriptors.eval.value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'Reflect.get descriptors key alias',
        content: [
          'const key = "eval";',
          'const descriptor = Reflect.get(Object.getOwnPropertyDescriptors(globalThis), key);',
          'descriptor.value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime computed nested global binding',
        content: [
          'const key = ["ev", "al"].join("");',
          'const { window: { [key]: evalRef } } = globalThis;',
          'evalRef("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'runtime computed nested global assignment',
        content: [
          'let evalRef;',
          'const key = ["ev", "al"].join("");',
          '({ window: { [key]: evalRef } } = globalThis);',
          'evalRef("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'function-local computed global alias return',
        content: [
          'function getWindow() {',
          '  const key = "window";',
          '  const { [key]: win } = globalThis;',
          '  return win;',
          '}',
          'getWindow().eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'function-local computed descriptor return',
        content: [
          'function getEvalDescriptor() {',
          '  const key = "eval";',
          '  const { [key]: descriptor } = Object.getOwnPropertyDescriptors(globalThis);',
          '  return descriptor;',
          '}',
          'getEvalDescriptor().value("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'function-local computed object assignment return',
        content: [
          'function getEval() {',
          '  let evalRef;',
          '  const key = ["ev", "al"].join("");',
          '  ({ [key]: evalRef } = globalThis);',
          '  return evalRef;',
          '}',
          'getEval()("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'function-local computed descriptor value return',
        content: [
          'function getEval() {',
          '  const key = ["value"].join("");',
          '  const { [key]: evalRef } = Object.getOwnPropertyDescriptor(globalThis, "eval");',
          '  return evalRef;',
          '}',
          'getEval()("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'function-local computed nested global return',
        content: [
          'function getEval() {',
          '  const key = ["ev", "al"].join("");',
          '  const { window: { [key]: evalRef } } = globalThis;',
          '  return evalRef;',
          '}',
          'getEval()("1 + 1");',
        ].join('\n'),
      },
    ];

    for (const [index, item] of cases.entries()) {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: `src/client/js-blocks/dynamic-key-case-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });

      expect(result.accepted, item.name).toBe(false);
      expect(
        result.diagnostics.some((diagnostic) =>
          ['blocked_global_api', 'require_not_allowed'].includes(diagnostic.code),
        ),
        item.name,
      ).toBe(true);
    }
  });

  it('rejects conditional and logical expressions that can materialize forbidden references', () => {
    const cases = [
      {
        name: 'conditional function return',
        content: ['function getGlobal() { return true ? globalThis : {}; }', 'getGlobal().eval("1 + 1");'].join('\n'),
      },
      {
        name: 'conditional descriptor value',
        content: [
          'const box = {};',
          'Object.defineProperty(box, "win", { value: true ? globalThis : {} });',
          'box.win.eval("1 + 1");',
        ].join('\n'),
      },
      {
        name: 'conditional array write',
        content: ['const list = [];', 'list.push(true ? globalThis : {});', 'list[0].eval("1 + 1");'].join('\n'),
      },
      {
        name: 'conditional destructuring source',
        content: ['const { window: win } = true ? globalThis : {};', 'win.eval("1 + 1");'].join('\n'),
      },
      {
        name: 'logical alias source',
        content: ['const globalAlias = globalThis || {};', 'globalAlias.eval("1 + 1");'].join('\n'),
      },
    ];

    for (const [index, item] of cases.entries()) {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: `src/client/js-blocks/conditional-case-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });

      expect(result.accepted, item.name).toBe(false);
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'blocked_global_api'),
        item.name,
      ).toBe(true);
    }
  });

  it('rejects relative imports that leave the current entry root', () => {
    const cases = [
      {
        name: 'js-block imports disabled runjs source',
        content: 'import helper from "../../runjs/foo/index";\nexport default helper;\n',
      },
      {
        name: 'js-block imports another js-block entry',
        content: 'import helper from "../other-block/helper";\nexport default helper;\n',
      },
      {
        name: 'js-block re-exports another entry source',
        content: 'export * from "../other-block/helper";\nexport default function SalesKpi() { return null; }\n',
      },
      {
        name: 'js-block imports disabled js-field source',
        content: 'import field from "../../js-fields/foo/index";\nexport default field;\n',
      },
    ];

    for (const [index, item] of cases.entries()) {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: `src/client/js-blocks/import-boundary-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });

      expect(result.accepted, item.name).toBe(false);
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'import_not_allowed'),
        item.name,
      ).toBe(true);
    }
  });

  it('allows relative imports within the same entry root', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/local-import/index.tsx',
          content: [
            'import { helper } from "./helper";',
            'export { helper as localHelper } from "./helper";',
            'export default function LocalImport() { return helper(); }',
          ].join('\n'),
        },
        {
          path: 'src/client/js-blocks/local-import/helper.ts',
          content: 'export function helper() { return null; }\n',
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toHaveLength(0);
  });

  it('allows ordinary constructor property reads that are not executed', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'export default function SalesKpi(value) {',
            '  const constructorName = value.constructor.name;',
            '  return value.constructor === Array ? constructorName : "unknown";',
            '}',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
  });
});
