import Database, { Repository } from '@nocobase/database';
import { CollectionRepository } from '@nocobase/plugin-collection-manager';
import { Plugin } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import collectionTemplates from './collection-templates';
import fieldInterfaces from './field-interfaces';

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
      defaults.fields.map((field) => {
        field.collectionName = defaults.name;
        const f = mockCollectionField(field);
        f.collectionName = defaults.name;
        return f;
      });
      return defaults;
    };

    const mockCollectionField = (options) => {
      options.sort = 1;
      options.key = uid();
      if (options.interface) {
        const fn = fieldInterfaces[options.interface];
        if (fn) {
          Object.assign(options, fn(options));
        }
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
      'collections:mock': async (ctx, next) => {
        const { values } = ctx.action.params;
        const items = Array.isArray(values) ? values : [values || {}];
        const collections = [];
        const collectionFields = [];
        for (const item of items) {
          const { fields = [], ...opts } = mockCollection(item);
          collections.push(opts);
          collectionFields.push(...fields);
        }
        const db = ctx.db as Database;
        const collectionsRepository = db.getRepository('collections') as CollectionRepository;
        const fieldsRepository = db.getRepository('fields') as Repository;
        await db.sequelize.transaction(async (transaction) => {
          await Promise.all(
            collections.map((collection) =>
              collectionsRepository.firstOrCreate({
                values: collection,
                filterKeys: ['name'],
                hooks: false,
                transaction,
              }),
            ),
          );
          await Promise.all(
            collectionFields.map((collectionField) =>
              fieldsRepository.firstOrCreate({
                values: collectionField,
                filterKeys: ['name', 'collectionName'],
                hooks: false,
                transaction,
              }),
            ),
          );
        });

        await collectionsRepository.load();
        await db.sync();
        ctx.body = await collectionsRepository.find({
          filter: {
            name: collections.map((c) => c.name),
          },
          appends: ['fields'],
        });
        await next();
      },
    });
  }
}

export default PluginMockCollectionsServer;
