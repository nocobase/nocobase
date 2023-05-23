import { Association, Includeable, Model, ModelStatic, Transaction } from 'sequelize';
import lodash from 'lodash';

interface EagerLoadingNode {
  model: ModelStatic<any>;
  association: Association;
  attributes: Array<string>;
  rawAttributes: Array<string>;
  children: Array<EagerLoadingNode>;
  parent?: EagerLoadingNode;
  instances?: Array<Model>;
  order?: any;
}

export class EagerLoadingTree {
  public root: EagerLoadingNode;

  constructor(root: EagerLoadingNode) {
    this.root = root;
  }

  static buildFromSequelizeOptions(options: {
    model: ModelStatic<any>;
    rootAttributes: Array<string>;
    rootOrder?: any;
    includeOption: Includeable | Includeable[];
  }): EagerLoadingTree {
    const { model, rootAttributes, includeOption } = options;

    const root = {
      model,
      association: null,
      rawAttributes: lodash.cloneDeep(rootAttributes),
      attributes: lodash.cloneDeep(rootAttributes),
      order: options.rootOrder,
      children: [],
    };

    const pushAttribute = (node, attribute) => {
      if (lodash.isArray(node.attributes) && !node.attributes.includes(attribute)) {
        node.attributes.push(attribute);
      }
    };

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

        const association = eagerLoadingTreeParent.model.associations[include.association];
        const associationType = association.associationType;

        const child = {
          model: association.target,
          association,
          rawAttributes: lodash.cloneDeep(include.attributes),
          attributes: lodash.cloneDeep(include.attributes),
          parent: eagerLoadingTreeParent,
          children: [],
        };

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

    return new EagerLoadingTree(root);
  }

  async load(pks: Array<string | number>, transaction?: Transaction) {
    const result = {};

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

          const findOptions = {
            where: { [foreignKey]: foreignKeyValues },
            attributes: node.attributes,
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

          instances = await node.model.findAll({
            transaction,
            attributes: node.attributes,
            include: [
              {
                association: association.oneFromTarget,
                where: {
                  [association.foreignKey]: foreignKeyValues,
                },
              },
            ],
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
                parentInstance.setDataValue(association.as, instance);
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

          const oneFromTarget = association.oneFromTarget;

          for (const instance of node.instances) {
            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(sourceKey) == instance[oneFromTarget.as].get(foreignKey),
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

    const setInstanceAttributes = (node) => {
      const nodeRawAttributes = node.rawAttributes;

      if (!lodash.isArray(nodeRawAttributes)) {
        return;
      }

      const nodeChildrenAs = node.children.map((child) => child.association.as);
      const includeAttributes = [...nodeRawAttributes, ...nodeChildrenAs];

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
