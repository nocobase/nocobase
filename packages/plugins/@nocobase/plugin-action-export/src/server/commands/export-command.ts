import process from 'node:process';
import { Application } from '@nocobase/server';
import XlsxExporter from '../xlsx-exporter';

export default function addAsyncExportCommand(app: Application) {
  app
    .command('export:xlsx')
    .argument('<collectionName>', 'collection to export')
    .option('--dataSource', 'data source of collection', 'main')
    .action(async (collectionName: string, options) => {
      const { dataSource } = options;
      await app.load();
      await app.start();

      const collectionManager = app.dataSourceManager.dataSources.get(dataSource).collectionManager;

      const collection = collectionManager.getCollection(collectionName);

      const exporter = new XlsxExporter({
        collectionManager,
        collection,
        columns: [
          {
            dataIndex: ['username'],
            defaultTitle: 'UserName',
          },
        ],
      });

      await exporter.run();

      await app.destroy();
      process.exit(0);
    });
}
