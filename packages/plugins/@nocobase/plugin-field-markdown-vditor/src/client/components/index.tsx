import { Display } from './Display';
import { Edit } from './Edit';
import { connect, mapReadPretty } from '@formily/react';

export const MarkdownVditor = connect(Edit, mapReadPretty(Display));

export default MarkdownVditor;
