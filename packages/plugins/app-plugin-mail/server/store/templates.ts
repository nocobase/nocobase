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
        (await this.hasNameConflict(row, existing !== undefined))
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
   * Whether the name alone caused the violation: another template of the same owner holds it, and, for a new row, no
   * other record holds the id. A violation the id could have raised, such as an id that collides with another
   * template while the name also does, is not a name conflict and stays unexpected.
   */
  private async hasNameConflict(
    row: TemplateRow,
    exists: boolean,
  ): Promise<boolean> {
    const conflicting = await this.database
      .query()
      .selectFrom<TemplateRow>('mailTemplates')
      .select('id')
      .where('ownerId', '=', row.ownerId)
      .where('name', '=', row.name)
      .where('id', '!=', row.id)
      .executeTakeFirst<Pick<TemplateRow, 'id'>>();
    if (conflicting === undefined) return false;
    if (exists) return true;
    const idHolder = await this.database
      .query()
      .selectFrom<TemplateRow>('mailTemplates')
      .select('id')
      .where('id', '=', row.id)
      .executeTakeFirst<Pick<TemplateRow, 'id'>>();
    return idHolder === undefined;
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
