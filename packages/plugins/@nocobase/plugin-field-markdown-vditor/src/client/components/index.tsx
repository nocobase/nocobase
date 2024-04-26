import { connect, mapReadPretty } from '@formily/react';
import { withDynamicSchemaProps } from '@nocobase/client';
import { Display } from './Display';
import { Edit } from './Edit';

export const MarkdownVditor = withDynamicSchemaProps(connect(Edit, mapReadPretty(Display)));

export default MarkdownVditor;
