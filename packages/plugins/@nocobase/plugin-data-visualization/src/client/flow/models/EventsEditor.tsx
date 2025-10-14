/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps } from '@formily/react';
import { CodeEditor } from '../components/CodeEditor';

const EventsEditor = connect(
  CodeEditor,
  mapProps((props) => {
    return {
      language: 'javascript',
      value: props.value,
      onChange: props.onChange,
    };
  }),
);

export default EventsEditor;
