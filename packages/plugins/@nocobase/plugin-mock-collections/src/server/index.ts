import Database, { Collection, Repository } from '@nocobase/database';
import { CollectionRepository } from '@nocobase/plugin-collection-manager';
import { InstallOptions, Plugin } from '@nocobase/server';
import { merge, uid } from '@nocobase/utils';
import _ from 'lodash';
import collectionTemplates from './collection-templates';
import * as fieldInterfaces from './field-interfaces';
import { mockAttachment } from './field-interfaces';
import { Client } from 'pg';
import path from 'path';
import { promises as fs } from 'fs';

export class PluginMockCollectionsServer extends Plugin {
  async load() {
    const templates = collectionTemplates;

    const defaultFields = {
      id: () => ({
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
        interface: 'id',
      }),
      createdAt: () => ({
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
      }),
      createdBy: () => ({
        name: 'createdBy',
        interface: 'createdBy',
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'createdById',
        uiSchema: {
          type: 'object',
          title: '{{t("Created by")}}',
          'x-component': 'AssociationField',
          'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
          'x-read-pretty': true,
        },
      }),
      updatedAt: () => ({
        type: 'date',
        field: 'updatedAt',
        name: 'updatedAt',
        interface: 'updatedAt',
        uiSchema: {
          type: 'string',
          title: '{{t("Last updated at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      }),
      updatedBy: () => ({
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'updatedById',
        name: 'updatedBy',
        interface: 'updatedBy',
        uiSchema: {
          type: 'object',
          title: '{{t("Last updated by")}}',
          'x-component': 'AssociationField',
          'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
          'x-read-pretty': true,
        },
      }),
    };

    const mockCollection = (values) => {
      if (values.autoCreate || values.view) {
        if (!values.key) {
          values.key = uid();
        }
        if (Array.isArray(values.fields)) {
          values.fields = values.fields.map((f) => {
            if (!f.key) {
              f.key = uid();
            }
            return f;
          });
        }
        return values;
      }
      const defaults = {
        logging: true,
        autoGenId: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        sortable: true,
        template: 'general',
        view: false,
        sort: 1,
        name: `t_${uid()}`,
        ...values,
      };
      defaults.key = uid();
      if (!defaults.title) {
        defaults.title = defaults.name;
      }
      if (!defaults.fields?.length) {
        defaults.fields = [];
      }
      const fieldNames = defaults.fields.map((f) => f.name);
      const fn = templates[defaults.template] || templates.general;
      const { fields = [], ...others } = fn(defaults);
      Object.assign(defaults, others);
      for (const field of fields) {
        if (!fieldNames.includes(field.name)) {
          defaults.fields.push(field);
        }
      }
      if (['general', 'file', 'tree', 'calendar', 'expression'].includes(defaults.template)) {
        if (defaults.autoGenId && !fieldNames.includes('id')) {
          defaults.fields.push(defaultFields.id());
        }
        if (defaults.createdAt && !fieldNames.includes('createdAt')) {
          defaults.fields.push(defaultFields.createdAt());
        }
        if (defaults.updatedAt && !fieldNames.includes('updatedAt')) {
          defaults.fields.push(defaultFields.updatedAt());
        }
        if (defaults.createdBy && !fieldNames.includes('createdBy')) {
          defaults.fields.push(defaultFields.createdBy());
        }
        if (defaults.updatedBy && !fieldNames.includes('updatedBy')) {
          defaults.fields.push(defaultFields.updatedBy());
        }
        const foreignKeyFields = [];
        defaults.fields = defaults.fields.map((field) => {
          field.collectionName = defaults.name;
          const f = mockCollectionField(field);
          if (f.foreignKeyFields) {
            foreignKeyFields.push(...f.foreignKeyFields);
          }
          if (f.reverseField) {
            foreignKeyFields.push(f.reverseField);
          }
          if (f.throughCollection) {
            defaults['throughCollection'] = f.throughCollection;
          }
          f.collectionName = defaults.name;
          return _.omit(f, ['reverseField', 'throughCollection', 'foreignKeyFields']);
        });
        defaults.fields.push(...foreignKeyFields);
      }
      return defaults;
    };

    const mockCollectionField = (opts) => {
      let options = opts;
      options.sort = 1;
      if (options.interface) {
        const fn = fieldInterfaces[options.interface];
        if (fn) {
          const defaultValue = fn.options(options);
          options = merge(defaultValue, options);
        }
      }
      if (!options.key) {
        options.key = uid();
      }
      if (!options.name) {
        options.name = `f_${uid()}`;
      }
      if (options.title && options.uiSchema) {
        options.uiSchema.title = options.title;
      }
      if (options.uiSchema && !options.uiSchema.title) {
        options.uiSchema.title = options.name;
      }
      return options;
    };

    this.app.resourcer.registerActions({
      mock: async (ctx, next) => {
        const { resourceName } = ctx.action;
        const { values, count = 10 } = ctx.action.params;
        const mockCollectionData = async (collectionName, count = 1, depth = 0, maxDepth = 4) => {
          const collection = ctx.db.getCollection(collectionName) as Collection;
          const items = await Promise.all(
            _.range(count).map(async (i) => {
              if (collection.options.template === 'file') {
                return mockAttachment();
              }
              const v = {};
              if (collection.options.sortable) {
                v['sort'] = i + 1;
              }
              for (const field of collection.fields.values()) {
                if (!field.options.interface) {
                  continue;
                }
                if (depth >= maxDepth && ['m2o', 'm2m', 'o2m', 'obo', 'oho'].includes(field.options.interface)) {
                  continue;
                }
                const fn = fieldInterfaces[field.options.interface];
                if (fn?.mock) {
                  v[field.name] = await fn.mock(field.options, { mockCollectionData, maxDepth, depth });
                }
              }
              return v;
            }),
          );
          return count == 1 ? items[0] : items;
        };
        const repository = ctx.db.getRepository(resourceName);
        let size = count;
        if (Array.isArray(values)) {
          size = values.length;
        }
        const data = await mockCollectionData(resourceName, size);
        // ctx.body = {
        //   values: (Array.isArray(data) ? data : [data]).map((item, index) => {
        //     if (Array.isArray(values)) {
        //       return { ...item, ...values[index] };
        //     }
        //     return { ...item, ...values };
        //   }),
        // };
        ctx.body = await repository.create({
          values: (Array.isArray(data) ? data : [data]).map((item, index) => {
            if (Array.isArray(values)) {
              return { ...item, ...values[index] };
            }
            return { ...item, ...values };
          }),
        });
        await next();
      },
      'collections:mock': async (ctx, next) => {
        const { values } = ctx.action.params;
        const items = Array.isArray(values) ? values : [values || {}];
        const collections = [];
        const collectionFields = [];
        for (const item of items) {
          const { fields = [], throughCollection, ...opts } = mockCollection(item);
          collections.push(opts);
          if (throughCollection) {
            collections.push(throughCollection);
          }
          collectionFields.push(...fields);
        }
        // ctx.body = {
        //   collections,
        //   collectionFields,
        // };
        // await next();
        // return;
        const db = ctx.db as Database;
        const collectionsRepository = db.getRepository('collections') as CollectionRepository;
        const fieldsRepository = db.getRepository('fields') as Repository;
        await db.sequelize.transaction(async (transaction) => {
          for (const collection of collections) {
            try {
              await collectionsRepository.firstOrCreate({
                values: collection,
                filterKeys: ['name'],
                hooks: false,
                transaction,
              });
            } catch (error) {
              this.app.log.error(error.message, { collection });
              throw error;
            }
          }
          for (const collectionField of collectionFields) {
            try {
              await fieldsRepository.firstOrCreate({
                values: collectionField,
                filterKeys: ['name', 'collectionName'],
                hooks: false,
                transaction,
              });
            } catch (error) {
              this.app.log.error(error.message, { collectionField });
              throw error;
            }
          }
        });

        await collectionsRepository.load();
        await db.sync();
        const records = await collectionsRepository.find({
          filter: {
            name: collections.map((c) => c.name),
          },
          appends: ['fields'],
        });
        ctx.body = Array.isArray(values) ? records : records[0];
        await next();
      },
    });
  }

  async install(options?: InstallOptions) {
    const dbName = this.app.db.options.database;
    const externalDB = `${dbName}_external_test`;

    // create external database
    let client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT),
    });

    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS ${externalDB}`);
    await client.query(`CREATE DATABASE ${externalDB}`);
    await client.end();

    // import sql import external database
    client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      database: externalDB,
      port: parseInt(process.env.DB_PORT),
    });

    await client.connect();

    const sqlFile = path.resolve(__dirname, './external.sql');
    const sql: string = await fs.readFile(sqlFile, 'utf8');
    await client.query(sql);
    await client.end();
  }
}

export default PluginMockCollectionsServer;
