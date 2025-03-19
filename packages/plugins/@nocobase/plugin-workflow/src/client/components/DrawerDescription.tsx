/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles, cx } from '@nocobase/client';
import { Tag } from 'antd';
import React from 'react';

const useStyles = createStyles(({ css, token }) => {
  return {
    container: css`
      margin-bottom: 1.5em;
      padding: 1em;
      background-color: ${token.colorFillAlter};

      > *:last-child {
        margin-bottom: 0;
      }

      dl {
        display: flex;
        align-items: baseline;

        dt {
          color: ${token.colorText};
          &:after {
            content: ':';
            margin-right: 0.5em;
          }
        }
      }

      p {
        color: ${token.colorTextDescription};
      }
    `,
  };
});

export function DrawerDescription(props) {
  const { label, title, icon, description } = props;
  const { styles } = useStyles();

  return (
    <div className={cx(styles.container, props.className)}>
      <dl>
        <dt>{label}</dt>
        <dd>
          <Tag icon={icon} style={{ background: 'none' }}>
            {title}
          </Tag>
        </dd>
      </dl>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
