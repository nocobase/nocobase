/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import fs from 'fs';
import JSZip from 'jszip';
import moment from 'moment';
import path from 'path';
import { XlsxExporter } from '../services/xlsx-exporter';
import { Workbook } from 'exceljs';

function getXlsxData(worksheet) {
  const data = worksheet.getSheetValues()[2];
  return data.slice(1);
}

async function readWorksheetXml(filePath: string) {
  const zip = await JSZip.loadAsync(await fs.promises.readFile(filePath));
  const worksheetFile = zip.file('xl/worksheets/sheet1.xml');

  if (!worksheetFile) {
    throw new Error('worksheet XML not found');
  }

  return worksheetFile.async('string');
}

async function readStylesXml(filePath: string) {
  const zip = await JSZip.loadAsync(await fs.promises.readFile(filePath));
  const stylesFile = zip.file('xl/styles.xml');

  if (!stylesFile) {
    throw new Error('styles XML not found');
  }

  return stylesFile.async('string');
}

describe('export to xlsx with preset', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'map', 'field-china-region'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('export with date field', () => {
    let Post;

    beforeEach(async () => {
      Post = app.db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          {
            name: 'datetime',
            type: 'datetime',
            interface: 'datetime',
            uiSchema: {
              'x-component-props': { picker: 'date', dateFormat: 'YYYY-MM-DD', gmt: false, showTime: false, utc: true },
              type: 'string',
              'x-component': 'DatePicker',
              title: 'dateTz',
            },
          },
          {
            name: 'dateOnly',
            type: 'dateOnly',
            interface: 'date',
            defaultToCurrentTime: false,
            onUpdateToCurrentTime: false,
            timezone: true,
          },
          {
            name: 'datetimeNoTz',
            type: 'datetimeNoTz',
            interface: 'datetimeNoTz',
            uiSchema: {
              'x-component-props': { picker: 'date', dateFormat: 'YYYY-MM-DD', gmt: false, showTime: false, utc: true },
              type: 'string',
              'x-component': 'DatePicker',
              title: 'dateTz',
            },
          },
          {
            name: 'unixTimestamp',
            type: 'unixTimestamp',
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

    it('should export with datetime field', async () => {
      await Post.repository.create({
        values: {
          title: 'p1',
          datetime: '2024-05-10T01:42:35.000Z',
          dateOnly: '2024-05-10',
          datetimeNoTz: '2024-01-01 00:00:00',
          unixTimestamp: '2024-05-10T01:42:35.000Z',
        },
      });
      const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
      const exporter = new XlsxExporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        chunkSize: 10,
        columns: [
          { dataIndex: ['title'], defaultTitle: 'Title' },
          {
            dataIndex: ['datetime'],
            defaultTitle: 'datetime',
          },
          {
            dataIndex: ['dateOnly'],
            defaultTitle: 'dateOnly',
          },
          {
            dataIndex: ['datetimeNoTz'],
            defaultTitle: 'datetimeNoTz',
          },
          {
            dataIndex: ['unixTimestamp'],
            defaultTitle: 'unixTimestamp',
          },
        ],
        outputPath: xlsxFilePath,
      });

      await exporter.run();

      try {
        const workbook = new Workbook();
        await workbook.xlsx.readFile(xlsxFilePath);
        const worksheet = workbook.getWorksheet(1);
        const firstUser = getXlsxData(worksheet);

        expect(firstUser[1]).toEqual('2024-05-10');
        expect(firstUser[2]).toEqual('2024-05-10');
        expect(firstUser[3]).toEqual('2024-01-01');
        expect(firstUser[4]).toEqual('2024-05-10 01:42:35');
      } finally {
        exporter.cleanOutputFile();
      }
    });
  });

  it('should export with checkbox field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'boolean',
          name: 'test_field',
          interface: 'checkbox',
          uiSchema: {
            type: 'boolean',
            'x-component': 'Checkbox',
          },
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        test_field: true,
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['test_field'],
          defaultTitle: 'test_field',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const data = getXlsxData(worksheet);

      expect(data[1]).toBe('True');
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export number field with cell format', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'integer', name: 'integer' },
        { type: 'float', name: 'float' },
        { type: 'decimal', name: 'decimal', scale: 3, precision: 12 },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: [
        {
          title: 'p1',
          integer: 123,
          float: 123.456,
          decimal: 234.567,
        },
        {
          title: 'p2',
          integer: 456,
          float: 456.789,
          decimal: 345.678,
        },
      ],
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'title' },
        {
          dataIndex: ['integer'],
          defaultTitle: 'integer',
        },
        {
          dataIndex: ['float'],
          defaultTitle: 'float',
        },
        {
          dataIndex: ['decimal'],
          defaultTitle: 'decimal',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(2)
        .map((row: any[]) => row?.slice(1));

      // cell type should be number and values as expected
      expect(sheetData[0][0]).toBe('p1');
      expect(sheetData[0][1]).toBe(123);
      expect(sheetData[0][2]).toBeCloseTo(123.456);
      expect(sheetData[0][3]).toBeCloseTo(234.567);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export number interface value as numeric cell', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'float',
          name: 'estimate',
          interface: 'number',
          uiSchema: {
            'x-component-props': {
              step: 0.01,
            },
          },
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        estimate: 12.3,
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'title' },
        { dataIndex: ['estimate'], defaultTitle: 'estimate' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const estimateCell = worksheet.getCell('B2');

      expect(estimateCell.value).toBe(12.3);
      expect(typeof estimateCell.value).toBe('number');
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with map field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          name: 'circle',
          type: 'circle',
          interface: 'circle',
          uiSchema: {
            'x-component-props': { mapType: 'amap' },
            type: 'void',
            'x-component': 'Map',
            'x-component-designer': 'Map.Designer',
            title: 'circle',
          },
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        circle: [116.397428, 39.90923, 3241],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['circle'],
          defaultTitle: 'circle',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['Title', 'circle']);
      const firstUser = sheetData[1];
      expect(firstUser[1]).toEqual('116.397428,39.90923,3241');
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with attachment field', async () => {
    const defaultStorage = await app.db.getRepository('storages').findOne();
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          name: 'attachment1',
          type: 'belongsToMany',
          interface: 'attachment',
          uiSchema: {
            'x-component-props': {
              accept: 'image/*',
              multiple: true,
            },
            type: 'array',
            'x-component': 'Upload.Attachment',
            title: 'attachment1',
          },
          target: 'attachments',
          storage: 'local',
          through: 'postsAttachments',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        attachment1: [
          {
            title: 'nocobase-logo1',
            filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
            extname: '.png',
            mimetype: 'image/png',
            url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/test1.png',
            storageId: defaultStorage.id,
          },
          {
            title: 'nocobase-logo2',
            filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
            extname: '.png',
            mimetype: 'image/png',
            storageId: defaultStorage.id,
          },
        ],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['attachment1'],
          defaultTitle: 'attachment',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const header = sheetData[0];
    expect(header).toEqual(['Title', 'attachment']);
    const firstUser = sheetData[1];
    expect(firstUser[1]).toEqual(
      'https://nocobase.oss-cn-beijing.aliyuncs.com/test1.png,/storage/uploads/682e5ad037dd02a0fe4800a3e91c283b.png',
    );
    exporter.cleanOutputFile();
  });

  it('should escape formula injection for exported text-like field values', async () => {
    const payloads = {
      input: "=1+cmd|' /C calc'!A0",
      textarea: '+SUM(1,1)',
      richText: '-SUM(1,1)',
      markdown: '@SUM(1,1)',
      vditor: '=VDITOR(1)',
      code: '=CODE(1)',
      url: '=HYPERLINK("https://example.com","open")',
      email: '=EMAIL(1)',
      phone: '=PHONE(1)',
      attachmentUrl: '=ATTACHMENTURL(1)',
      color: '=COLOR(1)',
      icon: '=ICON(1)',
      select: '=HYPERLINK(1,1)',
      radio: '=RADIO(1)',
      radioGroup: '=RADIOGROUP(1)',
      multipleSelect: '=WEBSERVICE(1)',
      checkboxGroup: '=CHECKBOXGROUP(1)',
      checkboxes: '=CHECKBOXES(1)',
      formulaString: '=FORMULA(1)',
      relation: '=DDE(1,1)',
    };

    const Category = app.db.collection({
      name: 'formula_injection_categories',
      autoGenId: false,
      fields: [
        { type: 'bigInt', name: 'categoryPk', interface: 'number', primaryKey: true },
        { type: 'string', name: 'name', interface: 'input' },
      ],
    });

    const Post = app.db.collection({
      name: 'formula_injection_posts',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'number', primaryKey: true, autoIncrement: true },
        { type: 'string', name: 'inputField', interface: 'input' },
        { type: 'text', name: 'textareaField', interface: 'textarea' },
        { type: 'text', name: 'richTextField', interface: 'richText' },
        { type: 'text', name: 'markdownField', interface: 'markdown' },
        { type: 'text', name: 'vditorField', interface: 'vditor' },
        { type: 'text', name: 'codeField', interface: 'code' },
        { type: 'text', name: 'urlField', interface: 'url' },
        { type: 'string', name: 'emailField', interface: 'email' },
        { type: 'string', name: 'phoneField', interface: 'phone' },
        { type: 'string', name: 'attachmentUrlField', interface: 'attachmentURL' },
        { type: 'string', name: 'colorField', interface: 'color' },
        { type: 'string', name: 'iconField', interface: 'icon' },
        {
          type: 'string',
          name: 'selectField',
          interface: 'select',
          uiSchema: {
            enum: [{ value: 'malicious', label: payloads.select }],
          },
        },
        {
          type: 'string',
          name: 'radioField',
          interface: 'radio',
          uiSchema: {
            enum: [{ value: 'malicious', label: payloads.radio }],
          },
        },
        {
          type: 'string',
          name: 'radioGroupField',
          interface: 'radioGroup',
          uiSchema: {
            enum: [{ value: 'malicious', label: payloads.radioGroup }],
          },
        },
        {
          type: 'array',
          name: 'multipleSelectField',
          interface: 'multipleSelect',
          uiSchema: {
            enum: [
              { value: 'malicious', label: payloads.multipleSelect },
              { value: 'safe', label: 'safe' },
            ],
          },
        },
        {
          type: 'array',
          name: 'checkboxGroupField',
          interface: 'checkboxGroup',
          uiSchema: {
            enum: [
              { value: 'malicious', label: payloads.checkboxGroup },
              { value: 'safe', label: 'safe' },
            ],
          },
        },
        {
          type: 'array',
          name: 'checkboxesField',
          interface: 'checkboxes',
          uiSchema: {
            enum: [
              { value: 'malicious', label: payloads.checkboxes },
              { value: 'safe', label: 'safe' },
            ],
          },
        },
        { type: 'string', name: 'formulaSourceField', interface: 'input' },
        {
          type: 'formula',
          name: 'formulaStringField',
          expression: '{{formulaSourceField}}',
          engine: 'formula.js',
          dataType: 'string',
        },
        { type: 'dateOnly', name: 'dateField', interface: 'date' },
        { name: 'categoryRef', type: 'bigInt', interface: 'number' },
        {
          type: 'belongsTo',
          name: 'category',
          target: 'formula_injection_categories',
          foreignKey: 'categoryRef',
          targetKey: 'categoryPk',
        },
      ],
    });

    await app.db.sync();

    const category = await Category.repository.create({
      values: {
        categoryPk: 10001,
        name: payloads.relation,
      },
    });
    const categoryPk = String(category.get('categoryPk'));

    await Post.repository.create({
      values: {
        inputField: payloads.input,
        textareaField: payloads.textarea,
        richTextField: payloads.richText,
        markdownField: payloads.markdown,
        vditorField: payloads.vditor,
        codeField: payloads.code,
        urlField: payloads.url,
        emailField: payloads.email,
        phoneField: payloads.phone,
        attachmentUrlField: payloads.attachmentUrl,
        colorField: payloads.color,
        iconField: payloads.icon,
        selectField: 'malicious',
        radioField: 'malicious',
        radioGroupField: 'malicious',
        multipleSelectField: ['malicious', 'safe'],
        checkboxGroupField: ['malicious', 'safe'],
        checkboxesField: ['malicious', 'safe'],
        formulaSourceField: payloads.formulaString,
        dateField: '2024-05-10',
        categoryRef: category.get('categoryPk'),
        category: {
          categoryPk: category.get('categoryPk'),
        },
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['id'], defaultTitle: 'ID' },
        { dataIndex: ['inputField'], defaultTitle: 'Input' },
        { dataIndex: ['textareaField'], defaultTitle: 'Textarea' },
        { dataIndex: ['richTextField'], defaultTitle: 'Rich text' },
        { dataIndex: ['markdownField'], defaultTitle: 'Markdown' },
        { dataIndex: ['vditorField'], defaultTitle: 'Vditor' },
        { dataIndex: ['codeField'], defaultTitle: 'Code' },
        { dataIndex: ['urlField'], defaultTitle: 'URL' },
        { dataIndex: ['emailField'], defaultTitle: 'Email' },
        { dataIndex: ['phoneField'], defaultTitle: 'Phone' },
        { dataIndex: ['attachmentUrlField'], defaultTitle: 'Attachment URL' },
        { dataIndex: ['colorField'], defaultTitle: 'Color' },
        { dataIndex: ['iconField'], defaultTitle: 'Icon' },
        { dataIndex: ['selectField'], defaultTitle: 'Select' },
        { dataIndex: ['radioField'], defaultTitle: 'Radio' },
        { dataIndex: ['radioGroupField'], defaultTitle: 'Radio group' },
        { dataIndex: ['multipleSelectField'], defaultTitle: 'Multiple select' },
        { dataIndex: ['checkboxGroupField'], defaultTitle: 'Checkbox group' },
        { dataIndex: ['checkboxesField'], defaultTitle: 'Checkboxes' },
        { dataIndex: ['formulaStringField'], defaultTitle: 'String formula' },
        { dataIndex: ['dateField'], defaultTitle: 'Date' },
        { dataIndex: ['category', 'name'], defaultTitle: 'Association field' },
        { dataIndex: ['categoryRef'], defaultTitle: 'Foreign key' },
        { dataIndex: ['category', 'categoryPk'], defaultTitle: 'Association primary key' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const worksheetXml = await readWorksheetXml(xlsxFilePath);
      const stylesXml = await readStylesXml(xlsxFilePath);
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);

      expect(worksheet.getCell('A2').value).toBe('1');
      expect(worksheetXml).toContain('<c r="A2" t="str"><v>1</v></c>');
      expect(worksheet.getCell('B2').value).toBe(payloads.input);
      expect(worksheet.getCell('C2').value).toBe(payloads.textarea);
      expect(worksheet.getCell('D2').value).toBe(payloads.richText);
      expect(worksheet.getCell('E2').value).toBe(payloads.markdown);
      expect(worksheet.getCell('F2').value).toBe(payloads.vditor);
      expect(worksheet.getCell('G2').value).toBe(payloads.code);
      expect(worksheet.getCell('H2').value).toBe(payloads.url);
      expect(worksheet.getCell('I2').value).toBe(payloads.email);
      expect(worksheet.getCell('J2').value).toBe(payloads.phone);
      expect(worksheet.getCell('K2').value).toBe(payloads.attachmentUrl);
      expect(worksheet.getCell('L2').value).toBe(payloads.color);
      expect(worksheet.getCell('M2').value).toBe(payloads.icon);
      expect(worksheet.getCell('N2').value).toBe(payloads.select);
      expect(worksheet.getCell('O2').value).toBe(payloads.radio);
      expect(worksheet.getCell('P2').value).toBe(payloads.radioGroup);
      expect(worksheet.getCell('Q2').value).toBe(`${payloads.multipleSelect},safe`);
      expect(worksheet.getCell('R2').value).toBe(`${payloads.checkboxGroup},safe`);
      expect(worksheet.getCell('S2').value).toBe(`${payloads.checkboxes},safe`);
      expect(worksheet.getCell('T2').value).toBe(payloads.formulaString);
      expect(worksheet.getCell('U2').value).toBe('2024-05-10');
      expect(worksheet.getCell('V2').value).toBe(payloads.relation);
      expect(worksheet.getCell('W2').value).toBe(categoryPk);
      expect(worksheet.getCell('X2').value).toBe(categoryPk);
      expect(worksheetXml).toContain(`<c r="W2" t="str"><v>${categoryPk}</v></c>`);
      expect(worksheetXml).toContain(`<c r="X2" t="str"><v>${categoryPk}</v></c>`);
      expect(worksheet.getCell('B2').numFmt).toBe('@');
      expect(stylesXml).toContain('numFmtId="49"');
      expect(worksheetXml).toContain('<v>=1+cmd|&apos; /C calc&apos;!A0</v>');
      expect(worksheetXml).not.toContain('<v>&apos;=1+cmd|&apos; /C calc&apos;!A0</v>');
      expect(worksheetXml).not.toContain('&apos;2024-05-10');
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with china region field', async () => {
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

    await Post.repository.create({
      values: {
        title: 'post0',
        region: [{ code: '14' }, { code: '1404' }, { code: '140406' }],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['region'],
          defaultTitle: 'region',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const header = sheetData[0];
    expect(header).toEqual(['Title', 'region']);
    const firstUser = sheetData[1];
    expect(firstUser).toEqual(['post0', '山西省/长治市/潞城区']);
    exporter.cleanOutputFile();
  });
});

describe('export to xlsx', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['action-export'],
    });
  });

  afterEach(async () => {
    await app.destroy();
    vi.unstubAllEnvs();
  });

  it('should throw error when export field not exists', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'some_title',
        json: {
          a: {
            b: 'c',
          },
        },
      },
    });

    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [{ dataIndex: ['json'], defaultTitle: '' }],
    });

    let error: any;
    try {
      await exporter.run({});
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('not found');
  });

  it('should export with json field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'json',
          type: 'json',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'some_title',
        json: {
          a: {
            b: 'c',
          },
        },
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: '' },
        {
          dataIndex: ['json'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run({});

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const firstUser = sheetData[1];
      expect(firstUser).toEqual([
        'some_title',
        JSON.stringify({
          a: {
            b: 'c',
          },
        }),
      ]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with datetime field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          uiSchema: {
            'x-component-props': { dateFormat: 'YYYY-MM-DD', gmt: false, showTime: true, timeFormat: 'HH:mm:ss' },
            type: 'string',
            'x-component': 'DatePicker',
            title: 'test_date',
          },
          name: 'test_date',
          type: 'datetime',
          interface: 'datetime',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'some_title',
        test_date: '2024-05-10T01:42:35.000Z',
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: '' },
        {
          dataIndex: ['test_date'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const firstUser = sheetData[1];
    expect(firstUser).toEqual(['some_title', '2024-05-10 01:42:35']);
    exporter.cleanOutputFile();
  });

  it('should export with multi select', async () => {
    const User = app.db.collection({
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
      ],
    });

    await app.db.sync();

    await User.repository.create({
      values: {
        name: 'u1',
        multiSelect: ['123', '223'],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['multiSelect'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const firstUser = sheetData[1];
    expect(firstUser).toEqual(['u1', 'Label123,Label223']);
    exporter.cleanOutputFile();
  });

  it('should export with different ui schema', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name', title: '姓名' },
        { type: 'integer', name: 'age', title: '年龄' },
        {
          type: 'integer',
          name: 'testInterface',
          interface: 'testInterface',
          title: 'Interface 测试',
          uiSchema: { test: 'testValue' },
        },
      ],
    });

    class TestInterface extends BaseInterface {
      toString(value, ctx) {
        return `${this.options.uiSchema.test}.${value}`;
      }
    }

    app.db.interfaceManager.registerInterfaceType('testInterface', TestInterface);

    await app.db.sync();
    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
        testInterface: index,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['testInterface'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['姓名', 'Interface 测试']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 'testValue.0']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with custom title', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name', title: '姓名' },
        { type: 'integer', name: 'age', title: '年龄' },
      ],
    });

    await app.db.sync();
    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], title: '123', defaultTitle: 'Name' },
        { dataIndex: ['age'], title: '345', defaultTitle: 'Age' },
      ],
      findOptions: {
        filter: {
          age: {
            $gt: 9,
          },
        },
      },
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['123', '345']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with empty title', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name', title: '姓名' },
        { type: 'integer', name: 'age', title: '年龄' },
      ],
    });

    await app.db.sync();
    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      findOptions: {
        filter: {
          age: {
            $gt: 9,
          },
        },
      },
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['姓名', '年龄']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with filter', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      findOptions: {
        filter: {
          age: {
            $gt: 9,
          },
        },
      },
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(11); // 10 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user10', 10]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with associations', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
        },
        {
          type: 'belongsToMany',
          name: 'groups',
          target: 'groups',
          through: 'usersGroups',
        },
        {
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users' },
      ],
    });

    const Group = app.db.collection({
      name: 'groups',
      fields: [{ type: 'string', name: 'name' }],
    });

    await app.db.sync();

    const [group1, group2, group3] = await Group.repository.create({
      values: [{ name: 'group1' }, { name: 'group2' }, { name: 'group3' }],
    });

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
        groups: [
          {
            id: group1.get('id'),
          },
          {
            id: group2.get('id'),
          },
          {
            id: group3.get('id'),
          },
        ],
        posts: Array.from({ length: 3 }).map((_, postIndex) => {
          return {
            title: `post${postIndex}`,
          };
        }),
      };
    });

    await User.repository.create({
      values,
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
        { dataIndex: ['posts', 'title'], defaultTitle: 'Post Title' },
        { dataIndex: ['groups', 'name'], defaultTitle: 'Group Names' },
        { dataIndex: ['createdAt'], defaultTitle: 'Created at' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(23); // 22 users * 3 posts + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age', 'Post Title', 'Group Names', 'Created at']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual([
        'user0',
        0,
        'post0,post1,post2',
        'group1,group2,group3',
        moment().format('YYYY-MM-DD'),
      ]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export data to xlsx', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(23); // 22 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 0]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with different ui schema in associations', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
        },
        {
          type: 'belongsToMany',
          name: 'groups',
          target: 'groups',
          through: 'usersGroups',
        },
        {
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users' },
      ],
    });

    const Group = app.db.collection({
      name: 'groups',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'integer',
          name: 'testInterface',
          interface: 'testInterface',
          title: 'Associations interface 测试',
          uiSchema: { test: 'testValue' },
        },
      ],
    });

    class TestInterface extends BaseInterface {
      toString(value, ctx) {
        return `${this.options.uiSchema.test}.${value}`;
      }
    }

    app.db.interfaceManager.registerInterfaceType('testInterface', TestInterface);

    await app.db.sync();

    const [group1, group2, group3] = await Group.repository.create({
      values: [
        { name: 'group1', testInterface: 1 },
        { name: 'group2', testInterface: 2 },
        { name: 'group3', testInterface: 3 },
      ],
    });

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
        groups: [
          {
            id: group1.get('id'),
          },
          {
            id: group2.get('id'),
          },
          {
            id: group3.get('id'),
          },
        ],
        posts: Array.from({ length: 3 }).map((_, postIndex) => {
          return {
            title: `post${postIndex}`,
          };
        }),
      };
    });

    await User.repository.create({
      values,
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['groups', 'testInterface'],
          defaultTitle: 'Test Field',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Associations interface 测试']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 'testValue.1,testValue.2,testValue.3']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should respect the EXPORT_LIMIT env variable', async () => {
    vi.stubEnv('EXPORT_LIMIT', '30'); // Set a small limit

    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 100 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(31); // 30 users + 1 header
      expect(sheetData[0]).toEqual(['Name', 'Age']); // header
      expect(sheetData[1]).toEqual(['user0', 0]); // first user
      expect(sheetData[30]).toEqual(['user29', 29]); // last user
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should use default EXPORT_LIMIT (2000) when env not set', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 2500 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(2001); // 2000 users + 1 header
      expect(sheetData[0]).toEqual(['Name', 'Age']); // header
      expect(sheetData[1]).toEqual(['user0', 0]); // first user
      expect(sheetData[2000]).toEqual(['user1999', 99]); // last user
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should respect the limit option when exporting data', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 100 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      limit: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(11); // 10 users + 1 header
      expect(sheetData[0]).toEqual(['Name', 'Age']); // header
      expect(sheetData[1]).toEqual(['user0', 0]); // first user
      expect(sheetData[10]).toEqual(['user9', 9]); // last user
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should import rich text field successfully when long text', async () => {
    const Test = app.db.collection({
      name: 'tests',
      fields: [
        {
          interface: 'richText',
          type: 'text',
          name: 'richText',
        },
      ],
    });

    await app.db.sync();
    const data = require('./data/rich-text.json');
    const longText = data.longText;
    await Test.repository.create({
      values: {
        richText: longText,
      },
    });
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Test,
      chunkSize: 10,
      limit: 10,
      columns: [{ dataIndex: ['richText'], defaultTitle: 'richText' }],
    });
    await exporter.run();
    const buffer = exporter.getXlsxBuffer();
    exporter.cleanOutputFile();
    expect(buffer).exist;
  });
});

describe('export to xlsx with belongsToArray field', () => {
  let app: MockServer;
  let db: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'field-m2m-array'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should export with belongsToArray virtual field', async () => {
    // Create target collection
    await db.getRepository('collections').create({
      values: {
        name: 'test_tags',
        fields: [
          { type: 'string', name: 'code', unique: true },
          { type: 'string', name: 'title' },
        ],
      },
    });

    // Create source collection with belongsToArray field
    await db.getRepository('collections').create({
      values: {
        name: 'test_users',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'belongsToArray',
            name: 'tags',
            foreignKey: 'tag_ids',
            target: 'test_tags',
            targetKey: 'code',
          },
        ],
      },
    });

    // Load collections and sync
    await db.getRepository('collections').load();
    await db.sync();

    // Create test data
    await db.getRepository('test_tags').create({
      values: [
        { code: 'a', title: 'Tag A' },
        { code: 'b', title: 'Tag B' },
        { code: 'c', title: 'Tag C' },
      ],
    });

    await db.getRepository('test_users').create({
      values: [
        { name: 'User 1', tag_ids: ['a', 'b'] },
        { name: 'User 2', tag_ids: ['b', 'c'] },
      ],
    });

    const User = db.getCollection('test_users');
    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['tags', 'title'], defaultTitle: 'Tags' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));

      expect(sheetData.length).toBe(3); // 2 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Tags']);

      // Check that tags are properly loaded and exported
      const firstUser = sheetData[1];
      expect(firstUser[0]).toEqual('User 1');
      expect(firstUser[1]).toContain('Tag A');
      expect(firstUser[1]).toContain('Tag B');

      const secondUser = sheetData[2];
      expect(secondUser[0]).toEqual('User 2');
      expect(secondUser[1]).toContain('Tag B');
      expect(secondUser[1]).toContain('Tag C');
    } finally {
      exporter.cleanOutputFile();
    }
  });
});
