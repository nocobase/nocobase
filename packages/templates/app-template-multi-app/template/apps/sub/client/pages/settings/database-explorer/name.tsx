import { Fragment, type ReactElement } from 'react';
import { wordBreaks } from './model.js';

/**
 * An identifier that wraps between its words: line-break opportunities sit at
 * camelCase and snake_case boundaries, and the text itself stays unchanged for
 * copying, search and assistive technology.
 */
export function Name({ value }: { value: string }): ReactElement {
  // Each part is keyed by where it starts in the name, which is unique even when parts repeat (`id_id`).
  return (
    <>
      {wordBreaks(value).map((part) => (
        <Fragment key={part.start}>
          {part.start ? <wbr /> : null}
          {part.text}
        </Fragment>
      ))}
    </>
  );
}
