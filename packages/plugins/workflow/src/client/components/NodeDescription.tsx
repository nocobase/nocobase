import React from 'react';
import { css, cx } from '@emotion/css';
import { Tag } from 'antd';
import { lang } from '../locale';

export function NodeDescription(props) {
  const { instruction } = props;
  const className = css`
    margin-bottom: 1.5em;
    padding: 1em;
    background: #f6f6f6;

    > *:last-child {
      margin-bottom: 0;
    }

    dl {
      display: flex;

      dt {
        &:after {
          content: ':';
          margin-right: 0.5em;
        }
      }
    }

    p {
      color: rgba(0, 0, 0, 0.45);
    }
  `;

  return (
    <div className={cx(className, props.className)}>
      <dl>
        <dt>{lang('Node type')}</dt>
        <dd>
          <Tag>{instruction.title}</Tag>
        </dd>
      </dl>
      {instruction.description ? <p>{instruction.description}</p> : null}
    </div>
  );
}
