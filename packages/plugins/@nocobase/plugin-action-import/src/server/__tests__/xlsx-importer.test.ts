/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { TemplateCreator } from '../services/template-creator';
import { XlsxImporter } from '../services/xlsx-importer';
import { readImportWorkbook } from '../actions/import-xlsx';
import * as XLSX from 'xlsx';
import * as process from 'node:process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import moment from 'moment';
import { PasswordField } from '@nocobase/database';

describe('basic importer', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('validate empty data', () => {
    let User;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });
      await app.db.sync();
    });

    it('should throw error when file only has header row', async () => {
      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      // template already has header row, no need to add data

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
        workbook: template,
      });

      await expect(importer.validate()).rejects.toThrow('No data to import');
    });

    it('should pass validation when file has header and data rows', async () => {
      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['Test Data 1'], ['Test Data 2']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
        workbook: template,
      });

      let error;

      try {
        await importer.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });
  });

  describe('validate columns', () => {
    let User;
    let Profile;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });

      Profile = app.db.collection({
        name: 'profiles',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'belongsTo',
            name: 'user',
            target: 'users',
            interface: 'm2o',
          },
        ],
      });

      await app.db.sync();
    });

    it('should reject invalid association filter key', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: 'Name',
        },
        {
          dataIndex: ['user', 'unknownField'],
          defaultTitle: 'User',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'User1']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      await expect(importer.validate()).rejects.toThrow('Field not found');
    });

    it('should block sql injection style filter key in association', async () => {
      const injectionValue = `"' OR 1=1 --"`;
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: 'Name',
        },
        {
          dataIndex: ['user', '$or'],
          defaultTitle: 'User',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', injectionValue]], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      await expect(importer.run()).rejects.toThrow('Field not found');
    });

    it('should safely handle SQL injection attempts in cell values', async () => {
      // Create a normal user first
      await User.repository.create({ values: { name: 'User1' } });

      const columns = [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['user', 'name'], defaultTitle: 'User' },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      // Inject malicious SQL in cell values
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test1', `' OR '1'='1`], // Classic SQL injection
          ['test2', `User1'; DROP TABLE users; --`], // DROP injection
          ['test3', `' UNION SELECT * FROM users --`], // UNION injection
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      // These malicious values should not be interpreted as SQL
      // Since no user matches these strings, it should throw error (wrapped in "Failed to parse field")
      let error: any;
      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      // The error should be an ImportError with cause containing "not found"
      // This proves the SQL injection string was treated as a literal value to search for
      const errorMessage = error.cause?.message || error.params?.message || error.message;
      expect(errorMessage).toMatch(/not found/);

      // Critical: Verify the users table was NOT dropped or modified
      const userCount = await User.repository.count();
      expect(userCount).toBe(1); // Only the original User1 should exist

      // Verify no profiles were created due to transaction rollback
      const profileCount = await Profile.repository.count();
      expect(profileCount).toBe(0);
    });
  });

  describe('import with date field', () => {
    let User;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'datetime',
            name: 'datetime',
            interface: 'datetime',
          },
          {
            type: 'datetimeNoTz',
            name: 'datetimeNoTz',
            interface: 'datetimeNoTz',
            uiSchema: {
              'x-component-props': {
                picker: 'date',
                dateFormat: 'YYYY-MM-DD',
                showTime: true,
                timeFormat: 'HH:mm:ss',
              },
            },
          },
          {
            type: 'dateOnly',
            name: 'dateOnly',
            interface: 'date',
          },
          {
            type: 'unixTimestamp',
            name: 'unixTimestamp',
            interface: 'unixTimestamp',
            uiSchema: {
              'x-component-props': {
                picker: 'date',
                dateFormat: 'YYYY-MM-DD',
                showTime: true,
                timeFormat: 'HH:mm:ss',
              },
            },
          },
        ],
      });

      await app.db.sync();
    });

    async function runExcelDateImport(options: { serverTimeZone: string; requestTimeZone?: string }) {
      const previousTz = process.env.TZ;
      const name = `test-${options.serverTimeZone}-${options.requestTimeZone ?? 'none'}`;

      try {
        process.env.TZ = options.serverTimeZone;

        const columns = [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
          },
          {
            dataIndex: ['dateOnly'],
            defaultTitle: '日期',
          },
          {
            dataIndex: ['datetime'],
            defaultTitle: '日期时间',
          },
          {
            dataIndex: ['datetimeNoTz'],
            defaultTitle: '日期时间（不含时区）',
          },
          {
            dataIndex: ['unixTimestamp'],
            defaultTitle: 'Unix时间戳秒',
          },
        ];

        const templateCreator = new TemplateCreator({
          collection: User,
          columns,
        });

        const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
        const worksheet = template.Sheets[template.SheetNames[0]];

        XLSX.utils.sheet_add_aoa(worksheet, [[name, 45789, 45789, 45789, 45789]], { origin: 'A2' });
        worksheet['B2'].z = 'yyyy-mm-dd';
        worksheet['C2'].z = 'yyyy-mm-dd';
        worksheet['D2'].z = 'yyyy-mm-dd';
        worksheet['E2'].z = 'yyyy-mm-dd';

        const buffer = XLSX.write(template, { type: 'buffer', bookType: 'xlsx' });
        const workbook = readImportWorkbook(buffer, 10);

        const importer = new XlsxImporter({
          collectionManager: app.mainDataSource.collectionManager,
          collection: User,
          columns,
          workbook,
        });

        await importer.run(
          options.requestTimeZone
            ? {
                context: {
                  request: {
                    get(key: string) {
                      return key.toLowerCase() === 'x-timezone' ? options.requestTimeZone : undefined;
                    },
                    headers: {
                      'x-timezone': options.requestTimeZone,
                    },
                  },
                  req: {
                    headers: {
                      'x-timezone': options.requestTimeZone,
                    },
                  },
                },
              }
            : {},
        );

        const user = await User.repository.findOne({
          filter: {
            name,
          },
        });

        return user.toJSON();
      } finally {
        if (previousTz == null) {
          delete process.env.TZ;
        } else {
          process.env.TZ = previousTz;
        }
      }
    }

    it('should import with dateOnly', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['dateOnly'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', 77383],
          ['test2', '2021-10-18'],
          ['test3', 20241112],
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(users[0]['dateOnly']).toBe('2111-11-12');
      expect(users[1]['dateOnly']).toBe('2021-10-18');
      expect(users[2]['dateOnly']).toBe('2024-11-12');
    });

    it('should keep dateOnly value stable after xlsx round-trip in non-UTC timezone', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['dateOnly'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 45789]], { origin: 'A2' });
      worksheet['B2'].z = 'm/d/yy';

      const buffer = XLSX.write(template, { type: 'buffer', bookType: 'xlsx' });
      const workbook = readImportWorkbook(buffer, 10);

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(users[0]['dateOnly']).toBe('2025-05-12');
    });

    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should import with datetimeNoTz', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['datetimeNoTz'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', 77383],
          ['test2', '2021-10-18 12:31:20'],
          ['test3', 41557.4377314815],
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(users[0]['datetimeNoTz']).toBe('2111-11-12 00:00:00');
      expect(users[1]['datetimeNoTz']).toBe('2021-10-18 12:31:20');
      expect(users[2]['datetimeNoTz']).toBe('2013-10-10 10:30:20');
    });

    it('should import with unixTimestamp', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['unixTimestamp'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', 77383],
          ['test2', 20241112],
          ['test3', '2024-11-12'],
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(moment(users[0]['unixTimestamp']).toISOString()).toEqual('2111-11-12T00:00:00.000Z');
      expect(moment(users[1]['unixTimestamp'])).toBeDefined();
      expect(moment(users[2]['unixTimestamp'])).toBeDefined();
    });

    it('should import with datetimeTz', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['datetime'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 77383]], { origin: 'A2' });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(moment(users[0]['datetime']).toISOString()).toEqual('2111-11-12T00:00:00.000Z');
    });

    it('should honor request timezone for tz-aware excel date cells while keeping dateOnly stable', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['dateOnly'],
          defaultTitle: '日期',
        },
        {
          dataIndex: ['datetime'],
          defaultTitle: '日期时间',
        },
        {
          dataIndex: ['unixTimestamp'],
          defaultTitle: 'Unix时间戳秒',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 45789, 45789, 45789]], { origin: 'A2' });
      worksheet['B2'].z = 'yyyy-mm-dd';
      worksheet['C2'].z = 'yyyy-mm-dd';
      worksheet['D2'].z = 'yyyy-mm-dd';

      const buffer = XLSX.write(template, { type: 'buffer', bookType: 'xlsx' });
      const workbook = readImportWorkbook(buffer, 10);

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook,
      });

      await importer.run({
        context: {
          get(key: string) {
            return key === 'X-Timezone' ? '+08:00' : undefined;
          },
        },
      });

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(users[0]['dateOnly']).toBe('2025-05-12');
      expect(moment(users[0]['datetime']).toISOString()).toEqual('2025-05-11T16:00:00.000Z');
      expect(moment(users[0]['unixTimestamp']).toISOString()).toEqual('2025-05-11T16:00:00.000Z');
    });

    it('should cover the sync import timezone matrix for excel date cells', async () => {
      const cases = [
        {
          serverTimeZone: 'UTC',
          requestTimeZone: undefined,
          expectedDateTime: '2025-05-12T00:00:00.000Z',
        },
        {
          serverTimeZone: 'UTC',
          requestTimeZone: '+08:00',
          expectedDateTime: '2025-05-11T16:00:00.000Z',
        },
        {
          serverTimeZone: 'Asia/Shanghai',
          requestTimeZone: undefined,
          expectedDateTime: '2025-05-12T00:00:00.000Z',
        },
        {
          serverTimeZone: 'Asia/Shanghai',
          requestTimeZone: '+08:00',
          expectedDateTime: '2025-05-11T16:00:00.000Z',
        },
      ];

      for (const testCase of cases) {
        const user = await runExcelDateImport(testCase);

        expect(user['dateOnly']).toBe('2025-05-12');
        expect(user['datetimeNoTz']).toBe('2025-05-12 00:00:00');
        expect(moment(user['datetime']).toISOString()).toEqual(testCase.expectedDateTime);
        expect(moment(user['unixTimestamp']).toISOString()).toEqual(testCase.expectedDateTime);
      }
    });

    it('should honor request timezone when importing excel date cells through HTTP action', async () => {
      const httpApp = await createMockServer({
        name: `import-http-${Date.now()}`,
        plugins: ['error-handler', 'action-import'],
      });
      let filePath: string;

      try {
        const HttpUser = httpApp.db.collection({
          name: 'http_import_users',
          fields: [
            { type: 'string', name: 'name' },
            {
              type: 'datetime',
              name: 'datetime',
              interface: 'datetime',
            },
            {
              type: 'datetimeNoTz',
              name: 'datetimeNoTz',
              interface: 'datetimeNoTz',
              uiSchema: {
                'x-component-props': {
                  picker: 'date',
                  dateFormat: 'YYYY-MM-DD',
                  showTime: true,
                  timeFormat: 'HH:mm:ss',
                },
              },
            },
            {
              type: 'unixTimestamp',
              name: 'unixTimestamp',
              interface: 'unixTimestamp',
              uiSchema: {
                'x-component-props': {
                  picker: 'date',
                  dateFormat: 'YYYY-MM-DD',
                  showTime: true,
                  timeFormat: 'HH:mm:ss',
                },
              },
            },
          ],
        });
        await httpApp.db.sync();

        const columns = [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
          },
          {
            dataIndex: ['datetime'],
            defaultTitle: '日期时间',
          },
          {
            dataIndex: ['datetimeNoTz'],
            defaultTitle: '日期时间（不含时区）',
          },
          {
            dataIndex: ['unixTimestamp'],
            defaultTitle: 'Unix时间戳秒',
          },
        ];

        const templateCreator = new TemplateCreator({
          collection: HttpUser,
          columns,
        });

        const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
        const worksheet = template.Sheets[template.SheetNames[0]];
        XLSX.utils.sheet_add_aoa(worksheet, [['http-test', 45789, 45789, 45789]], { origin: 'A2' });
        worksheet['B2'].z = 'yyyy-mm-dd';
        worksheet['C2'].z = 'yyyy-mm-dd';
        worksheet['D2'].z = 'yyyy-mm-dd';

        filePath = path.join(process.cwd(), `tmp-import-date-${Date.now()}.xlsx`);
        fs.writeFileSync(filePath, XLSX.write(template, { type: 'buffer', bookType: 'xlsx' }));

        const res = await httpApp
          .agent()
          .set('X-Timezone', '+08:00')
          .resource('http_import_users')
          .importXlsx({
            file: filePath,
            values: {
              columns: JSON.stringify(columns),
            },
          });

        expect(res.status).toBe(200);

        const user = await HttpUser.repository.findOne({
          filter: {
            name: 'http-test',
          },
        });

        expect(moment(user.get('datetime')).toISOString()).toEqual('2025-05-11T16:00:00.000Z');
        expect(user.get('datetimeNoTz')).toBe('2025-05-12 00:00:00');
        expect(moment(user.get('unixTimestamp')).toISOString()).toEqual('2025-05-11T16:00:00.000Z');
      } finally {
        await httpApp.destroy();
        if (filePath) {
          fs.rmSync(filePath, { force: true });
        }
      }
    });
  });

  describe('import with select fields', () => {
    let User;
    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name', title: '姓名' },
          {
            uiSchema: {
              enum: [
                {
                  value: '123',
                  label: 'Label123',
                  color: 'orange',
                },
                {
                  value: '223',
                  label: 'Label223',
                  color: 'lime',
                },
              ],
              type: 'array',
              'x-component': 'Select',
              'x-component-props': {
                mode: 'multiple',
              },
              title: 'multi-select',
            },
            defaultValue: [],
            name: 'multiSelect',
            type: 'array',
            interface: 'multipleSelect',
          },
          {
            uiSchema: {
              enum: [
                {
                  value: '123',
                  label: 'Label123',
                  color: 'orange',
                },
                {
                  value: '223',
                  label: 'Label223',
                  color: 'lime',
                },
              ],
              type: 'string',
              'x-component': 'Select',
              title: 'select',
            },
            name: 'select',
            type: 'string',
            interface: 'select',
          },
        ],
      });

      await app.db.sync();
    });

    it('should import select field with label and value', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['multiSelect'],
          defaultTitle: '多选',
        },
        {
          dataIndex: ['select'],
          defaultTitle: '单选',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'Label123,223', 'Label123']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      expect(await User.repository.count()).toBe(1);

      const user = await User.repository.findOne();

      expect(user.get('multiSelect')).toEqual(['123', '223']);
      expect(user.get('select')).toBe('123');
    });

    it('should validate values in multiple select field', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['multiSelect'],
          defaultTitle: '多选',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'abc']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
    it('should validate values in select field', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['select'],
          defaultTitle: '单选',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'abc']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
  });

  describe('import with belongs to association', async () => {
    let Profile;
    let User;

    beforeEach(async () => {
      Profile = app.db.collection({
        name: 'profiles',
        autoGenId: false,
        fields: [
          {
            type: 'bigInt',
            name: 'id',
            primaryKey: true,
            autoIncrement: true,
          },
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'userName',
          },
          {
            type: 'belongsTo',
            name: 'user',
            target: 'users',
            foreignKey: 'userName',
            targetKey: 'name',
          },
        ],
      });

      User = app.db.collection({
        name: 'users',
        autoGenId: false,
        fields: [
          {
            type: 'bigInt',
            name: 'id',
            primaryKey: true,
            autoIncrement: true,
          },
          {
            type: 'string',
            name: 'name',
            unique: true,
          },
        ],
      });

      await app.db.sync();

      const user = await User.repository.create({
        values: {
          name: 'User1',
        },
      });
    });

    it('should import with foreignKey', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['userName'],
          defaultTitle: '用户名',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'User1']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      await importer.run();

      const profile = await Profile.repository.findOne({
        appends: ['user'],
      });

      expect(profile.get('user').get('name')).toBe('User1');
      expect(profile.get('name')).toBe('test');
    });

    it('should import with association field', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['user', 'name'],
          defaultTitle: '用户名',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'User1']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      await importer.run();

      const profile = await Profile.repository.findOne({
        appends: ['user'],
      });

      expect(profile.get('user').get('name')).toBe('User1');
      expect(profile.get('name')).toBe('test');
    });
  });

  describe('import with associations', () => {
    let User;
    let Post;
    let Tag;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'hasMany',
            name: 'posts',
            target: 'posts',
            interface: 'o2m',
            foreignKey: 'userId',
          },
        ],
      });

      Post = app.db.collection({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsTo',
            name: 'user',
            target: 'users',
            interface: 'm2o',
          },
          {
            type: 'belongsToMany',
            name: 'tags',
            target: 'tags',
            interface: 'm2m',
            through: 'postsTags',
          },
        ],
      });

      Tag = app.db.collection({
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'belongsToMany',
            name: 'posts',
            target: 'posts',
            interface: 'm2m',
            through: 'postsTags',
          },
        ],
      });

      await app.db.sync();
    });

    it('should import many to many with id', async () => {
      await Tag.repository.create({
        values: [
          {
            title: 't1',
          },
          {
            title: 't2',
          },
        ],
      });

      const columns = [
        {
          dataIndex: ['title'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['tags', 'id'],
          defaultTitle: 'IDS',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Post,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', '1,2'],
          ['test2', 1],
        ],
        {
          origin: 'A2',
        },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        columns,
        workbook: template,
      });

      await importer.run();

      const posts = await Post.repository.find({
        appends: ['tags'],
      });

      expect(posts.length).toBe(2);

      expect(posts[0]['tags'].map((item: any) => item.id)).toEqual([1, 2]);
      expect(posts[1]['tags'].map((item: any) => item.id)).toEqual([1]);
    });

    it('should validate to many association', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['posts', 'title'],
          defaultTitle: '标题',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', '测试标题']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });

    it('should validate to one association', async () => {
      const columns = [
        {
          dataIndex: ['title'],
          defaultTitle: '标题',
        },
        {
          dataIndex: ['user', 'name'],
          defaultTitle: '用户名',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Post,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test title', 'test user']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
  });

  it('should report validation error message on not null validation', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          allowNull: false,
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [[null, 'test@qq.com']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    let error;

    try {
      await importer.run();
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
  });

  it('should report validation error message on unique validation', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User1', 'test@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    let error;

    try {
      await importer.run();
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
  });

  it('should keep boolean field nullable when cell value is empty', async () => {
    const BooleanUser = app.db.collection({
      name: 'booleanUsers',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'boolean', name: 'isActive', interface: 'boolean', allowNull: true },
      ],
    });

    await app.db.sync();

    const columns = [
      { dataIndex: ['name'], defaultTitle: '姓名' },
      { dataIndex: ['isActive'], defaultTitle: '是否启用' },
    ];

    const templateCreator = new TemplateCreator({
      collection: BooleanUser,
      columns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', '是'],
        ['User2', null],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: BooleanUser,
      columns,
      workbook: template,
    });

    await importer.run();

    const user1 = await BooleanUser.repository.findOne({
      filter: {
        name: 'User1',
      },
    });

    const user2 = await BooleanUser.repository.findOne({
      filter: {
        name: 'User2',
      },
    });

    expect(user1.get('isActive')).toBe(true);
    expect(user2.get('isActive')).toBeNull();
  });

  it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should import with number field', async () => {
    const User = app.db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          type: 'bigInt',
          interface: 'integer',
          name: 'bigInt',
        },
        {
          type: 'float',
          interface: 'percent',
          name: 'percent',
        },
        {
          type: 'float',
          interface: 'float',
          name: 'float',
        },
        {
          type: 'boolean',
          interface: 'boolean',
          name: 'boolean',
        },
      ],
    });

    await app.db.sync();

    const columns = [
      {
        dataIndex: ['id'],
        defaultTitle: 'ID',
      },
      {
        dataIndex: ['bigInt'],
        defaultTitle: 'bigInt',
      },
      {
        dataIndex: ['percent'],
        defaultTitle: '百分比',
      },
      {
        dataIndex: ['float'],
        defaultTitle: '浮点数',
      },
      {
        dataIndex: ['boolean'],
        defaultTitle: '布尔值',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: User,
      columns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [1, '1238217389217389217', '10%', 0.1, '是'],
        [2, 123123, '20%', 0.2, '0'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns,
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const user1 = await User.repository.findOne({
      filter: {
        id: 1,
      },
    });

    const user1Json = user1.toJSON();

    expect(user1Json['bigInt']).toBe('1238217389217389217');
    expect(user1Json['percent']).toBe(0.1);
    expect(user1Json['float']).toBe(0.1);
    expect(user1Json['boolean']).toBe(true);

    const user2 = await User.repository.findOne({
      filter: {
        id: 2,
      },
    });

    const user2Json = user2.toJSON();
    expect(user2Json['bigInt']).toBe(123123);
    expect(user2Json['percent']).toBe(0.2);
    expect(user2Json['float']).toBe(0.2);
    expect(user2Json['boolean']).toBe(false);
  });

  it('should not reset id seq if not import id field', async () => {
    const User = app.db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User2', 'test2@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    const testFn = vi.fn();
    importer.on('seqReset', testFn);

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const user3 = await User.repository.create({
      values: {
        name: 'User3',
        email: 'test3@test.com',
      },
    });

    expect(user3.get('id')).toBe(3);
    expect(testFn).not.toBeCalled();
  });

  it('should validate workbook with error', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['column1', 'column2'],
        ['row21', 'row22'],
      ],
      {
        origin: 'A1',
      },
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook,
    });

    let error;
    try {
      await importer.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
  });

  it('should validate workbook true', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    // insert a row for test
    const worksheet = template.Sheets[template.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(worksheet, [['User1', 'test@test.com']], {
      origin: 'A2',
    });

    let error;
    try {
      await importer.getData();
    } catch (e) {
      error = e;
    }

    expect(error).toBeFalsy();
  });

  it('should import with associations', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    const Tag = app.db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    const Comments = app.db.collection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'content',
        },
        {
          type: 'belongsTo',
          name: 'user',
          interface: 'm2o',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
          through: 'postsTags',
          interface: 'm2m',
        },
        {
          type: 'hasMany',
          name: 'comments',
          interface: 'o2m',
        },
      ],
    });

    await app.db.sync();

    await User.repository.create({
      values: {
        name: 'User1',
        email: 'u1@test.com',
      },
    });

    await Tag.repository.create({
      values: [
        {
          name: 'Tag1',
        },
        {
          name: 'Tag2',
        },
        {
          name: 'Tag3',
        },
      ],
    });

    await Comments.repository.create({
      values: [
        {
          content: 'Comment1',
        },
        {
          content: 'Comment2',
        },
        {
          content: 'Comment3',
        },
      ],
    });

    const importColumns = [
      {
        dataIndex: ['title'],
        defaultTitle: '标题',
      },
      {
        dataIndex: ['content'],
        defaultTitle: '内容',
      },
      {
        dataIndex: ['user', 'name'],
        defaultTitle: '作者',
      },
      {
        dataIndex: ['tags', 'name'],
        defaultTitle: '标签',
      },
      {
        dataIndex: ['comments', 'content'],
        defaultTitle: '评论',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: Post,
      columns: importColumns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['Post1', 'Content1', 'User1', 'Tag1,Tag2', 'Comment1,Comment2'],
        ['Post2', 'Content2', 'User1', 'Tag2,Tag3', 'Comment3'],
        ['Post3', 'Content3', 'User1', 'Tag3', ''],
        ['Post4', '', '', ''],
        ['Post5', null, null, null],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      columns: importColumns,
      workbook: template,
    });

    await importer.run();

    expect(await Post.repository.count()).toBe(5);
  });

  it('should import data with xlsx', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User2', 'test2@test.com'],
      ],
      {
        origin: 'A3',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);
  });

  it('should throw error when import failed', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User1', 'test2@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    let error;
    try {
      await importer.run();
    } catch (e) {
      error = e;
    }

    expect(await User.repository.count()).toBe(0);
    expect(error).toBeTruthy();
  });

  it('should import data with multiline explain and field descriptions', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      explain: '这是第一行说明\n这是第二行说明',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
          description: '请输入用户姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
          description: '请输入有效的邮箱地址',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const headerRowIndex = templateCreator.getHeaderRowIndex();

    console.log({ headerRowIndex });
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User2', 'test2@test.com'],
      ],
      {
        origin: `A${headerRowIndex + 1}`,
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
          description: '请输入用户姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
          description: '请输入有效的邮箱地址',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const users = await User.repository.find();
    expect(users[0].get('name')).toBe('User1');
    expect(users[0].get('email')).toBe('test@test.com');
    expect(users[1].get('name')).toBe('User2');
    expect(users[1].get('email')).toBe('test2@test.com');
  });

  describe('template creator', () => {
    it('should create template with explain and field descriptions', async () => {
      const User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'email',
          },
        ],
      });

      const templateCreator = new TemplateCreator({
        collection: User,
        explain: '这是导入说明\n第二行说明',
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
            description: '请输入用户姓名',
          },
          {
            dataIndex: ['email'],
            defaultTitle: '邮箱',
            description: '请输入有效的邮箱地址',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // 验证说明文本
      expect(data[0][0]).toBe('这是导入说明');
      expect(data[1][0]).toBe('第二行说明');
      // 验证空行
      expect(data[2][0]).toBe('');
      // 验证字段描述
      expect(data[3][0]).toBe('姓名：请输入用户姓名');
      expect(data[4][0]).toBe('邮箱：请输入有效的邮箱地址');
      // 验证表头
      expect(data[5]).toEqual(['姓名', '邮箱']);
    });

    it('should create template with only field descriptions', async () => {
      const User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });

      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
            description: '请输入用户姓名',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // 验证字段描述
      expect(data[0][0]).toBe('姓名：请输入用户姓名');
      // 验证表头
      expect(data[1]).toEqual(['姓名']);
    });

    it('should create template with only explain', async () => {
      const User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });

      const templateCreator = new TemplateCreator({
        collection: User,
        explain: '这是导入说明',
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // 验证说明文本
      expect(data[0][0]).toBe('这是导入说明');
      // 验证表头
      expect(data[1]).toEqual(['姓名']);
    });
  });

  it('should import data with single column', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['User1'], ['User2']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);
    const users = await User.repository.find();
    expect(users[0].get('name')).toBe('User1');
    expect(users[1].get('name')).toBe('User2');
  });

  it('should import with associations by target key', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'tags',
          type: 'belongsToMany',
          through: 'post_tag',
          targetKey: 'name',
          interface: 'm2m',
        },
      ],
    });

    const Tag = app.db.collection({
      name: 'tags',
      fields: [
        {
          name: 'name',
          type: 'string',
          unique: true,
        },
      ],
    });

    await app.db.sync();

    await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const templateCreator = new TemplateCreator({
      collection: Post,
      columns: [
        {
          dataIndex: ['title'],
          defaultTitle: '标题',
        },
        {
          dataIndex: ['tags', 'name'],
          defaultTitle: 'TagsName',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['Post1', 't1']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      columns: [
        {
          dataIndex: ['title'],
          defaultTitle: '标题',
        },
        {
          dataIndex: ['tags', 'name'],
          defaultTitle: 'TagsName',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await Post.repository.count()).toBe(1);
  });

  it('should filter no permission columns', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['User1', 'test@test.com']], {
      origin: 'A3',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });
    await importer.run({
      context: {
        permission: {
          can: { params: { fields: ['name'] } },
        },
      },
    });

    expect(await User.repository.count()).toBe(1);
    const user = await User.repository.findOne();
    expect(user.get('name')).toBe('User1');
    expect(user.get('email')).not.exist;
  });

  it('should import time field successfully', async () => {
    const TimeCollection = app.db.collection({
      name: 'time_tests',
      fields: [
        {
          type: 'time',
          name: 'brithtime',
          interface: 'time',
        },
      ],
    });

    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: TimeCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['birthtime'],
          defaultTitle: '出生时间',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [[0.5084722222222222]], { origin: 'A3' });
    worksheet['A3'].z = 'h:mm:ss';

    const buffer = XLSX.write(template, { type: 'buffer', bookType: 'xlsx' });
    const workbook = readImportWorkbook(buffer, 10);

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: TimeCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['brithtime'],
          defaultTitle: '出生时间',
        },
      ],
      workbook,
    });

    await importer.run();
    const records = await TimeCollection.repository.find();
    expect(records).toHaveLength(1);
    expect(records[0].get('brithtime')).toBe('12:12:12');
  });

  it('should throw error when import textarea field, value is date', async () => {
    const TextareaCollection = app.db.collection({
      name: 'textarea_tests',
      fields: [
        {
          interface: 'textarea',
          type: 'text',
          name: 'long_text',
        },
      ],
    });

    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: TextareaCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['long_text'],
          defaultTitle: '多行文本',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [[new Date()]], {
      origin: 'A3',
    });

    const buffer = XLSX.write(template, { type: 'buffer', bookType: 'xlsx' });
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: TextareaCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['long_text'],
          defaultTitle: '多行文本',
        },
      ],
      workbook,
    });

    await expect(importer.run()).rejects.toThrow();
  });

  it('should import password field, insert data is encrypt', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'password', name: 'password' },
      ],
    });
    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['password'],
          defaultTitle: '密码',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['zhangsan', '123456']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['password'],
          defaultTitle: '密码',
        },
      ],
      workbook: template,
    });

    await importer.run();

    const pwd = User.getField<PasswordField>('password');
    const user = await User.model.findOne({ where: { name: 'zhangsan' } });
    expect(await pwd.verify('123456', user.password)).toBeTruthy();
  });

  it('should skip blank rows when importing data from Excel', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });
    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const worksheet = template.Sheets[template.SheetNames[0]];

    // 在第2行和第10行插入数据，中间留空多行
    XLSX.utils.sheet_add_aoa(worksheet, [['zhangsan']], {
      origin: 'A2',
    });
    XLSX.utils.sheet_add_aoa(worksheet, [['lisi']], {
      origin: 'A10',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
      ],
      workbook: template,
    });

    await importer.run();

    const count = await User.repository.count();
    expect(count).toBe(2);
  });

  it('should import a template that was edited in Numbers and re-saved (production round-trip)', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await app.db.sync();

    const columns = [{ dataIndex: ['title'], defaultTitle: 'Title' }];

    // Real-world fixture: a template downloaded from NocoBase, opened in
    // Apple Numbers, populated with one row, and re-saved as .xlsx.
    // Numbers' xlsx output trips up the production read path.
    const buffer = fs.readFileSync(path.resolve(__dirname, './fixtures/posts-numbers-edited.xlsx'));

    // Mirror the production read path in `getWorkbookWithBuffer`
    // (packages/pro-plugins/.../utils/auto-mode.ts).
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      WTF: true,
      dense: true,
      cellDates: true,
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      columns,
      workbook,
    });

    await importer.run();

    const posts = await Post.repository.find();
    expect(posts).toHaveLength(1);
    expect(posts[0].get('title')).toBe('test1');
  });
});

describe('importer with specical field type', () => {
  let app: MockServer;

  afterEach(async () => {
    await app.destroy();
  });

  describe('china region field', () => {
    beforeEach(async () => {
      app = await createMockServer({
        plugins: ['field-china-region'],
      });
    });

    it('should import china region field', async () => {
      const Post = app.db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          {
            type: 'belongsToMany',
            target: 'chinaRegions',
            through: 'userRegions',
            targetKey: 'code',
            interface: 'chinaRegion',
            name: 'region',
          },
        ],
      });

      await app.db.sync();

      const columns = [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['region'],
          defaultTitle: 'region',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Post,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['post0', '山西省/长治市/潞城区'],
          ['post1', ''],
          ['post2', null],
        ],
        {
          origin: 'A2',
        },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        columns,
        workbook: template,
      });

      await importer.run();

      expect(await Post.repository.count()).toBe(3);

      const post = await Post.repository.findOne({
        appends: ['region'],
      });

      expect(post.get('region').map((item: any) => item.code)).toEqual(['14', '1404', '140406']);
    });
  });

  describe('sequence field', () => {
    beforeEach(async () => {
      app = await createMockServer({
        plugins: ['field-sequence'],
      });
    });

    it('should reset id seq after import id field', async () => {
      const User = app.db.collection({
        name: 'users',
        autoGenId: false,
        fields: [
          {
            type: 'bigInt',
            name: 'id',
            primaryKey: true,
            autoIncrement: true,
          },
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'email',
          },
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              {
                type: 'integer',
                options: { key: 1 },
              },
            ],
          },
        ],
      });

      await app.db.sync();

      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['id'],
            defaultTitle: 'ID',
          },
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
          },
          {
            dataIndex: ['email'],
            defaultTitle: '邮箱',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [1, 'User1', 'test@test.com'],
          [2, 'User2', 'test2@test.com'],
        ],
        {
          origin: 'A2',
        },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns: [
          {
            dataIndex: ['id'],
            defaultTitle: 'ID',
          },
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
          },
          {
            dataIndex: ['email'],
            defaultTitle: '邮箱',
          },
        ],
        workbook: template,
      });

      const testFn = vi.fn();
      importer.on('seqReset', testFn);

      await importer.run();

      expect(await User.repository.count()).toBe(2);

      const user3 = await User.repository.create({
        values: {
          name: 'User3',
          email: 'test3@test.com',
        },
      });

      expect(user3.get('id')).toBe(3);

      // In MySQL/SQLite, AUTO_INCREMENT is automatically updated when inserting with explicit id,
      // so seqReset event is only triggered in PostgreSQL where manual sequence reset is needed
      if (process.env['DB_DIALECT'] === 'postgres') {
        expect(testFn).toBeCalled();
      }
    });
  });

  describe('row index in error reports', () => {
    let User;
    let Profile;

    beforeEach(async () => {
      app = await createMockServer();
      User = app.db.collection({
        name: 'users',
        fields: [{ type: 'string', name: 'name' }],
      });

      Profile = app.db.collection({
        name: 'profiles',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'belongsTo', name: 'user', target: 'users', interface: 'm2o' },
        ],
      });

      await app.db.sync();
      await User.repository.create({ values: { name: 'ValidUser' } });
    });

    const buildImporter = async (badRowIndex: number, totalRows: number, chunkSize?: number) => {
      const columns = [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['user', 'name'], defaultTitle: 'User' },
      ];

      const templateCreator = new TemplateCreator({ collection: Profile, columns });
      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      const rows: string[][] = [];
      for (let i = 1; i <= totalRows; i++) {
        if (i === badRowIndex) {
          rows.push([`name${i}`, 'NonExistentUser']);
        } else {
          rows.push([`name${i}`, 'ValidUser']);
        }
      }
      XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A2' });

      return new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
        ...(chunkSize ? { chunkSize } : {}),
      });
    };

    it('should report the actual row index when a parse error occurs in a single chunk', async () => {
      // 12 data rows, row 12 is bad. Default chunkSize (1000) means single chunk.
      const importer = await buildImporter(12, 12);

      let error: any;
      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ImportValidationError');
      expect(error.params?.rowIndex).toBe(12);
    });

    it('should report the actual row index when a parse error occurs across multiple chunks', async () => {
      // chunkSize=5, 12 data rows, row 12 is bad. The bad row falls in the third chunk.
      const importer = await buildImporter(12, 12, 5);

      let error: any;
      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ImportValidationError');
      expect(error.params?.rowIndex).toBe(12);
    });

    it('should report the actual row index when the first row of a non-first chunk fails', async () => {
      // chunkSize=5, 12 data rows, row 6 is bad (first row of second chunk).
      const importer = await buildImporter(6, 12, 5);

      let error: any;
      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ImportValidationError');
      expect(error.params?.rowIndex).toBe(6);
    });
  });
});
