import path from 'path';
import send from 'koa-send';
import serve from 'koa-static';
import { PluginOptions } from '@nocobase/server';
import { readFileSync } from 'fs';
import glob from 'glob';

export function getInitSqls() {
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

export function runSql(sql, database) {
  const trimmed = sql.trim();
  if (trimmed.length == 0) {
    return;
  }
  return database.sequelize.query(trimmed, {
    raw: true,
    logging: false,
  });
}

async function runSqlFile(content, database) {
  for (const sqlGroup of content) {
    for (const sql of sqlGroup.split(';')) {
      try {
        await runSql(sql, database);
      } catch (e) {
        console.error({ e, sql });
      }
    }
  }
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
      // console.log('koa-send', root, ctx.status);
      if (ctx.status == 404) {
        return send(ctx, 'index.html', { root });
      }
    });
    const app = this.app;
    this.app.on('db.init', async () => {
      if (this.options.importDemo !== true) {
        return;
      }
      const sqls = getInitSqls();

      const database = app.db;

      await runSqlFile(sqls.part1, database);

      await app.db.getModel('collections').load({
        skipExisting: true,
      });
      await app.db.sync();

      await runSqlFile(sqls.part2, database);
    });
  },
} as PluginOptions;
