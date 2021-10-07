import path from 'path';
import send from 'koa-send';
import serve from 'koa-static';
import { PluginOptions } from '@nocobase/server';
import { readFileSync } from 'fs';
import glob from 'glob';

function getInitSqls() {
  const part1 = [];
  const part2 = [];
  const files1 = glob.sync(path.resolve(__dirname, './db/part1/*.sql'));
  for (const file of files1) {
    const sql = readFileSync(file).toString();
    part1.push(sql);
  }
  const files2 = glob.sync(path.resolve(__dirname, './db/part2/*.sql'));
  for (const file of files2) {
    const sql = readFileSync(file).toString();
    part2.push(sql);
  }
  return { part1, part2 };
}

export default {
  name: 'client',
  async load() {
    let root = this.options.dist;
    if (root && !root.startsWith('/')) {
      root = path.resolve(process.cwd(), root);
    }
    this.app.middleware.unshift(async (ctx, next) => {
      if (!root) {
        return next();
      }
      await serve(root)(ctx, next);
      console.log('koa-send', root, ctx.status);
      if (ctx.status == 404) {
        return send(ctx, 'index.html', { root });
      }
    });
    const app = this.app;
    this.app.on('db.init', async () => {
      const transaction = await app.db.sequelize.transaction();
      const sqls = getInitSqls();
      try {
        for (const sql of sqls.part1) {
          await app.db.sequelize.query(sql, { transaction });
        }
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
      }
      await app.db.getModel('collections').load({
        skipExisting: true,
      });
      await app.db.sync();
      const transaction2 = await app.db.sequelize.transaction();
      try {
        for (const sql of sqls.part2) {
          await app.db.sequelize.query(sql, { transaction: transaction2 });
        }
        await transaction2.commit();
      } catch (error) {
        await transaction2.rollback();
      }
    });
  }
} as PluginOptions;
