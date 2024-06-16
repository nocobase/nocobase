/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import _ from 'lodash';
import { FC, default as React, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataBlockProvider } from '../../../data-source/data-block/DataBlockProvider';
import { SchemaComponent } from '../../core';
import { useRequestSchema } from '../../core/useRequestSchema';
import { PopupParam, getPopupParamsFromPath, usePopup } from './utils';

interface PopupsProviderProps {
  visible: boolean;
  setVisible?: (value: boolean) => void;
}

export const PopupsProviderContext = React.createContext<PopupsProviderProps>(null);
PopupsProviderContext.displayName = 'PopupsProviderContext';

/**
 * The difference between this component and ActionContextProvider is that
 * this component is only used to control the popups in the PagePopupsItem component (excluding the nested popups within it).
 * @param param0
 * @returns
 */
export const PopupsProvider: FC<PopupsProviderProps> = ({ children, visible, setVisible }) => {
  return <PopupsProviderContext.Provider value={{ visible, setVisible }}>{children}</PopupsProviderContext.Provider>;
};

const PagePopupsItemProvider: FC<{ params: PopupParam }> = ({ params, children }) => {
  const { closePopup } = usePopup();
  const [visible, _setVisible] = useState(true);
  const setVisible = (visible: boolean) => {
    if (!visible) {
      closePopup();
    }
  };

  return (
    <PopupsProvider visible={visible} setVisible={setVisible}>
      <DataBlockProvider
        dataSource={params.datasource}
        collection={params.collection}
        association={params.association}
        filterByTk={params.filterbytk}
        sourceId={params.sourceid}
        action="get"
      >
        <div style={{ display: 'none' }}>{children}</div>
      </DataBlockProvider>
    </PopupsProvider>
  );
};

/**
 * insert childSchema to parentSchema to render the nested popups
 * @param childSchema
 * @param params
 * @param parentSchema
 */
const insertToPopupSchema = (childSchema: ISchema, params: PopupParam, parentSchema: ISchema) => {
  const componentSchema = {
    type: 'void',
    'x-component': 'PagePopupsItemProvider',
    'x-component-props': {
      params,
    },
    properties: {
      popupAction: childSchema,
    },
  };

  if (parentSchema.properties) {
    const popupSchema = _.get(parentSchema.properties, Object.keys(parentSchema.properties)[0]);
    if (_.isEmpty(_.get(popupSchema, 'properties.nestedPopup'))) {
      _.set(popupSchema, 'properties.nestedPopup', componentSchema);
    }
  }
};

const PagePopupsItem: FC<{
  paramsList: PopupParam[];
  index: number;
  rootSchema: ISchema;
  currentSchema: ISchema;
}> = ({ paramsList, index, rootSchema, currentSchema }) => {
  const params = paramsList[index];
  const { schema } = useRequestSchema({
    uid: params?.popupUid,
  });

  if (!schema) {
    return null;
  }

  const clonedSchema = _.cloneDeep(schema);
  insertToPopupSchema(clonedSchema, params, currentSchema);

  if (index === paramsList.length - 1) {
    return <SchemaComponent components={{ PagePopupsItemProvider }} schema={rootSchema} onlyRenderProperties />;
  }

  return (
    <PagePopupsItem paramsList={paramsList} index={index + 1} rootSchema={rootSchema} currentSchema={clonedSchema} />
  );
};

export const PagePopups = () => {
  const params = useParams();
  const popupParams = getPopupParamsFromPath(params['*']);
  const firstParams = popupParams[0];

  const { schema } = useRequestSchema({
    uid: firstParams?.popupUid,
  });

  if (!schema) {
    return null;
  }

  if (popupParams.length === 1) {
    return (
      <PagePopupsItemProvider params={firstParams}>
        <SchemaComponent schema={schema} onlyRenderProperties />
      </PagePopupsItemProvider>
    );
  }

  const clonedSchema = _.cloneDeep(schema);

  return (
    <PagePopupsItemProvider params={firstParams}>
      <PagePopupsItem paramsList={popupParams} index={1} rootSchema={clonedSchema} currentSchema={clonedSchema} />;
    </PagePopupsItemProvider>
  );
};
