/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Collection } from '../../data-source';
import { FlowRuntimeContext } from '../../flowContext';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models';
import { RecordProxy } from '../../RecordProxy';
import { preprocessExpression, resolveExpressions } from '../params-resolvers';

/**
 * preprocessExpression 测试套件
 *
 * preprocessExpression 是表达式预处理器的核心函数，提供以下功能：
 *
 * 1. **路径解析与分类**
 *    - 识别单层路径（ctx.user）和多层路径（ctx.user.name）
 *    - 排除函数调用（ctx.method()）避免误处理
 *    - 批量收集所有需要处理的路径表达式
 *
 * 2. **RecordProxy 检测**
 *    - 检测一层路径是否为 RecordProxy 实例
 *    - 对 RecordProxy 深层路径添加双重 await 优化数据库查询
 *    - 对普通对象路径仅在第一层添加 await
 *
 * 3. **字符串预处理与优化**
 *    - 在保持表达式计算顺序的前提下插入必要的 await
 *    - 使用精确的正则替换避免误替换类似路径
 *    - 支持复杂表达式中的混合路径处理
 *
 * 测试结构：
 * - 基础路径处理: 单层、多层路径的 await 插入
 * - RecordProxy 优化: RecordProxy 实例的双重 await 处理
 * - 复杂表达式支持: 运算符、方法调用等混合场景
 * - 边界情况处理: 函数调用排除、路径冲突处理
 */
describe('preprocessExpression', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let ctx: FlowRuntimeContext;
  let postsCollection: Collection;
  let usersCollection: Collection;
  let profilesCollection: Collection;

  beforeEach(() => {
    // 创建真实的流程引擎环境
    engine = new FlowEngine();
    model = new FlowModel({
      uid: 'test-model',
      flowEngine: engine,
    });
    ctx = new FlowRuntimeContext(model, 'test-flow', 'runtime');

    // 获取数据源管理器并创建集合定义
    const dataSourceManager = engine.context.dataSourceManager;
    const dataSource = dataSourceManager.getDataSource('main');

    // 创建完整的集合定义（参考 RecordProxy.test.ts）
    postsCollection = new Collection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'title', type: 'string' },
        { name: 'author', type: 'belongsTo', target: 'users' }, // to-one
        { name: 'comments', type: 'hasMany', target: 'comments' }, // to-many
      ],
    });

    usersCollection = new Collection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'profile', type: 'hasOne', target: 'profiles' }, // to-one
        { name: 'posts', type: 'hasMany', target: 'posts' }, // to-many
      ],
    });

    profilesCollection = new Collection({
      name: 'profiles',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'bio', type: 'string' },
        { name: 'avatar', type: 'string' },
      ],
    });

    // 将集合添加到数据源
    dataSource.addCollection(postsCollection);
    dataSource.addCollection(usersCollection);
    dataSource.addCollection(profilesCollection);

    // 设置测试上下文数据
    ctx.defineProperty('user', {
      value: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
    });
    ctx.defineProperty('config', {
      value: {
        theme: 'dark',
        debug: true,
      },
    });
    ctx.defineProperty('count', { value: 42 });
    ctx.defineProperty('items', {
      value: [
        { name: 'Item 1', type: 'A' },
        { name: 'Item 2', type: 'B' },
      ],
    });

    // 创建 RecordProxy 实例（参考 RecordProxy.test.ts）
    const mockRecord = {
      id: 1,
      title: 'Test Post',
      author: {
        id: 10,
        name: 'Author Name',
      },
    };

    const recordProxy = new RecordProxy(mockRecord, postsCollection, model.context);
    ctx.defineProperty('recordAsync', { get: () => recordProxy });
    ctx.defineProperty('recordProxyAsync', { get: async () => recordProxy });
    // 创建用户 RecordProxy
    const userRecord = {
      id: 10,
      name: 'User Name',
      profile: {
        id: 100,
        bio: 'User Bio',
      },
    };
    const userProxy = new RecordProxy(userRecord, usersCollection, model.context);
    ctx.defineProperty('userProxy', { get: () => userProxy });

    // Mock APIClient request method
    const mockApiRequest = vi.fn();
    model.context.defineProperty('api', {
      get: () => ({
        request: mockApiRequest,
      }),
    });
  });

  /**
   * 基础路径处理功能测试组
   *
   * 测试 preprocessExpression 的核心路径识别和 await 插入功能
   * 验证单层和多层路径的正确处理
   */
  describe('Basic path processing', () => {
    /**
     * 测试无 ctx 路径表达式的直接返回
     * 场景：传入不包含 ctx 路径的纯计算表达式
     * 预期：直接返回原表达式，不进行任何处理
     */
    test('should directly return expressions without ctx paths', async () => {
      const expression = '1 + 2 * 3';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('1 + 2 * 3');
    });

    /**
     * 测试单层 ctx 路径的 await 插入
     * 场景：处理 ctx.user、ctx.config 等单层属性访问
     * 预期：在单层路径前添加 await，变成 await ctx.user
     */
    test('should add await for single-layer ctx paths', async () => {
      const expression = 'ctx.user';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('await ctx.user');
    });

    /**
     * 测试多层 ctx 路径的分步 await 插入
     * 场景：处理 ctx.user.name、ctx.config.theme 等多层属性访问
     * 预期：在第一层添加 await，变成 (await ctx.user).name
     */
    test('should add await to the first layer of multi-layer ctx paths', async () => {
      // 多层路径 - 输入: 'ctx.user.name', 输出: '(await ctx.user).name'
      const expression = 'ctx.user.name';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('(await ctx.user).name');
    });

    /**
     * 测试深层嵌套路径的正确处理
     * 场景：处理 ctx.user.profile.avatar 等深层嵌套访问
     * 预期：仅在第一层添加 await，保持后续访问的同步性
     */
    test('should correctly handle deeply nested paths', async () => {
      // 深层嵌套 - 输入: 'ctx.user.profile.avatar', 输出: '(await ctx.user).profile.avatar'
      const expression = 'ctx.user.profile.avatar';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('(await ctx.user).profile.avatar');
    });
  });

  /**
   * RecordProxy 功能测试组
   *
   * 测试针对 RecordProxy 实例的特殊优化处理
   * 验证双重 await 插入表达式
   */
  describe('RecordProxy', () => {
    /**
     * 测试 RecordProxy 实例会自动添加双重 await
     * 场景：访问 RecordProxy 的深层关联数据，如 ctx.recordAsync.author.name
     * 预期：添加双重 await，变成 await (await ctx.recordAsync).author.name
     */
    test('should add double await for RecordProxy deep paths', async () => {
      const expression = 'ctx.recordAsync.author.name';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('await (await ctx.recordAsync).author.name');
    });

    /**
     * 测试 RecordProxy 单层访问的标准 await 处理
     * 场景：直接访问 RecordProxy 实例本身，如 ctx.recordAsync
     * 预期：添加单个 await，变成 await ctx.recordAsync
     */
    test('should add single await for RecordProxy single-layer paths', async () => {
      const expression = 'ctx.recordAsync';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('await ctx.recordAsync');
    });

    /**
     * 测试混合 RecordProxy 和普通对象的差异化处理
     * 场景：同一表达式中同时包含 RecordProxy 路径和普通对象路径
     * 预期：RecordProxy 路径使用双重 await，普通对象路径使用单个 await
     */
    test('should distinguish different handling methods for RecordProxy and regular objects', async () => {
      // 混合路径类型 - RecordProxy使用双重await，普通对象使用单个await'
      const expression = 'ctx.recordAsync.author.name + ctx.user.name';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('await (await ctx.recordAsync).author.name + (await ctx.user).name');
    });

    test('should handle async proxy', async () => {
      const expression = 'ctx.recordProxyAsync.author.name + ctx.user.name';
      const result = await preprocessExpression(expression, ctx);
      expect(result).toBe('await (await ctx.recordProxyAsync).author.name + (await ctx.user).name');
    });
  });

  /**
   * 复杂表达式支持功能测试组
   *
   * 测试在复杂 JavaScript 表达式中的路径处理能力
   * 验证运算符、方法调用等场景下的正确处理
   */
  describe('Complex expression support', () => {
    /**
     * 测试包含运算符的复杂表达式处理
     * 场景：表达式包含算术运算符、比较运算符等
     * 预期：正确识别并处理所有 ctx 路径，不影响运算符
     */
    test('should correctly handle expressions containing operators', async () => {
      // 运算符表达式 - 输入: 'ctx.user.age > 18 && ctx.config.debug', 正确处理所有ctx路径'
      const expression = 'ctx.user.age > 18 && ctx.config.debug';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('(await ctx.user).age > 18 && (await ctx.config).debug');
    });

    /**
     * 测试包含数组索引访问的表达式处理
     * 场景：表达式包含数组索引语法，如 ctx.items[0]
     * 预期：正确处理路径部分，保持数组索引语法不变
     */
    test('should correctly handle expressions containing array indices', async () => {
      const expression = 'ctx.items[0].name';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('(await ctx.items)[0].name');
    });

    /**
     * 测试多个 ctx 路径的批量处理
     * 场景：单个表达式中包含多个不同的 ctx 路径
     * 预期：正确识别并处理所有路径，按长度排序避免冲突
     */
    test('should correctly handle complex expressions with multiple ctx paths', async () => {
      const expression = 'ctx.user.name + " - " + ctx.config.theme + " - " + ctx.count';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('(await ctx.user).name + " - " + (await ctx.config).theme + " - " + await ctx.count');
    });

    /**
     * 测试路径长度排序的冲突避免机制
     * 场景：表达式包含前缀相似的路径，如 ctx.user 和 ctx.user.name
     * 预期：长路径优先处理，避免短路径替换影响长路径
     */
    test('should sort by path length to avoid replacement conflicts', async () => {
      const expression = 'ctx.user.name.length + ctx.user.age';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('(await ctx.user).name.length + (await ctx.user).age');
    });
  });

  /**
   * 边界情况处理功能测试组
   *
   * 测试各种边界情况和异常场景的处理能力
   * 验证函数调用排除、错误处理等机制
   */
  describe('Edge case handling', () => {
    /**
     * 测试函数调用的正确排除
     * 场景：表达式包含 ctx.method() 形式的函数调用
     * 预期：函数调用不被当作路径处理，保持原始形式
     * 核心功能：验证函数调用识别和排除机制的准确性
     */
    test('should exclude function calls and not perform path processing', async () => {
      const expression = 'ctx.method() + ctx.user.name';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('ctx.method() + (await ctx.user).name');
    });

    /**
     * 测试带空格的函数调用排除
     * 场景：函数调用前有空格，如 ctx.method ()
     * 预期：正确识别为函数调用并排除处理
     * 核心功能：验证空格容忍的函数调用识别机制
     */
    test('should exclude function calls with spaces', async () => {
      const expression = 'ctx.method () + ctx.config.theme';
      const result = await preprocessExpression(expression, ctx);

      expect(result).toBe('ctx.method () + (await ctx.config).theme');
    });
  });
});

/**
 * resolveExpressions 测试套件
 *
 * resolveExpressions 是参数表达式解析器，提供以下核心功能：
 *
 * 1. **表达式解析与求值**
 *    - 支持单表达式 `{{ ctx.user.name }}` 和多表达式模板字符串
 *    - 使用 SES (Secure ECMAScript) 沙箱环境安全执行 JavaScript 代码
 *    - 支持复杂表达式：运算符、方法调用、条件判断等
 *
 * 2. **RecordProxy**
 *    - 自动检测 RecordProxy 实例
 *    - 对 RecordProxy 深层路径使用整体 await，避免多次数据库请求
 *    - 普通对象使用分步解析，支持嵌套属性访问
 *
 * 3. **类型安全与错误处理**
 *    - 表达式执行失败时返回原始字符串，保证数据完整性
 *    - 支持各种数据类型：字符串、数字、对象、数组、null/undefined
 *    - 完善的边界情况处理和容错机制
 *
 * 测试结构：
 * - 静态内容处理: 不包含表达式的参数原样返回
 * - 单表达式解析: 基础的 `{{ }}` 表达式解析功能
 * - 多表达式解析: 模板字符串中包含多个表达式
 * - 对象和数组遍历: 复杂数据结构的递归解析
 * - RecordProxy 支持: 数据库关联对象的智能处理
 * - 复杂表达式支持: 运算符、方法调用等高级表达式
 * - 边界情况和错误处理: 异常情况的容错处理
 */
describe('resolveExpressions', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let ctx: FlowRuntimeContext;

  beforeEach(() => {
    // 创建真实的上下文环境
    engine = new FlowEngine();
    model = engine.createModel({ use: 'FlowModel' });
    ctx = new FlowRuntimeContext(model, 'test-flow', 'runtime');

    // 设置测试数据
    ctx.defineProperty('user', {
      value: {
        name: 'John Doe',
        age: 30,
        profile: {
          email: 'john@example.com',
          role: 'admin',
        },
      },
    });
    ctx.defineProperty('config', {
      value: {
        theme: 'dark',
        notifications: true,
      },
    });
    ctx.defineProperty('items', {
      value: [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
      ],
    });

    // 设置数值数据用于运算测试
    ctx.defineProperty('aa', {
      value: {
        bb: 10,
      },
    });
    ctx.defineProperty('cc', { value: 5 });

    // 设置方法用于方法调用测试
    ctx.defineMethod('method1', (a, b) => {
      return a + b;
    });
    ctx.defineMethod('multiply', (x, y) => {
      return x * y;
    });

    // 获取数据源管理器并创建集合定义
    const dataSourceManager = engine.context.dataSourceManager;
    const dataSource = dataSourceManager.getDataSource('main');

    // 创建完整的集合定义
    const usersCollection = new Collection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'posts', type: 'hasMany', target: 'posts' },
      ],
    });

    const postsCollection = new Collection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
      ],
    });

    // 将集合添加到数据源
    dataSource.addCollection(usersCollection);
    dataSource.addCollection(postsCollection);

    // Mock APIClient request method
    const mockApiRequest = vi.fn();
    model.context.defineProperty('api', {
      get: () => ({
        request: mockApiRequest,
      }),
    });

    const mockRecord = {
      id: 1,
      name: 'John Doe',
      posts: [
        { id: 1, title: 'Post 1', content: 'Content 1' },
        { id: 2, title: 'Post 2', content: 'Content 2' },
      ],
    };

    // 创建 RecordProxy 实例
    const recordProxy = new RecordProxy(mockRecord, usersCollection, model.context);
    ctx.defineProperty('recordAsync', { value: recordProxy });
  });

  // 测试核心功能：单表达式解析
  // 验证 {{ }} 表达式的解析能力，包括简单属性访问和嵌套路径访问
  describe('Single expression resolution', () => {
    // 简单表达式 - 输入: {{ctx.user.name}}, 输出: 'John Doe'
    test('should resolve simple context property access', async () => {
      const params = '{{ctx.user.name}}';

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual('John Doe');
    });

    // 简单表达式 - 输入: {{ctx.user.name}}, 输出: 'John Doe'
    test('should resolve simple context property access', async () => {
      const params = {
        userName: '{{ctx.user.name}}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        userName: 'John Doe',
      });
    });

    // 深层属性 - 输入: {{ctx.user.profile.email}}, 输出: 'john@example.com'
    test('should resolve deeply nested property paths', async () => {
      const params = {
        email: '{{ctx.user.profile.email}}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        email: 'john@example.com',
      });
    });

    // 复杂对象 - 输入: {{ctx.user}}, 输出: 完整用户对象
    test('should resolve expressions returning complex objects', async () => {
      const params = {
        userData: '{{ctx.user}}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        userData: {
          name: 'John Doe',
          age: 30,
          profile: {
            email: 'john@example.com',
            role: 'admin',
          },
        },
      });
    });

    // 数组类型 - 输入: {{ctx.items}}, 输出: 数组对象
    test('should resolve array type expressions', async () => {
      const params = {
        itemList: '{{ctx.items}}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        itemList: [
          { id: 1, title: 'Item 1' },
          { id: 2, title: 'Item 2' },
        ],
      });
    });
  });

  // 测试高级功能：多表达式模板字符串
  // 验证在单个字符串中包含多个 {{ }} 表达式的解析和替换能力
  describe('Multiple expressions in template strings', () => {
    /**
     * 测试多表达式模板字符串的解析
     * 场景：解析包含多个 {{ }} 表达式的模板字符串
     * 预期：正确识别并替换所有表达式，生成最终的文本内容
     * 核心功能：验证模板字符串处理能力和表达式批量替换功能
     */
    test('should resolve multiple expressions in template strings', async () => {
      const params = {
        message: 'User: {{ctx.user.name}}, Age: {{ctx.user.age}}',
        profileInfo: 'Profile: {{ctx.user.profile}}',
        welcomeMessage: 'Welcome {{ctx.user.name}}! Your theme is {{ctx.config.theme}}.',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        message: 'User: John Doe, Age: 30',
        profileInfo: 'Profile: {"email":"john@example.com","role":"admin"}',
        welcomeMessage: 'Welcome John Doe! Your theme is dark.',
      });
    });
  });

  describe('Expression resolution in objects', () => {
    test('should recursively resolve expressions in objects and preserve types', async () => {
      const params = {
        greeting: 'Hello {{ctx.user.name}}',
        userInfo: {
          email: '{{ctx.user.profile.email}}',
          role: '{{ctx.user.profile.role}}',
        },
        static: 'No expressions here',
        // 测试单个表达式的类型保持
        user: '{{ctx.user}}',
        age: '{{ctx.user.age}}',
        config: '{{ctx.config}}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        greeting: 'Hello John Doe',
        userInfo: {
          email: 'john@example.com',
          role: 'admin',
        },
        static: 'No expressions here',
        user: {
          name: 'John Doe',
          age: 30,
          profile: {
            email: 'john@example.com',
            role: 'admin',
          },
        },
        age: 30,
        config: {
          theme: 'dark',
          notifications: true,
        },
      });
    });
  });

  describe('Expression resolution in arrays and complex structures', () => {
    test('should recursively resolve expressions in arrays and nested structures', async () => {
      const params = {
        simpleArray: [
          'Hello {{ctx.user.name}}',
          '{{ctx.user.age}}',
          {
            email: '{{ctx.user.profile.email}}',
            static: 'unchanged',
          },
        ],
        complexStructure: {
          users: [
            { name: '{{ctx.user.name}}', role: 'static-role' },
            { name: 'Static User', role: '{{ctx.user.profile.role}}' },
          ],
          config: ['{{ctx.config.theme}}', 'static-value'],
        },
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        simpleArray: [
          'Hello John Doe',
          30,
          {
            email: 'john@example.com',
            static: 'unchanged',
          },
        ],
        complexStructure: {
          users: [
            { name: 'John Doe', role: 'static-role' },
            { name: 'Static User', role: 'admin' },
          ],
          config: ['dark', 'static-value'],
        },
      });
    });
  });

  describe('Edge case handling', () => {
    test('should handle non-existent property paths', async () => {
      const params = {
        value: '{{ctx.nonexistent.property}}',
      };

      const result = await resolveExpressions(params, ctx);

      // 不存在的属性应该返回 undefined
      expect(result).toEqual({
        value: undefined,
      });
    });

    test('should handle expressions with various space formats', async () => {
      const params = {
        noSpace: '{{ctx.user.name}}',
        leftSpace: '{{ ctx.user.name}}',
        rightSpace: '{{ctx.user.name }}',
        bothSpace: '{{ ctx.user.name }}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        noSpace: 'John Doe',
        leftSpace: 'John Doe',
        rightSpace: 'John Doe',
        bothSpace: 'John Doe',
      });
    });

    test('should handle null and undefined values', async () => {
      ctx.defineProperty('nullValue', { value: null });
      ctx.defineProperty('undefinedValue', { value: undefined });

      const params = {
        nullTest: '{{ctx.nullValue}}',
        undefinedTest: '{{ctx.undefinedValue}}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result.nullTest).toBe(null);
      expect(result.undefinedTest).toBe(undefined);
    });
  });
  describe('Complex expression support', () => {
    test('should support various types of complex expressions', async () => {
      const params = {
        // 算术运算符
        sum: '{{ ctx.aa.bb + ctx.cc }}',
        product: '{{ ctx.aa.bb * ctx.cc }}',
        // 方法调用
        methodResult: '{{ ctx.method1(ctx.aa.bb, ctx.cc) }}',
        chainedCall: '{{ ctx.method1(ctx.multiply(ctx.cc, 2), ctx.aa.bb) }}',
        // 条件表达式
        conditionalExpr: '{{ ctx.user.age > 25 ? "Adult" : "Young" }}',
        // 字符串拼接
        stringConcat: '{{ ctx.user.name + " is " + ctx.user.age + " years old" }}',
        // 模板字符串中的复杂表达式
        template: 'Result: {{ ctx.aa.bb + ctx.cc }}, User: {{ ctx.user.name }}',
        // 数组和对象操作
        arrayLength: '{{ ctx.items.length }}',
        firstItem: '{{ ctx.items[0].title }}',
        objectKeys: '{{ Object.keys(ctx.user.profile).length }}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        sum: 15, // 10 + 5
        product: 50, // 10 * 5
        methodResult: 15, // method1(10, 5) = 15
        chainedCall: 20, // method1(multiply(5, 2), 10) = method1(10, 10) = 20
        conditionalExpr: 'Adult', // 30 > 25 ? "Adult" : "Young"
        stringConcat: 'John Doe is 30 years old',
        template: 'Result: 15, User: John Doe',
        arrayLength: 2,
        firstItem: 'Item 1',
        objectKeys: 2, // email, role
      });
    });
  });

  describe('Error handling', () => {
    test('should handle various error conditions gracefully', async () => {
      const params = {
        invalidMethod: '{{ ctx.nonexistentMethod(ctx.aa.bb) }}',
        invalidPath: '{{ ctx.nonexistent.deep.path + 5 }}',
        syntaxError: '{{ ctx.user.name + }}', // 语法错误
        divisionByZero: '{{ 1 / 0 }}', // 特殊值情况
        validExpression: '{{ ctx.aa.bb * 2 }}',
      };

      const result = await resolveExpressions(params, ctx);

      expect(result).toEqual({
        invalidMethod: undefined,
        invalidPath: undefined,
        syntaxError: undefined,
        divisionByZero: Infinity,
        validExpression: 20, // 10 * 2
      });
    });
  });
});
