/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { css } from '@emotion/css';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Message } from '../../types';
import { Code } from './Code';
import { Echarts } from './ECharts';
import { Form } from './Form';

export const Markdown: React.FC<{
  message: Message;
}> = ({ message }) => {
  const tagIndexes: Record<string, number> = {};
  const getIndex = (tagName: string): number => {
    if (!(tagName in tagIndexes)) {
      tagIndexes[tagName] = -1;
    }
    return ++tagIndexes[tagName];
  };

  return (
    <div
      className={css`
        margin-bottom: -1em;
      `}
    >
      <ReactMarkdown
        components={{
          code: (props) => <Code {...props} message={message} />,
          form: (props) => <Form {...props} message={message} />,
          // @ts-ignore
          echarts: (props) => {
            return <Echarts {...props} index={getIndex('echarts')} message={message} />;
          },
          // collections: (props) => {
          //   return <Collections {...props} message={message} />;
          // },
        }}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeSanitize,
            {
              ...defaultSchema,
              tagNames: [...defaultSchema.tagNames, 'echarts', 'form', 'collections'],
              attributes: {
                ...defaultSchema.attributes,
                form: ['uid', 'datasource', 'collection'],
              },
            },
          ],
        ]}
        remarkPlugins={[remarkGfm]}
      >
        {message.content as unknown as string}
      </ReactMarkdown>
    </div>
  );
};
