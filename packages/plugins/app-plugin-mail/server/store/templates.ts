import {
  isUniqueConstraintViolation,
  type DatabaseManager,
} from '@nocobase/db';
import { type MailTemplate } from '../../shared/mail.js';
import { toMailTemplate } from './mappers.js';
import { type TemplateRow } from './rows.js';
import { MailError } from '../services/errors.js';

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
    try {
      await this.writeTemplate(row, existing !== undefined);
    } catch (error) {
      if (
        isUniqueConstraintViolation(error) &&
        (await this.hasNameConflict(row))
      )
        throw mailTemplateNameConflict(error);
      throw error;
    }
    return toMailTemplate(row);
  }

  private async writeTemplate(
    row: TemplateRow,
    exists: boolean,
  ): Promise<void> {
    if (exists) {
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
        .where('id', '=', row.id)
        .where('ownerId', '=', row.ownerId)
        .execute();
    } else {
      await this.database
        .query()
        .insertInto<TemplateRow>('mailTemplates')
        .values(row)
        .execute();
    }
  }

  /**
   * Whether another template of the same owner holds the name, which is what the `(ownerId, name)` unique index
   * rejects. Any other unique violation, such as an id collision, is not a name conflict and stays unexpected.
   */
  private async hasNameConflict(row: TemplateRow): Promise<boolean> {
    const conflicting = await this.database
      .query()
      .selectFrom<TemplateRow>('mailTemplates')
      .select('id')
      .where('ownerId', '=', row.ownerId)
      .where('name', '=', row.name)
      .where('id', '!=', row.id)
      .executeTakeFirst<Pick<TemplateRow, 'id'>>();
    return conflicting !== undefined;
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

function mailTemplateNameConflict(cause: unknown): MailError {
  return new MailError({
    status: 'ALREADY_EXISTS',
    reason: 'MAIL_TEMPLATE_ALREADY_EXISTS',
    message: 'Mail template name is already in use.',
    cause,
  });
}
