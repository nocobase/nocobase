import { AppCommand } from '@nocobase/app-cli';

export default class CountEntries extends AppCommand {
  static override summary = 'Count reading list entries.';

  public async run(): Promise<{ count: number }> {
    await this.parse(CountEntries);
    const { readingListToken } = await import('../server/service.js');
    return this.withApp(async ({ app }) => {
      await app.start();
      return { count: await app.container.resolve(readingListToken).count() };
    });
  }
}
