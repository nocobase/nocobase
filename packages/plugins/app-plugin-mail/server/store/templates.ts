import { type DatabaseManager } from '@nocobase/db';
import { type MailTemplate } from '../../shared/mail.js';
import { toMailTemplate } from './mappers.js';
import { type TemplateRow } from './rows.js';

export class MailTemplatesStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async listTemplates(
    ownerId: string,
  ): Promise<readonly MailTemplate[]> {
    const rows = await this.database
      .query()
      .selectFrom<TemplateRow>('mailTemplates')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .orderBy('name', 'asc')
      .execute<TemplateRow>();
    return rows.map(toMailTemplate);
  }

  public async saveTemplate(template: MailTemplate): Promise<MailTemplate> {
    const existing = await this.database
      .query()
      .selectFrom<TemplateRow>('mailTemplates')
      .select('id')
      .where('id', '=', template.id)
      .where('ownerId', '=', template.ownerId ?? '')
      .executeTakeFirst<Pick<TemplateRow, 'id'>>();
    const now = new Date().toISOString();
    const row: TemplateRow = {
      id: template.id,
      name: template.name,
      subject: template.subject,
      text: template.text,
      html: template.html,
      ownerId: template.ownerId ?? '',
      createdAt: now,
      updatedAt: now,
    };
    if (existing) {
      await this.database
        .query()
        .updateTable<TemplateRow>('mailTemplates')
        .set({
          name: row.name,
          subject: row.subject,
          text: row.text,
          html: row.html,
          updatedAt: row.updatedAt,
        })
        .where('id', '=', template.id)
        .where('ownerId', '=', row.ownerId)
        .execute();
    } else {
      await this.database
        .query()
        .insertInto<TemplateRow>('mailTemplates')
        .values(row)
        .execute();
    }
    return toMailTemplate(row);
  }

  public async deleteTemplate(
    ownerId: string,
    templateId: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .deleteFrom<TemplateRow>('mailTemplates')
      .where('id', '=', templateId)
      .where('ownerId', '=', ownerId)
      .execute();
    return result.deletedCount === 1;
  }
}
