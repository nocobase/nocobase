import { createMockServer } from '@nocobase/test';
import { CollectionRepository } from '@nocobase/plugin-data-source-main';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ExcelJS from 'exceljs';
import { faker } from '@faker-js/faker';
import request from 'superagent';

const storagePath = path.resolve(process.cwd(), 'storage', 'perf', 'importDataTest');

export default async function main() {
  const app = await createMockServer({
    plugins: ['nocobase'],
  });
  const columns = [...Array(30).keys()];
  const importDataTestCollection = {
    name: 'importDataTest',
    title: 'ImportDataTest',
    template: 'general',
    autoGenId: false,
    filterTargetKey: 'id',
    fields: [
      ...columns.map((index) => ({
        type: 'string',
        name: 'column' + index,
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'column' + index,
        },
      })),
      {
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: {
          type: 'number',
          title: 'ID',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
        interface: 'integer',
      },
      {
        name: 'createdAt',
        interface: 'createdAt',
        type: 'date',
        field: 'createdAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Created at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      },
      {
        name: 'createdBy',
        interface: 'createdBy',
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'createdById',
        uiSchema: {
          type: 'object',
          title: '{{t("Created by")}}',
          'x-component': 'AssociationField',
          'x-component-props': {
            fieldNames: {
              value: 'id',
              label: 'nickname',
            },
          },
          'x-read-pretty': true,
        },
      },
      {
        type: 'date',
        field: 'updatedAt',
        name: 'updatedAt',
        interface: 'updatedAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Last updated at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      },
      {
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'updatedById',
        name: 'updatedBy',
        interface: 'updatedBy',
        uiSchema: {
          type: 'object',
          title: '{{t("Last updated by")}}',
          'x-component': 'AssociationField',
          'x-component-props': {
            fieldNames: {
              value: 'id',
              label: 'nickname',
            },
          },
          'x-read-pretty': true,
        },
      },
    ],
  };
  const importDataTestCollectionPath = path.resolve(storagePath, 'importDataTest.collection.json');
  const writeStream = fs.createWriteStream(importDataTestCollectionPath);
  writeStream.write(JSON.stringify(importDataTestCollection, null, 4));
  app.logger.info('generate collection json on:' + importDataTestCollectionPath);

  const db = app.db;
  db.collection(importDataTestCollection);
  await db.sync();
  const CollectionRepo = db.getRepository('collections') as CollectionRepository;
  await CollectionRepo.db2cm('importDataTest');

  const importTemplateXlsxPath = await download(
    app
      .agent()
      .post('/importDataTest:downloadXlsxTemplate')
      .send({
        title: 'ImportDataTest',
        explain: '',
        columns: [
          ...columns.map((index) => ({
            dataIndex: ['column' + index],
            defaultTitle: 'column' + index,
          })),
          {
            dataIndex: ['id'],
            defaultTitle: 'ID',
          },
        ],
      }),
  );
  app.logger.info('download import template on:' + importTemplateXlsxPath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(importTemplateXlsxPath);
  const worksheet = workbook.getWorksheet('Sheet 1');
  if (!worksheet) {
    throw new Error('Sheet 1 not exist');
  }
  for (let i = 0; i < 10000; i++) {
    const data = [];
    for (let i = 0; i < columns.length; i++) {
      switch (i) {
        case 0:
          data[i] = faker.string.uuid();
          break;
        case 1:
          data[i] = faker.person.firstName();
          break;
        case 2:
          data[i] = faker.person.middleName();
          break;
        case 3:
          data[i] = faker.person.lastName();
          break;
        case 4:
          data[i] = faker.person.gender();
          break;
        case 5:
          data[i] = faker.person.bio();
          break;
        case 6:
          data[i] = faker.internet.email();
          break;
        default:
          data[i] = faker.word.words({ count: { min: 5, max: 10 } });
          break;
      }
    }
    data[data.length] = i + 1;
    worksheet.addRow(data);
  }

  await workbook.xlsx.writeFile(importTemplateXlsxPath);
  app.logger.info('fill import template with random data on:' + importTemplateXlsxPath);
}

function getFilename(res) {
  const disposition = res.headers['content-disposition'];
  if (!disposition) return 'download.file';

  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
  return decodeURIComponent(match?.[1] ?? 'download.file');
}

async function download(request: request.SuperAgentRequest): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let importTemplateXlsxPath = '';
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `download-${Date.now()}-${crypto.randomUUID()}`);
    const writeStream = fs.createWriteStream(tmpFile);
    request
      .on('response', (res) => {
        const filename = getFilename(res);
        importTemplateXlsxPath = path.resolve(storagePath, filename);
      })
      .pipe(writeStream)
      .on('finish', () => {
        fs.mkdir(storagePath, { recursive: true }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          try {
            fs.renameSync(tmpFile, importTemplateXlsxPath);
            resolve(importTemplateXlsxPath);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

main()
  .then(() => {
    console.log('Data generation completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during data generation:', error);
    process.exit(1);
  });
