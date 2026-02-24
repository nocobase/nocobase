/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */
import { InstallOptions, Plugin } from '@nocobase/server';
import { round } from 'mathjs';
import { parseCollectionName } from '@nocobase/data-source-manager';
import { DataTypes } from '@nocobase/database';
import { parseFilter } from './parseFilter';

// 定义支持的聚合方法
const aggregators = {
  count: 'count',
  sum: 'sum',
  avg: 'avg',
  min: 'min',
  max: 'max',
};

export class PluginCustomVariablesServer extends Plugin {
  afterAdd() { }

  async load() {
    this.app.resourceManager.registerActionHandler('customVariables:parse', async (ctx, next) => {
      // 1. 从 ctx.query 中获取变量名；从 ctx.body 中获取变量上下文
      const { name } = ctx.query;
      const { filterCtx } = ctx.request.body;

      if (!name) {
        return ctx.throw(400, 'Variable name is required');
      }

      try {
        // 2. 通过变量名从数据库中查找变量配置
        const variableRepo = this.app.db.getRepository('customVariables');
        const variable = await variableRepo.findOne({
          filter: { name },
        });

        if (!variable) {
          return ctx.throw(404, `Variable '${name}' not found`);
        }

        // 3. 从配置中获取到数据表、聚合字段、聚合条件、聚合方法、是否去重、精度等信息
        const { type, options } = variable.toJSON();

        if (type !== 'aggregate') {
          return ctx.throw(400, `Variable '${name}' is not an aggregate variable`);
        }

        // 解析 filter 中的变量值
        if (filterCtx && options.params.filter) {
          options.params.filter = parseFilter(options.params.filter, filterCtx);
        }

        const {
          collection,
          params: {
            field,
            filter,
            distinct,
          },
          aggregator,
          precision = 2
        } = options;

        if (!collection || !field || !aggregator || !aggregators[aggregator]) {
          return ctx.throw(400, 'Invalid variable configuration');
        }

        // 解析集合名称，获取数据源名称和集合名称
        const [dataSourceName, collectionName] = parseCollectionName(collection);
        const { collectionManager } = this.app.dataSourceManager.dataSources.get(dataSourceName);

        if (!(collectionManager as any).db) {
          throw new Error('Aggregate variables can only work with data source of type database');
        }

        // 获取对应的仓库
        const repo = collectionManager.getRepository(collectionName);

        // 设置聚合查询参数
        const aggregateOptions = {
          method: aggregators[aggregator],
          field,
          filter,
          distinct
        };

        // 为 avg 聚合设置数据类型
        if (aggregator === 'avg') {
          aggregateOptions['dataType'] = DataTypes.DOUBLE;
        }

        // 4. 根据这些配置触发聚合查询
        const result = await repo.aggregate(aggregateOptions);

        // 5. 对查询结果进行精度处理
        const processedResult = round(
          (aggregator === 'avg' ? Number(result) : result) || 0,
          Math.max(0, Math.min(precision, 14))
        );

        // 6. 将处理后的结果返回给前端
        ctx.body = processedResult;
      } catch (error) {
        ctx.throw(500, `Error parsing variable: ${error.message}`);
      }

      await next();
    });
    this.app.acl.allow('customVariables', ['parse', 'create', 'update', 'destroy', 'list', 'get'], 'loggedIn');
  }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default PluginCustomVariablesServer;
