/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  RUNJS_TYPESCRIPT_LIB_FILE_NAMES,
  type RunJSTypeScriptLibFileName,
  type RunJSTypeScriptLibSource,
} from '@nocobase/runjs/client-v2';
import libDecorators from 'typescript/lib/lib.decorators.d.ts?raw';
import libDecoratorsLegacy from 'typescript/lib/lib.decorators.legacy.d.ts?raw';
import libDOM from 'typescript/lib/lib.dom.d.ts?raw';
import libDOMIterable from 'typescript/lib/lib.dom.iterable.d.ts?raw';
import libES5 from 'typescript/lib/lib.es5.d.ts?raw';
import libES2015 from 'typescript/lib/lib.es2015.d.ts?raw';
import libES2015Collection from 'typescript/lib/lib.es2015.collection.d.ts?raw';
import libES2015Core from 'typescript/lib/lib.es2015.core.d.ts?raw';
import libES2015Generator from 'typescript/lib/lib.es2015.generator.d.ts?raw';
import libES2015Iterable from 'typescript/lib/lib.es2015.iterable.d.ts?raw';
import libES2015Promise from 'typescript/lib/lib.es2015.promise.d.ts?raw';
import libES2015Proxy from 'typescript/lib/lib.es2015.proxy.d.ts?raw';
import libES2015Reflect from 'typescript/lib/lib.es2015.reflect.d.ts?raw';
import libES2015Symbol from 'typescript/lib/lib.es2015.symbol.d.ts?raw';
import libES2015SymbolWellKnown from 'typescript/lib/lib.es2015.symbol.wellknown.d.ts?raw';
import libES2016 from 'typescript/lib/lib.es2016.d.ts?raw';
import libES2016ArrayInclude from 'typescript/lib/lib.es2016.array.include.d.ts?raw';
import libES2017 from 'typescript/lib/lib.es2017.d.ts?raw';
import libES2017Intl from 'typescript/lib/lib.es2017.intl.d.ts?raw';
import libES2017Object from 'typescript/lib/lib.es2017.object.d.ts?raw';
import libES2017SharedMemory from 'typescript/lib/lib.es2017.sharedmemory.d.ts?raw';
import libES2017String from 'typescript/lib/lib.es2017.string.d.ts?raw';
import libES2017TypedArrays from 'typescript/lib/lib.es2017.typedarrays.d.ts?raw';
import libES2018 from 'typescript/lib/lib.es2018.d.ts?raw';
import libES2018AsyncGenerator from 'typescript/lib/lib.es2018.asyncgenerator.d.ts?raw';
import libES2018AsyncIterable from 'typescript/lib/lib.es2018.asynciterable.d.ts?raw';
import libES2018Intl from 'typescript/lib/lib.es2018.intl.d.ts?raw';
import libES2018Promise from 'typescript/lib/lib.es2018.promise.d.ts?raw';
import libES2018RegExp from 'typescript/lib/lib.es2018.regexp.d.ts?raw';
import libES2019 from 'typescript/lib/lib.es2019.d.ts?raw';
import libES2019Array from 'typescript/lib/lib.es2019.array.d.ts?raw';
import libES2019Intl from 'typescript/lib/lib.es2019.intl.d.ts?raw';
import libES2019Object from 'typescript/lib/lib.es2019.object.d.ts?raw';
import libES2019String from 'typescript/lib/lib.es2019.string.d.ts?raw';
import libES2019Symbol from 'typescript/lib/lib.es2019.symbol.d.ts?raw';
import libES2020 from 'typescript/lib/lib.es2020.d.ts?raw';
import libES2020BigInt from 'typescript/lib/lib.es2020.bigint.d.ts?raw';
import libES2020Date from 'typescript/lib/lib.es2020.date.d.ts?raw';
import libES2020Intl from 'typescript/lib/lib.es2020.intl.d.ts?raw';
import libES2020Number from 'typescript/lib/lib.es2020.number.d.ts?raw';
import libES2020Promise from 'typescript/lib/lib.es2020.promise.d.ts?raw';
import libES2020SharedMemory from 'typescript/lib/lib.es2020.sharedmemory.d.ts?raw';
import libES2020String from 'typescript/lib/lib.es2020.string.d.ts?raw';
import libES2020SymbolWellKnown from 'typescript/lib/lib.es2020.symbol.wellknown.d.ts?raw';

const sourceByFileName: Record<RunJSTypeScriptLibFileName, string> = {
  'lib.decorators.d.ts': libDecorators,
  'lib.decorators.legacy.d.ts': libDecoratorsLegacy,
  'lib.dom.d.ts': libDOM,
  'lib.dom.iterable.d.ts': libDOMIterable,
  'lib.es5.d.ts': libES5,
  'lib.es2015.d.ts': libES2015,
  'lib.es2015.collection.d.ts': libES2015Collection,
  'lib.es2015.core.d.ts': libES2015Core,
  'lib.es2015.generator.d.ts': libES2015Generator,
  'lib.es2015.iterable.d.ts': libES2015Iterable,
  'lib.es2015.promise.d.ts': libES2015Promise,
  'lib.es2015.proxy.d.ts': libES2015Proxy,
  'lib.es2015.reflect.d.ts': libES2015Reflect,
  'lib.es2015.symbol.d.ts': libES2015Symbol,
  'lib.es2015.symbol.wellknown.d.ts': libES2015SymbolWellKnown,
  'lib.es2016.d.ts': libES2016,
  'lib.es2016.array.include.d.ts': libES2016ArrayInclude,
  'lib.es2017.d.ts': libES2017,
  'lib.es2017.intl.d.ts': libES2017Intl,
  'lib.es2017.object.d.ts': libES2017Object,
  'lib.es2017.sharedmemory.d.ts': libES2017SharedMemory,
  'lib.es2017.string.d.ts': libES2017String,
  'lib.es2017.typedarrays.d.ts': libES2017TypedArrays,
  'lib.es2018.d.ts': libES2018,
  'lib.es2018.asyncgenerator.d.ts': libES2018AsyncGenerator,
  'lib.es2018.asynciterable.d.ts': libES2018AsyncIterable,
  'lib.es2018.intl.d.ts': libES2018Intl,
  'lib.es2018.promise.d.ts': libES2018Promise,
  'lib.es2018.regexp.d.ts': libES2018RegExp,
  'lib.es2019.d.ts': libES2019,
  'lib.es2019.array.d.ts': libES2019Array,
  'lib.es2019.intl.d.ts': libES2019Intl,
  'lib.es2019.object.d.ts': libES2019Object,
  'lib.es2019.string.d.ts': libES2019String,
  'lib.es2019.symbol.d.ts': libES2019Symbol,
  'lib.es2020.d.ts': libES2020,
  'lib.es2020.bigint.d.ts': libES2020BigInt,
  'lib.es2020.date.d.ts': libES2020Date,
  'lib.es2020.intl.d.ts': libES2020Intl,
  'lib.es2020.number.d.ts': libES2020Number,
  'lib.es2020.promise.d.ts': libES2020Promise,
  'lib.es2020.sharedmemory.d.ts': libES2020SharedMemory,
  'lib.es2020.string.d.ts': libES2020String,
  'lib.es2020.symbol.wellknown.d.ts': libES2020SymbolWellKnown,
};

export const runJSTypeScriptLibSources: RunJSTypeScriptLibSource[] = RUNJS_TYPESCRIPT_LIB_FILE_NAMES.map(
  (fileName) => ({
    fileName,
    content: sourceByFileName[fileName],
  }),
);
