import process from 'node:process';
import XlsxExporter from '../xlsx-exporter';
import xlsxExporter from '../xlsx-exporter';
import { isMainThread, parentPort } from 'node:worker_threads';

export default function addAsyncExportCommand(app) {
  app
    .command('export:xlsx')
    .argument('<collectionName>', 'collection to export')
    .option('--dataSource', 'data source of collection', 'main')
    .action(async (collectionName, options) => {
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

      xlsxExporter.on('progress', (progress) => {
        if (!isMainThread) {
          parentPort.postMessage({
            type: 'progress',
            payload: progress,
          });
        }
      });

      await exporter.run();

      await app.destroy();
      process.exit(0);
    });
}
