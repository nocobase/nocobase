import type { ReactElement } from 'react';
import { EmbeddingFields } from '../../indexing/embedding-fields.js';
import type { IndexingFormProps } from '../../indexing/types.js';

export default function SqliteVecIndexingForm(
  props: IndexingFormProps,
): ReactElement {
  return <EmbeddingFields {...props} />;
}
