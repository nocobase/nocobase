/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { cloneDeep } from 'lodash';
import { observer } from '@formily/react';
import { ActionContextProvider, SchemaComponent, useActionContext, useRequest } from '@nocobase/client';
import { editDatabaseServerSchema } from './schema';
import { useEditDatabaseServer, useCancelAction, useTestConnectionAction } from '../hooks';
import { ServerContext } from './DatabaseServerSelect';

export const EditDatabaseServerAction = observer(
  (props: any) => {
    const { getContainer, setOpen } = props;
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();
    const useEditServerProps = (options) => {
      const { item } = useContext(ServerContext);
      const result = useRequest(() => Promise.resolve({ data: cloneDeep(item) }), {
        ...options,
        manual: true,
      });
      const ctx = useActionContext();
      useEffect(() => {
        if (ctx.visible) {
          result.run();
        }
      }, [ctx.visible]);
      return result;
    };
    return (
      <ActionContextProvider value={{ visible, setVisible }}>
        <span
          style={{ width: '50px' }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            setVisible(true);
          }}
          title={t('Edit database server')}
        >
          {t('Edit')}
        </span>
        <SchemaComponent
          schema={editDatabaseServerSchema}
          scope={{
            getContainer,
            useEditDatabaseServer,
            useCancelAction,
            useEditServerProps,
            useTestConnectionAction,
            createOnly: true,
          }}
        />
      </ActionContextProvider>
    );
  },
  { displayName: 'EditDatabaseServerAction' },
);
