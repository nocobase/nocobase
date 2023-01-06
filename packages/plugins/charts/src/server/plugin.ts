import { InstallOptions, Plugin } from '@nocobase/server';

export class ChartsPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resource({
      name: 'chartData',
      actions: {
        data: {
          values: {
            status: 0
          },
          middlewares: [
            async (ctx, next) => {
              await next();
            }
          ],
          async handler(ctx, next) {
            //处理不同chartType对应的数据
            console.log(ctx.action.params,"=======================")
            //data 聚合数据
            const chartData = [
              { type: '分类一', value: 27 },
              { type: '分类二', value: 25 },
              { type: '分类三', value: 18 },
              { type: '分类四', value: 15 },
              { type: '分类五', value: 10 },
              { type: '其他', value: 5 },
            ];
            //图表数据
            ctx.body = {
              chartData
            };
            next()
          }
        },
      }
    });

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('users', '*');
    this.app.acl.allow('chartData', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ChartsPlugin;
