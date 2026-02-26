/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { useField, useFieldSchema } from '@formily/react';
import { useDesignable } from '@nocobase/client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface CommentBlockDecoratorContextType {
  createAble?: boolean;
  editAble?: boolean;
  deleteAble?: boolean;
  setCreateAble?: (create: boolean) => void;
  setEditAble?: (create: boolean) => void;
  setDeleteAble?: (create: boolean) => void;
}

const CommentBlockDecoratorContext = createContext<CommentBlockDecoratorContextType>({});

export function CommentBlockDecoratorContextProvider(props: { children: React.ReactNode }) {
  const field = useField();
  const fieldSchema = useFieldSchema();

  const [createAble, _setCreateAble] = useState(false);
  // const [editAble, _setEditAble] = useState(false);
  // const [deleteAble, _setDeleteAble] = useState(false);

  const { dn } = useDesignable();

  useEffect(() => {
    const createAbleInComponentProps = dn.current['x-component-props']?.['createAble'];
    _setCreateAble(createAbleInComponentProps === undefined ? true : createAbleInComponentProps);
    // _setEditAble(dn.current['x-component-props']?.['editAble']);
    // _setDeleteAble(dn.current['x-component-props']?.['deleteAble']);
  }, []);

  const updateComponentProps = useCallback(
    (updateProps: any) => {
      const componentProps = Object.assign({}, fieldSchema['x-component-props'], updateProps);
      fieldSchema['x-component-props'] = componentProps;
      dn.emit('patch', {
        schema: {
          ['x-uid']: fieldSchema['x-uid'],
          'x-component-props': fieldSchema['x-component-props'],
        },
      });
      dn.refresh();
    },
    [dn, fieldSchema],
  );

  const setCreateAble = useCallback(
    (able: boolean) => {
      updateComponentProps({ createAble: able });
      _setCreateAble(able);
    },
    [_setCreateAble, updateComponentProps],
  );

  // const setEditAble = useCallback(
  //   (able: boolean) => {
  //     updateComponentProps({ editAble: able });
  //     _setEditAble(able);
  //   },
  //   [_setEditAble, updateComponentProps],
  // );

  // const setDeleteAble = useCallback(
  //   (able: boolean) => {
  //     updateComponentProps({ deleteAble: able });
  //     _setDeleteAble(able);
  //   },
  //   [_setDeleteAble, updateComponentProps],
  // );

  return (
    <CommentBlockDecoratorContext.Provider value={{ createAble, setCreateAble }}>
      {props.children}
    </CommentBlockDecoratorContext.Provider>
  );
}

export function useCommentBlockDescoratorContext() {
  return useContext(CommentBlockDecoratorContext);
}
