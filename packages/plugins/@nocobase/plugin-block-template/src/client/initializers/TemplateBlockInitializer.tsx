/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItem, usePlugin, ISchema, useSchemaInitializer } from '@nocobase/client';
import React, { useState, useRef, useEffect } from 'react';
import { CopyOutlined, LoadingOutlined } from '@ant-design/icons';
import { Input, Divider, Empty } from 'antd';
import * as _ from 'lodash';
import { uid } from '@nocobase/utils/client';
import PluginBlockTemplateClient from '..';
import { useT } from '../locale';
import { useBlockTemplateMenus } from '../components/BlockTemplateMenusProvider';
import { useMemoizedFn } from 'ahooks';
import { findBlockRootSchema } from '../utils/schema';

export function convertTplBlock(
  tpl,
  virtual = false,
  isRoot = true,
  newRootId?: string,
  templateKey?: string,
  options?: any,
) {
  if (!newRootId) {
    newRootId = uid();
  }
  // 如果是Grid, Grid.Row, Grid.Col, 则复制一份
  if (tpl['x-component'] === 'Grid' || tpl['x-component'] === 'Grid.Row' || tpl['x-component'] === 'Grid.Col') {
    const newSchema = _.cloneDeep({
      ...tpl,
      'x-uid': uid(), // 生成一个新的uid
      properties: {},
    });
    if (virtual) {
      newSchema['x-virtual'] = true;
    }
    if (newSchema['x-decorator'] === 'TemplateGridDecorator') {
      delete newSchema['x-decorator'];
    }
    if (newSchema['x-linkage-rules']) {
      // linkage rules 有可能保存在Grid组件中
      delete newSchema['x-linkage-rules'];
    }
    for (const key in tpl.properties) {
      const t = convertTplBlock(tpl.properties[key], virtual, isRoot, newRootId, templateKey, options);
      if (isRoot) {
        newRootId = uid(); // 多个区块支持，每个Grid.Row都要生成一个新的uid
      }
      if (t) {
        newSchema.properties[key] = t;
      }
    }
    return newSchema;
  } else {
    const newSchema = {
      // ...tpl,
      // 'x-component': rootComponent === tpl ? 'XTemplate' : tpl['x-component'],
      // 'x-decorator': tpl['x-decorator'],
      // type: rootComponent ? 'void' : tpl.type,
      // name: tpl.name,
      'x-uid': `${newRootId}-${tpl['x-uid']}`,
      'x-template-uid': tpl['x-uid'],
      properties: {},
    };
    if (virtual) {
      newSchema['x-virtual'] = true;
    }
    if (tpl['x-settings']) {
      newSchema['x-settings'] = tpl['x-settings'];
    }
    if (isRoot) {
      newSchema['x-template-root-uid'] = tpl['x-uid'];
      newSchema['x-uid'] = newRootId;
      newSchema['x-template-version'] = '1.0';
    }

    blockKeepProps.forEach((prop) => {
      if (_.hasIn(tpl, prop)) {
        _.set(newSchema, prop, _.get(tpl, prop));
      }
    });

    if (templateKey) {
      newSchema['x-block-template-key'] = templateKey;
    }

    // custom request action will saved in other schema
    if (tpl['x-component'] === 'CustomRequestAction') {
      newSchema['x-custom-request-id'] = tpl['x-custom-request-id'] || tpl['x-uid'];
    }

    // association field will saved in other schema
    if (tpl['x-component'] === 'Action' && _.get(tpl, 'x-action-settings.schemaUid')) {
      newSchema['x-action-settings'] = {
        schemaUid: '',
      };
    }

    if (!tpl['x-component']) {
      newSchema['x-no-component'] = true;
    }

    // filter should be in tpl
    if (_.get(tpl, 'x-filter-targets')) {
      newSchema['x-filter-targets'] = tpl['x-filter-targets'];
    }
    for (const key in tpl.properties) {
      newSchema.properties[key] = convertTplBlock(tpl.properties[key], virtual, false, newRootId, templateKey);
    }
    if (isRoot && options) {
      schemaPatch(newSchema, options);
    }

    return newSchema;
  }
}

export const blockKeepProps = [
  'x-decorator',
  'x-decorator-props.collection',
  'x-decorator-props.association',
  'x-decorator-props.dataSource',
  'x-decorator-props.action',
  'x-decorator-props.params',
  'x-acl-action',
  'x-settings',
  'x-use-decorator-props',
  'x-is-current',
];

export function formSchemaPatch(currentSchema: ISchema, options?: any) {
  const { collectionName, dataSourceName, association, currentRecord } = options;

  if (currentRecord) {
    currentSchema['x-decorator-props'] = {
      action: 'get',
      collection: collectionName,
      association: association,
      dataSource: dataSourceName,
    };
    currentSchema['x-data-templates'] = {
      display: false,
    };
    currentSchema['x-acl-action'] = `${association || collectionName}:update`;
    currentSchema['x-settings'] = 'blockSettings:editForm';
    currentSchema['x-use-decorator-props'] = 'useEditFormBlockDecoratorProps';
    currentSchema['x-is-current'] = true;

    const comKey = Object.keys(currentSchema.properties)[0];
    if (comKey) {
      const actionKey = Object.keys(currentSchema['properties'][comKey]['properties']).find((key) => {
        return key !== 'grid';
      });
      if (actionKey) {
        _.set(currentSchema, `properties.['${comKey}'].x-use-component-props`, 'useEditFormBlockProps');
        _.set(
          currentSchema,
          `properties.['${comKey}'].properties.['${actionKey}'].x-initializer`,
          'editForm:configureActions',
        );

        const actionBarSchema = _.get(currentSchema, `properties.${comKey}.properties.${actionKey}.properties`, {});
        for (const key in actionBarSchema) {
          if (actionBarSchema[key]['x-settings']?.includes('createSubmit')) {
            actionBarSchema[key]['x-settings'] = 'actionSettings:updateSubmit';
            if (actionBarSchema[key]['x-use-component-props'] !== 'useStepsFormSubmitActionProps') {
              actionBarSchema[key]['x-use-component-props'] = 'useUpdateActionProps';
            }
          }
        }
      }
    }
  } else {
    currentSchema['x-decorator-props'] = {
      collection: collectionName,
      association: association,
      dataSource: dataSourceName,
    };
  }
}

function detailsSchemaPatch(currentSchema: ISchema, options?: any) {
  const { collectionName, dataSourceName, association, currentRecord, associationType } = options;
  currentSchema['x-decorator-props'] = {
    action: 'list',
    collection: association ? null : collectionName,
    association: association,
    dataSource: dataSourceName,
    readPretty: true,
    params: {
      pageSize: 1,
    },
  };
  currentSchema['x-acl-action'] = `${association || collectionName}:view`; //currentSchema['x-acl-action'].replace(':get', ':view');
  currentSchema['x-settings'] = 'blockSettings:detailsWithPagination';
  currentSchema['x-use-decorator-props'] = 'useDetailsWithPaginationDecoratorProps';

  if (currentRecord || associationType === 'hasOne' || associationType === 'belongsTo') {
    currentSchema['x-acl-action'] = `${association || collectionName}:get`;
    currentSchema['x-decorator-props']['action'] = 'get';
    currentSchema['x-settings'] = 'blockSettings:details';
    currentSchema['x-use-decorator-props'] = 'useDetailsDecoratorProps';
  }

  if (currentRecord) {
    currentSchema['x-is-current'] = true;
  }
}

function nestedSchemaPatch(currentSchema: ISchema) {
  // Handle child blocks recursively
  if (currentSchema.properties && currentSchema['x-decorator-props']?.association) {
    const processChildBlock = (schema: ISchema, parentAssociation?: string) => {
      const decoratorName = schema['x-decorator'];

      // If this is a DetailsBlockProvider or FormBlockProvider
      if (decoratorName === 'DetailsBlockProvider' || decoratorName === 'FormBlockProvider') {
        if (!schema['x-decorator-props']?.association && parentAssociation) {
          const settings = schema['x-settings'];
          if (settings === 'blockSettings:editForm' || settings === 'blockSettings:details') {
            schema['x-decorator-props'].association = parentAssociation;
            schema['x-is-current'] = true;
            schema['x-acl-action'] = `${parentAssociation}:${schema['x-acl-action']?.split(':')[1]}`;
          }
        }
      }

      const decoratorProps = schema['x-decorator-props'];
      if (decoratorProps && decoratorProps.collection && !decoratorProps.association) {
        // the association is not set in parent datablock provider, so we don't need to process down
        return;
      }

      // Get the current block's association for its children
      const currentAssociation = decoratorProps?.association || parentAssociation;

      // Process children recursively
      if (schema.properties) {
        Object.values(schema.properties).forEach((childSchema) => {
          processChildBlock(childSchema, currentAssociation);
        });
      }
    };

    // Start processing from the root's immediate children
    Object.values(currentSchema.properties).forEach((childSchema) => {
      processChildBlock(childSchema, currentSchema['x-decorator-props']?.association);
    });
  }
}

function schemaPatch(currentSchema: ISchema, options?: any) {
  const { collectionName, dataSourceName, association } = options;

  const decoratorName = currentSchema['x-decorator'];
  if (decoratorName === 'DetailsBlockProvider') {
    detailsSchemaPatch(currentSchema, options);
  } else if (decoratorName === 'FormBlockProvider') {
    formSchemaPatch(currentSchema, options);
  } else if (decoratorName) {
    currentSchema['x-decorator-props'] = {
      action: 'list',
      collection: collectionName,
      association: association,
      dataSource: dataSourceName,
    };
  }

  nestedSchemaPatch(currentSchema);
  return currentSchema;
}

function getSchemaUidMaps(schema, idMap = {}) {
  if (schema['x-template-uid']) {
    idMap[schema['x-template-uid']] = schema['x-uid'];
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      getSchemaUidMaps(schema.properties[key], idMap);
    }
  }
  return idMap;
}

function correctIdReference(schema, idMaps) {
  const skipReplaceKeys = ['x-uid', 'x-template-uid', 'x-template-root-uid', 'x-custom-request-id'];
  for (const key in schema) {
    if (!skipReplaceKeys.includes(key)) {
      if (schema[key] && typeof schema[key] === 'string') {
        schema[key] = idMaps[schema[key]] || schema[key];
      }
      if (schema[key] && typeof schema[key] === 'object') {
        correctIdReference(schema[key], idMaps);
      }
    }
  }
}

export function correctIdReferences(schemas) {
  const idMaps = {};
  for (const schema of schemas) {
    _.merge(idMaps, getSchemaUidMaps(schema));
  }
  for (const schema of schemas) {
    correctIdReference(schema, idMaps);
  }
}

export function convertTemplateToBlock(data, templateKey?: string, options?: any) {
  // debugger;
  let tpls = data?.properties; // Grid开始的区块
  tpls = _.get(Object.values(tpls), '0.properties'); // Grid.Row开始的区块
  const schemas = [];
  // 遍历 tpl的所有属性，每一个属性其实是一个区块
  for (const key in tpls) {
    const tpl = tpls[key];
    const schema = convertTplBlock(tpl, false, true, undefined, templateKey, options);
    if (schema) {
      schemas.push(findBlockRootSchema(schema));
    }
  }

  return schemas;
}

const SearchInput = ({ value: outValue, onChange }) => {
  const [value, setValue] = useState<string>(outValue);
  const inputRef = useRef<any>('');
  const compositionRef = useRef<boolean>(false);
  const t = useT();

  useEffect(() => {
    setValue(outValue);
  }, [outValue]);

  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((v) => v.isIntersecting)) {
        focusInput();
      }
    });
    if (inputRef.current?.input) {
      observer.observe(inputRef.current.input);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!compositionRef.current) {
      onChange(e.target.value);
      setValue(e.target.value);
    }
  };

  const handleComposition = (e: React.CompositionEvent<HTMLInputElement> | any) => {
    if (e.type === 'compositionend') {
      compositionRef.current = false;
      handleChange(e);
    } else {
      compositionRef.current = true;
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        allowClear
        style={{ padding: '4px 8px', boxShadow: 'none', borderRadius: 0 }}
        bordered={false}
        placeholder={t('Search and select template')}
        value={value}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onChange={handleChange}
        onCompositionStart={handleComposition}
        onCompositionEnd={handleComposition}
        onCompositionUpdate={handleComposition}
      />
      <Divider style={{ margin: 0 }} />
    </div>
  );
};

export const TemplateBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const [searchValue, setSearchValue] = useState('');
  const t = useT();
  const { templates, handleTemplateClick, loading } = useBlockTemplateMenus();

  const filteredData = templates
    ?.filter((item) => !item.dataSource)
    .filter((item) => !searchValue || item.title.toLowerCase().includes(searchValue.toLowerCase()));

  const menuItems = [
    {
      key: 'search',
      label: (
        <SearchInput
          value={searchValue}
          onChange={(val: string) => {
            setSearchValue(val);
          }}
        />
      ),
      onClick: (e) => {
        e.domEvent.stopPropagation();
      },
    },
    ...(filteredData?.length
      ? filteredData.map((item) => ({
          label: item.title,
          ...item,
        }))
      : [
          {
            key: 'empty',
            style: {
              height: 150,
            },
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />
              </div>
            ),
          },
        ]),
  ];

  useEffect(() => {
    templates?.forEach((item) => {
      plugin.templateInfos.set(item.key, item);
    });
  }, [templates, plugin.templateInfos]);

  const onClick = useMemoizedFn((item) => {
    handleTemplateClick(item, {}, insert);
  });

  if (loading) {
    return (
      <div>
        <LoadingOutlined /> {t('Templates')}
      </div>
    );
  }

  return (
    <SchemaInitializerItem
      closeInitializerMenuWhenClick={true}
      title={'{{t("Block template")}}'}
      icon={<CopyOutlined style={{ marginRight: 0 }} />}
      items={menuItems}
      name={'templates'}
      onClick={onClick}
    />
  );
};
