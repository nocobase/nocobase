import type { ReactElement } from 'react';
import { EmbeddingFields } from '../../indexing/embedding-fields.js';
import type { IndexingFormProps } from '../../indexing/types.js';

export default function PgvectorIndexingForm(
  props: IndexingFormProps,
): ReactElement {
  return (
    <div className='space-y-4'>
      <EmbeddingFields
        {...props}
        onChange={(value) =>
          props.onChange(
            value.embedding === undefined ? {} : { embedding: value.embedding },
          )
        }
      />
    </div>
  );
}
