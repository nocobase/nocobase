import { defineMigration, type MigrationDefinition } from '@nocobase/db';

interface FolderRow {
  id: string;
  providerFolderId: string;
  name: string;
  type: string;
}

function coreFolderType(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  const leaf = normalized.split(/[\\/.:>]/u).at(-1) ?? normalized;
  if (leaf === 'inbox') return 'inbox';
  if (['sent', 'sent items', 'sent mail', 'sent messages'].includes(leaf))
    return 'sent';
  if (['draft', 'drafts', 'draft messages'].includes(leaf)) return 'drafts';
  if (
    ['trash', 'deleted', 'deleted items', 'deleted messages', 'bin'].includes(
      leaf,
    )
  )
    return 'trash';
  if (['junk', 'junk email', 'spam', 'bulk mail'].includes(leaf)) return 'junk';
  if (['archive', 'archived'].includes(leaf)) return 'archive';
  return undefined;
}

const migration: MigrationDefinition = defineMigration({
  name: '202609210001_normalize_mail_folders',
  async up({ query }) {
    const rows = await query
      .selectFrom('mailFolders')
      .select(['id', 'providerFolderId', 'name', 'type'])
      .where('type', '=', 'custom')
      .execute<FolderRow>();
    for (const row of rows) {
      const type =
        coreFolderType(row.providerFolderId) ?? coreFolderType(row.name);
      if (type) {
        await query
          .updateTable('mailFolders')
          .set({ type })
          .where('id', '=', row.id)
          .execute();
      }
    }
  },
  async down() {},
});

export default migration;
