/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaInitializerItem,
  useRequest,
  useAPIClient,
  useDesignable,
  usePlugin,
  ISchema,
  useResource,
} from '@nocobase/client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CopyOutlined, LoadingOutlined } from '@ant-design/icons';
import { Input, Divider, Empty } from 'antd';
import * as _ from 'lodash';
import { uid } from '@nocobase/utils/client';
import PluginBlockTemplateClient from '..';
import { useT } from '../locale';
import PluginMobileClient from '@nocobase/plugin-mobile/client';
import { findBlockRootSchema } from '../utils/schema';

export function convertTplBlock(tpl, virtual = false, isRoot = true, newRootId?: string, templateKey?: string) {
  if (!newRootId) {
    newRootId = uid();
  }
  // 如果是Grid, Grid.Row, Grid.Col, 则复制一份
  if (tpl['x-component'] === 'Grid' || tpl['x-component'] === 'Grid.Row' || tpl['x-component'] === 'Grid.Col') {
    // const newTpl = cloneDeep(tpl);
    // TODO: 这么做内部的一些引用会丢失， 准备维护一个key的映射表，然后再遍历一次，替换掉引用
    const newTpl = _.cloneDeep({
      ...tpl,
      'x-virtual': virtual,
      'x-uid': uid(), // 生成一个新的uid
      properties: {},
    });
    if (newTpl['x-decorator'] === 'TemplateGridDecorator') {
      delete newTpl['x-decorator'];
    }
    for (const key in tpl.properties) {
      const t = convertTplBlock(tpl.properties[key], virtual, isRoot, newRootId, templateKey);
      if (isRoot) {
        newRootId = uid(); // 多个Grid.Row的时候，每个Grid.Row都要生成一个新的uid
      }
      if (t) {
        newTpl.properties[key] = t;
      }
    }
    return newTpl;
  } else {
    const newSchema = {
      // ...tpl,
      // 'x-component': rootComponent === tpl ? 'XTemplate' : tpl['x-component'],
      // 'x-decorator': tpl['x-decorator'],
      // type: rootComponent ? 'void' : tpl.type,
      // name: tpl.name,
      'x-uid': `${newRootId}-${tpl['x-uid']}`,
      'x-template-uid': tpl['x-uid'],
      'x-virtual': virtual,
      properties: {},
    };

    if (isRoot) {
      newSchema['x-template-root-uid'] = tpl['x-uid'];
      newSchema['x-uid'] = newRootId;
      newSchema['x-template-version'] = '1.0';
    }
    if (templateKey) {
      newSchema['x-block-template-key'] = templateKey;
    }
    if (tpl['x-component'] === 'CustomRequestAction') {
      newSchema['x-custom-request-id'] = tpl['x-custom-request-id'] || tpl['x-uid'];
    }
    // filter should be in tpl
    if (_.get(tpl, 'x-filter-targets')) {
      newSchema['x-filter-targets'] = tpl['x-filter-targets'];
    }
    for (const key in tpl.properties) {
      newSchema.properties[key] = convertTplBlock(tpl.properties[key], virtual, false, newRootId, templateKey);
    }
    return newSchema;
  }
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

function correctIdReferences(schemas) {
  const idMaps = {};
  for (const schema of schemas) {
    _.merge(idMaps, getSchemaUidMaps(schema));
  }
  for (const schema of schemas) {
    correctIdReference(schema, idMaps);
  }
}

function convertTemplateToBlock(data, templateKey?: string) {
  // debugger;
  let tpls = data?.properties; // Grid开始的区块
  tpls = _.get(Object.values(tpls), '0.properties'); // Grid.Row开始的区块
  const schemas = [];
  // 遍历 tpl的所有属性，每一个属性其实是一个区块
  for (const key in tpls) {
    const tpl = tpls[key];
    const schema = convertTplBlock(tpl, false, true, undefined, templateKey);
    if (schema) {
      schemas.push(schema);
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
  const api = useAPIClient();
  const { insertAdjacent } = useDesignable();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const mobilePlugin = usePlugin(PluginMobileClient);
  const blockTemplatesResource = useResource('blockTemplates');
  const [searchValue, setSearchValue] = useState('');
  const t = useT();
  const isMobile = useMemo(() => {
    return window.location.pathname.startsWith(mobilePlugin.mobileBasename);
  }, [mobilePlugin]);

  const handleClick = async ({ item }) => {
    const { value: uid } = item;
    const { data } = await api.request({
      url: `uiSchemas:getProperties/${uid}`,
    });

    const template = data?.data;
    const schemas = convertTemplateToBlock(template, item.key);
    plugin.setTemplateCache(findBlockRootSchema(template['properties']?.['blocks']));
    correctIdReferences(schemas);
    for (const schema of schemas) {
      await new Promise((resolve) => {
        insertAdjacent('beforeEnd', schema, {
          onSuccess: resolve,
        });
      });
    }
    // server hook only support root node, so we do the link from client
    const links = [];
    const fillLink = (schema: ISchema) => {
      if (schema['x-template-root-uid']) {
        links.push({
          templateKey: item.key,
          templateBlockUid: schema['x-template-root-uid'],
          blockUid: schema['x-uid'],
        });
      }
      if (schema.properties) {
        for (const key in schema.properties) {
          fillLink(schema.properties[key]);
        }
      }
    };
    for (const schema of schemas) {
      fillLink(schema);
    }
    blockTemplatesResource.link({
      values: links,
    });
  };

  const { data, loading } = useRequest<{
    data: {
      key: string;
      title: string;
      description: string;
      uid: string;
      configured: boolean;
    }[];
  }>(
    {
      url: 'blockTemplates:list',
      method: 'get',
      params: {
        filter: {
          configured: true,
          type: isMobile ? 'Mobile' : { $ne: 'Mobile' },
        },
        paginate: false,
      },
    },
    {
      uid: 'blockTemplates',
    },
  );

  const filteredData = data?.data?.filter(
    (item) => !searchValue || item.title.toLowerCase().includes(searchValue.toLowerCase()),
  );

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
          key: item.key,
          label: item.title,
          value: item.uid,
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
    filteredData?.forEach((item) => {
      plugin.templateInfos.set(item.key, item);
    });
  }, [filteredData, plugin.templateInfos]);

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
      title={'{{t("Templates")}}'}
      icon={<CopyOutlined />}
      items={menuItems}
      name={'templates'}
      onClick={handleClick}
    />
  );
};
