import { Association, HasOne, Includeable, Model, ModelStatic, Op, Transaction } from 'sequelize';
import lodash from 'lodash';
import Database from '../database';
import { OptionsParser } from '../options-parser';
import { appendChildCollectionNameAfterRepositoryFind } from '../listeners/append-child-collection-name-after-repository-find';

interface EagerLoadingNode {
  model: ModelStatic<any>;
  association: Association;
  attributes: Array<string>;
  rawAttributes: Array<string>;
  children: Array<EagerLoadingNode>;
  parent?: EagerLoadingNode;
  instances?: Array<Model>;
  order?: any;
  where?: any;
  inspectInheritAttribute?: boolean;
}

const pushAttribute = (node, attribute) => {
  if (lodash.isArray(node.attributes) && !node.attributes.includes(attribute)) {
    node.attributes.push(attribute);
  }
};

const EagerLoadingNodeProto = {
  afterBuild(db: Database) {
    const collection = db.modelCollection.get(this.model);

    if (collection && collection.isParent()) {
      if (!this.attributes) {
        this.attributes = {
          include: [],
        };
      }

      OptionsParser.appendInheritInspectAttribute(
        lodash.isArray(this.attributes) ? this.attributes : this.attributes.include,
        collection,
      );

      this.inspectInheritAttribute = true;
    }
  },
};

export class EagerLoadingTree {
  public root: EagerLoadingNode;
  db: Database;

  constructor(root: EagerLoadingNode) {
    this.root = root;
  }

  static buildFromSequelizeOptions(options: {
    model: ModelStatic<any>;
    rootAttributes: Array<string>;
    rootOrder?: any;
    includeOption: Includeable | Includeable[];
    db: Database;
  }): EagerLoadingTree {
    const { model, rootAttributes, includeOption, db } = options;

    const buildNode = (node) => {
      Object.setPrototypeOf(node, EagerLoadingNodeProto);
      node.afterBuild(db);
      return node;
    };

    const root = buildNode({
      model,
      association: null,
      rawAttributes: lodash.cloneDeep(rootAttributes),
      attributes: lodash.cloneDeep(rootAttributes),
      order: options.rootOrder,
      children: [],
    });

    const traverseIncludeOption = (includeOption, eagerLoadingTreeParent) => {
      const includeOptions = lodash.castArray(includeOption);

      if (includeOption.length > 0) {
        const modelPrimaryKey = eagerLoadingTreeParent.model.primaryKeyAttribute;
        pushAttribute(eagerLoadingTreeParent, modelPrimaryKey);
      }

      for (const include of includeOptions) {
        // skip fromFilter include option
        if (include.fromFilter) {
          continue;
        }

        const association = lodash.isString(include.association)
          ? eagerLoadingTreeParent.model.associations[include.association]
          : include.association;

        const associationType = association.associationType;

        const child = buildNode({
          model: association.target,
          association,
          rawAttributes: lodash.cloneDeep(include.attributes),
          attributes: lodash.cloneDeep(include.attributes),
          parent: eagerLoadingTreeParent,
          where: include.where,
          children: [],
        });

        if (associationType == 'HasOne' || associationType == 'HasMany') {
          const { sourceKey, foreignKey } = association;

          pushAttribute(eagerLoadingTreeParent, sourceKey);
          pushAttribute(child, foreignKey);
        }

        if (associationType == 'BelongsTo') {
          const { targetKey, foreignKey } = association;

          pushAttribute(eagerLoadingTreeParent, foreignKey);
          pushAttribute(child, targetKey);
        }

        if (associationType == 'BelongsToMany') {
          const { sourceKey } = association;
          pushAttribute(eagerLoadingTreeParent, sourceKey);
        }

        eagerLoadingTreeParent.children.push(child);

        if (include.include) {
          traverseIncludeOption(include.include, child);
        }
      }
    };

    traverseIncludeOption(includeOption, root);

    const tree = new EagerLoadingTree(root);
    tree.db = db;
    return tree;
  }

  async load(pks: Array<string | number>, transaction?: Transaction) {
    const result = {};

    const orderOption = (association) => {
      const targetModel = association.target;
      const order = [];

      if (targetModel.primaryKeyAttribute && targetModel.rawAttributes[targetModel.primaryKeyAttribute].autoIncrement) {
        order.push([targetModel.primaryKeyAttribute, 'ASC']);
      }

      return order;
    };

    const loadRecursive = async (node, ids) => {
      const modelPrimaryKey = node.model.primaryKeyAttribute;

      let instances = [];

      // load instances from database
      if (!node.parent) {
        const findOptions = {
          where: { [modelPrimaryKey]: ids },
          attributes: node.attributes,
        };

        if (node.order) {
          findOptions['order'] = node.order;
        }

        instances = await node.model.findAll({
          ...findOptions,
          transaction,
        });
      } else if (ids.length > 0) {
        const association = node.association;
        const associationType = association.associationType;

        if (associationType == 'HasOne' || associationType == 'HasMany') {
          const foreignKey = association.foreignKey;
          const foreignKeyValues = node.parent.instances.map((instance) => instance.get(association.sourceKey));

          let where: any = { [foreignKey]: foreignKeyValues };
          if (node.where) {
            where = {
              [Op.and]: [where, node.where],
            };
          }

          const findOptions = {
            where,
            attributes: node.attributes,
            order: orderOption(association),
            transaction,
          };

          instances = await node.model.findAll(findOptions);
        }

        if (associationType == 'BelongsTo') {
          const foreignKey = association.foreignKey;

          const parentInstancesForeignKeyValues = node.parent.instances.map((instance) => instance.get(foreignKey));

          instances = await node.model.findAll({
            transaction,
            where: {
              [association.targetKey]: parentInstancesForeignKeyValues,
            },
            attributes: node.attributes,
          });
        }

        if (associationType == 'BelongsToMany') {
          const foreignKeyValues = node.parent.instances.map((instance) => instance.get(association.sourceKey));

          const pivotAssoc = new HasOne(association.target, association.through.model, {
            as: '_pivot_',
            foreignKey: association.otherKey,
            sourceKey: association.targetKey,
          });

          instances = await node.model.findAll({
            transaction,
            attributes: node.attributes,
            include: [
              {
                association: pivotAssoc,
                where: {
                  [association.foreignKey]: foreignKeyValues,
                },
              },
            ],
            order: orderOption(association),
          });
        }
      }

      node.instances = instances;

      for (const child of node.children) {
        const nodeIds = instances.map((instance) => instance.get(modelPrimaryKey));

        await loadRecursive(child, nodeIds);
      }

      // merge instances to parent
      if (!node.parent) {
        return;
      } else {
        const association = node.association;
        const associationType = association.associationType;

        const setParentAccessor = (parentInstance) => {
          const key = association.as;

          const children = parentInstance.getDataValue(association.as);

          if (association.isSingleAssociation) {
            const isEmpty = !children;
            parentInstance[key] = parentInstance.dataValues[key] = isEmpty ? null : children;
          } else {
            const isEmpty = !children || children.length == 0;
            parentInstance[key] = parentInstance.dataValues[key] = isEmpty ? [] : children;
          }
        };

        if (associationType == 'HasMany' || associationType == 'HasOne') {
          const foreignKey = association.foreignKey;
          const sourceKey = association.sourceKey;

          for (const instance of node.instances) {
            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(sourceKey) == instance.get(foreignKey),
            );

            if (parentInstance) {
              if (associationType == 'HasMany') {
                const children = parentInstance.getDataValue(association.as);
                if (!children) {
                  parentInstance.setDataValue(association.as, [instance]);
                } else {
                  children.push(instance);
                }
              }

              if (associationType == 'HasOne') {
                const key = association.options.realAs || association.as;
                parentInstance[key] = parentInstance.dataValues[key] = instance;
              }
            }
          }
        }

        if (associationType == 'BelongsTo') {
          const foreignKey = association.foreignKey;
          const targetKey = association.targetKey;

          for (const instance of node.instances) {
            const parentInstances = node.parent.instances.filter(
              (parentInstance) => parentInstance.get(foreignKey) == instance.get(targetKey),
            );

            for (const parentInstance of parentInstances) {
              parentInstance.setDataValue(association.as, instance);
            }
          }
        }

        if (associationType == 'BelongsToMany') {
          const sourceKey = association.sourceKey;
          const foreignKey = association.foreignKey;

          const as = association.oneFromTarget.as;

          for (const instance of node.instances) {
            // set instance accessor
            instance[as] = instance.dataValues[as] = instance['_pivot_'];
            delete instance.dataValues['_pivot_'];
            delete instance['_pivot_'];

            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(sourceKey) == instance.dataValues[as].get(foreignKey),
            );

            if (parentInstance) {
              const children = parentInstance.getDataValue(association.as);

              if (!children) {
                parentInstance.setDataValue(association.as, [instance]);
              } else {
                children.push(instance);
              }
            }
          }
        }

        for (const parent of node.parent.instances) {
          setParentAccessor(parent);
        }
      }
    };

    await loadRecursive(this.root, pks);

    const appendChildCollectionName = appendChildCollectionNameAfterRepositoryFind(this.db);

    const setInstanceAttributes = (node) => {
      if (node.inspectInheritAttribute) {
        appendChildCollectionName({
          findOptions: {},
          data: node.instances,
          dataCollection: this.db.modelCollection.get(node.model),
        });
      }

      // if no attributes are specified, return empty fields
      const nodeRawAttributes = node.rawAttributes || [];

      if (!lodash.isArray(nodeRawAttributes)) {
        return;
      }

      const nodeChildrenAs = node.children.map((child) => child.association.as);

      const includeAttributes = [...nodeRawAttributes, ...nodeChildrenAs];

      if (node.inspectInheritAttribute) {
        includeAttributes.push('__schemaName', '__tableName', '__collection');
      }

      for (const instance of node.instances) {
        const attributes = lodash.pick(instance.dataValues, includeAttributes);
        instance.dataValues = attributes;
      }
    };

    // traverse tree and set instance attributes
    const traverse = (node) => {
      setInstanceAttributes(node);

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(this.root);
    return result;
  }
}
