import path from 'path';
import { getPackageNameFromString, getPackagesFromFiles, getSourcePackages, getPackageJson, getPackageJsonPackages, checkSourcePackages, checkRequirePackageJson, checkEntryExists, isValidPackageName, checkDependencies, getFileSize, formatFileSize, checkPluginPrefixDependencies } from './buildPluginUtils'
import { expect, vitest } from 'vitest';

describe('buildPluginUtils', () => {
  it('isValidPackageName', () => {
    expect(isValidPackageName("my-package")).toBeTruthy()
    expect(isValidPackageName("123-package")).toBeTruthy()
    expect(isValidPackageName("my_package")).toBeTruthy()
    expect(isValidPackageName("@vendor/package")).toBeTruthy()
    expect(isValidPackageName("@scope/my-package")).toBeTruthy()
    expect(isValidPackageName("my@package")).toBeFalsy();
    expect(isValidPackageName("")).toBeFalsy();
  })

  describe('getPackageNameFromString', () => {
    it('should return package name', () => {
      expect(getPackageNameFromString('antd')).toEqual('antd')
    })
    it('should return package name with scope', () => {
      expect(getPackageNameFromString('@nocobase/plugin-antd')).toEqual('@nocobase/plugin-antd')
    })
    it('should return package name with file', () => {
      expect(getPackageNameFromString('antd/local/zh.json')).toEqual('antd')
    })
    it('should return package name with scope and file', () => {
      expect(getPackageNameFromString('@ant-design/icons/Loading.tsx')).toEqual('@ant-design/icons')
    })
    it('should return package name with string template', () => {
      expect(getPackageNameFromString('antd/local/${lang}')).toEqual('antd')
    })
    it('should return package name with scope and string template', () => {
      expect(getPackageNameFromString('@ant-design/icons/${lang}')).toEqual('@ant-design/icons')
    })
    it('should not return package name with var', () => {
      expect(getPackageNameFromString('${lang}')).toEqual(null)
      expect(getPackageNameFromString('${lang}/foo')).toEqual(null)
    })
    it('should not return package name with relative path', () => {
      expect(getPackageNameFromString('../package.json')).toEqual(null)
      expect(getPackageNameFromString('./foo/bar')).toEqual(null)
    })
  })

  describe('getPackagesFromFiles', () => {
    it('import packages', () => {
      const file = `
        import xxx from 'module-name0';
        import defaultExport from "module-name1";
        import * as name from "module-name2";
        import { export1 } from "module-name3";
        import { export1 as alias1 } from "module-name4";
        import { export1 , export2 } from "module-name5";
        import { foo , bar } from "module-name6/path/to/specific/un-exported/file";
        import defaultExport, * as name from "module-name7";
        import {
          a,
          b as lang,
        } from 'module-name8'
        import "module-name9";

        const a = 1;
        const b = 'foo';

        import myDefault from '/modules/my-module.js'
        import {
          reallyReallyLongModuleExportName as shortName,
          anotherLongModuleName as short
        } from '/modules/my-module.js'
      `
      expect(getPackagesFromFiles([file])).toEqual([
        'module-name0',
        'module-name1',
        'module-name2',
        'module-name3',
        'module-name4',
        'module-name5',
        'module-name6',
        'module-name7',
        'module-name8',
        'module-name9',
      ])
    })

    it('require packages', () => {
      const file = `
        const dayjs = require("dayjs");
        const { Button } = require('antd');
        const cloneDeep = require('lodash/cloneDeep')
        const { Form } = require('@formily/antd')
        const Loading = require('@ant-design/icons/Loading')
        const Github = require('@ant-design/icons/Github')
        require('systemjs')

        const lang = require(\`moment/locale/\${lang}\`)
        const foo = require('../foo')

        const packageJson = require('../package.json')
        const { getPackageNameFromString } = require('./buildPluginUtils')

        const file = './foo'
        const foo = require(file)
      `

      expect(getPackagesFromFiles([file])).toEqual(['dayjs', 'antd', 'lodash', '@formily/antd', '@ant-design/icons', 'systemjs', 'moment'])
    })

    it('import and require packages', () => {
      const file = `
        import dayjs from "dayjs";
        const { Button } = require('antd');
      `
      expect(getPackagesFromFiles([file])).toEqual(['dayjs', 'antd'])
    })

    it('multiple files', () => {
      const file1 = `
        import dayjs from "dayjs";
        import { Button } from 'antd';
      `

      const file2 = `
        import dayjs from "dayjs";
        import cloneDeep from 'lodash/cloneDeep'
        import { Form } from '@formily/antd'
      `

      expect(getPackagesFromFiles([file1, file2])).toEqual(['dayjs', 'antd', 'lodash', '@formily/antd'])
    })
  })

  it('getSourcePackages', () => {
    const res = getSourcePackages([
      path.join(__dirname, './fixtures/buildPluginUtils/getSourcePackages/file1'),
      path.join(__dirname, './fixtures/buildPluginUtils/getSourcePackages/file2'),
    ]);

    expect(res).toEqual(['react', 'dayjs', 'lodash', 'mock-axios', 'antd'])
  })

  it('getPackageJson', () => {
    const res = getPackageJson(path.join(__dirname, './fixtures/buildPluginUtils'));
    expect(res).toContain({
      "name": "@nocobase/plugin-xxx"
    })
  })

  it('getPackageJsonPackages', () => {
    const res = getPackageJsonPackages({
      devDependencies: {
        'dayjs': '1.0.0',
        'axios': '1.0.0',
      },
      dependencies: {
        'dayjs': '1.0.0',
        'antd': '1.0.0',
        'lodash': '1.0.0',
      }
    });
    expect(res).toEqual(['dayjs', 'axios', 'antd', 'lodash'])
  })

  describe('checkSourcePackages', () => {
    it('missingPackages', () => {
      const exit = process.exit;
      process.exit = vitest.fn();

      const srcPackages = ['dayjs', 'antd', 'lodash', 'react'];
      const packageJsonPackages = ['dayjs', 'antd'];
      const shouldDevDependencies = ['react'];
      const log = vitest.fn();
      checkSourcePackages(
        srcPackages,
        packageJsonPackages,
        shouldDevDependencies,
        log
      );

      expect(process.exit).toBeCalled();
      expect(log).toBeCalled()

      process.exit = exit;
    })

    it('no missingPackages', () => {
      const srcPackages = ['dayjs', 'antd', 'react'];
      const packageJsonPackages = ['dayjs', 'antd'];
      const shouldDevDependencies = ['react'];
      const log = vitest.fn();
      checkSourcePackages(
        srcPackages,
        packageJsonPackages,
        shouldDevDependencies,
        log
      );
      expect(log).not.toBeCalled();
    })
  })

  describe('checkRequirePackageJson', () => {
    it('case1: should throw error', () => {
      const exit = process.exit;
      process.exit = vitest.fn();

      const log = vitest.fn();
      checkRequirePackageJson([
        path.join(__dirname, './fixtures/buildPluginUtils/checkRequirePackageJson/file1')
      ], log);

      expect(process.exit).toBeCalled();
      expect(log).toBeCalled();

      process.exit = exit;
    })
    it('case2: should throw error', () => {
      const exit = process.exit;
      process.exit = vitest.fn();

      const log = vitest.fn();
      checkRequirePackageJson([
        path.join(__dirname, './fixtures/buildPluginUtils/checkRequirePackageJson/file2')
      ], log);

      expect(process.exit).toBeCalled();
      expect(log).toBeCalled();

      process.exit = exit;
    })

    it('should not throw error', () => {
      const file = path.join(__dirname, './fixtures/buildPluginUtils/checkRequirePackageJson/file3');
      const log = vitest.fn();
      checkRequirePackageJson([file], log);
      expect(log).not.toBeCalled();
    })
  })

  describe('checkEntryExists', () => {
    it('entry exists, should not throw error', () => {
      const exit = process.exit;
      process.exit = vitest.fn();

      const log = vitest.fn();
      checkEntryExists(path.join(__dirname, './fixtures/buildPluginUtils/checkEntryExists/exists'), 'client', log);
      checkEntryExists(path.join(__dirname, './fixtures/buildPluginUtils/checkEntryExists/exists'), 'server', log);

      expect(process.exit).not.toBeCalled();
      expect(log).not.toBeCalled();

      process.exit = exit;
    })
    it('entry not exists, should throw error', () => {
      const exit = process.exit;
      process.exit = vitest.fn();

      const log = vitest.fn();
      checkEntryExists(path.join(__dirname, './fixtures/buildPluginUtils/checkEntryExists/notExists'), 'client', log);

      expect(process.exit).toBeCalled();
      expect(log).toBeCalled();

      process.exit = exit;
    })
  })

  describe('checkDependencies', () => {
    it('has tip', () => {
      const log = vitest.fn();
      const packageJson = {
        dependencies: {
          'antd': '1.0.0',
          'dayjs': '1.0.0',
        }
      }
      const shouldDevDependencies = ['react', 'antd']
      checkDependencies(packageJson, shouldDevDependencies, log);
      expect(log).toBeCalled();
    })
    it('no tip', () => {
      const log = vitest.fn();
      const packageJson = {
        dependencies: {
          'lodash': '1.0.0',
          'dayjs': '1.0.0',
        }
      }
      const shouldDevDependencies = ['react', 'antd']
      checkDependencies(packageJson, shouldDevDependencies, log);
      expect(log).not.toBeCalled();
    })
  })

  describe('checkPluginPrefixDependencies', () => {
    it('has tip', () => {
      const log = vitest.fn();
      const packageJson = {
        dependencies: {
          'antd': '1.0.0',
          '@nocobase/plugin-aaa': '1.0.0',
        }
      }
      const pluginPrefix = ['@nocobase/plugin-']
      checkPluginPrefixDependencies(packageJson, pluginPrefix, log);
      expect(log).toBeCalled();
    })
    it('no tip', () => {
      const log = vitest.fn();
      const packageJson = {
        dependencies: {
          'lodash': '1.0.0',
          'dayjs': '1.0.0',
        }
      }
      const pluginPrefix = ['@nocobase/plugin-']
      checkPluginPrefixDependencies(packageJson, pluginPrefix, log);
      expect(log).not.toBeCalled();
    })
  })

  it('getFileSize', () => {
    expect(getFileSize(path.join(__dirname, './fixtures/buildPluginUtils/getFileSize'))).toMatchInlineSnapshot('1024')
  })

  it('formatFileSize', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB')
    expect(formatFileSize(100)).toBe('0.10 KB')
  })
})
