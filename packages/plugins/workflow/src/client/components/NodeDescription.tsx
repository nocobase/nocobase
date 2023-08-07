import { createStyles, cx } from '@nocobase/client';
import { Tag } from 'antd';
import React from 'react';
import { lang } from '../locale';

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

export function NodeDescription(props) {
  const { instruction } = props;
  const { styles } = useStyles();

  return (
    <div className={cx(styles.container, props.className)}>
      <dl>
        <dt>{lang('Node type')}</dt>
        <dd>
          <Tag style={{ background: 'none' }}>{instruction.title}</Tag>
        </dd>
      </dl>
      {instruction.description ? <p>{instruction.description}</p> : null}
    </div>
  );
}
