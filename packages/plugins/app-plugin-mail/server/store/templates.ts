import { type DatabaseManager } from '@nocobase/db';
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
      if (reportsNameConflict(error)) throw mailTemplateNameConflict(error);
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

/** The `(ownerId, name)` unique constraint, named by the migration that creates `mailTemplates`. */
const NAME_CONSTRAINT = 'mail_templates_owner_name_unique';

/**
 * Whether the failed write itself reports the `(ownerId, name)` constraint, read from the driver's structured fields
 * rather than its message or the rows left afterwards. PostgreSQL names the constraint; SQLite tells the primary key
 * apart from other unique keys, and the name is this table's only other one. Any other report, including the primary
 * key and databases that name the key only in their message, stays an unexpected error.
 */
function reportsNameConflict(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (record.code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
    if (record.code === '23505') return record.constraint === NAME_CONSTRAINT;
    current = record.cause ?? record.originalError;
  }
  return false;
}

function mailTemplateNameConflict(cause: unknown): MailError {
  return new MailError({
    status: 'ALREADY_EXISTS',
    reason: 'MAIL_TEMPLATE_ALREADY_EXISTS',
    message: 'Mail template name is already in use.',
    cause,
  });
}
