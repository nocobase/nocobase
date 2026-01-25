/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { useT } from '../../../locale';
import { BuildOutlined } from '@ant-design/icons';
import { useAISelectionContext } from './AISelectorProvider';
import { useField } from '@formily/react';
import { Field } from '@formily/core';
import { CloseCircleOutlined, PauseOutlined } from '@ant-design/icons';

export const BlockSelector: React.FC<{
  onSelect?: (ctx: { uid: string }) => void;
}> = ({ onSelect }) => {
  const t = useT();
  const { startSelect, stopSelect } = useAISelectionContext();
  const [selecting, setSelecting] = React.useState(false);
  const field = useField<Field>();

  return (
    <Button
      variant="dashed"
      color="primary"
      icon={<BuildOutlined />}
      size="small"
      onClick={() => {
        if (selecting) {
          setSelecting(false);
          stopSelect();
          return;
        }
        setSelecting(true);
        startSelect('blocks', {
          onSelect: (ctx) => {
            onSelect?.(ctx);
            field.value = ctx.uid;
            setSelecting(false);
          },
        });
      }}
    >
      {selecting ? (
        <>
          {t('Selecting...')} <PauseOutlined />
        </>
      ) : field.value ? (
        <>
          {field.value}{' '}
          <CloseCircleOutlined
            onClick={(e) => {
              e.stopPropagation();
              field.value = null;
            }}
          />
        </>
      ) : (
        t('Select block')
      )}
    </Button>
  );
};
