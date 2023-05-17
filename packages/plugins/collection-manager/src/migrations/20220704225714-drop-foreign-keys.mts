import { Migration } from '@nocobase/server';

export default class DropForeignKeysMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.7.1-alpha.7');
    if (!result) {
      return;
    }
    const transaction = await this.db.sequelize.transaction();
    try {
      if (this.db.inDialect('mysql')) {
        const [results]: any = await this.db.sequelize.query(
          `
            SELECT CONCAT('ALTER TABLE ',TABLE_SCHEMA,'.',TABLE_NAME,' DROP FOREIGN KEY ',CONSTRAINT_NAME,' ;') as q 
            FROM information_schema.TABLE_CONSTRAINTS c 
            WHERE c.TABLE_SCHEMA='${this.db.options.database}' AND c.CONSTRAINT_TYPE='FOREIGN KEY';
          `,
          { transaction },
        );
        for (const result of results) {
          await this.db.sequelize.query(result.q as any, { transaction });
        }
      } else if (this.db.inDialect('postgres')) {
        const [results]: any = await this.db.sequelize.query(
          `
            select 'alter table '||quote_ident(tb.relname)||
                  ' drop constraint '||quote_ident(conname)||';' as q
            from pg_constraint c
              join pg_class tb on tb.oid = c.conrelid
              join pg_namespace ns on ns.oid = tb.relnamespace
            where ns.nspname in ('public')
            and c.contype = 'f';
          `,
          { transaction },
        );
        for (const result of results) {
          await this.db.sequelize.query(result.q as any, { transaction });
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
    }
  }
}
