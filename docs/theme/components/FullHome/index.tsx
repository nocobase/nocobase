import { useEffect, useRef } from 'react';
import { useLang } from '@rspress/core/runtime';
import chinese from './markup.json';
import english from './markup.en.json';
import { initializeHomepage } from './interactions.mjs';
import './index.scss';

/** Shared homepage layout with language-specific content. */
export function FullHome() {
  const lang = useLang();
  const markup = lang === 'cn' ? chinese : english;
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Restore the static markup for React Strict Mode and client-side return visits.
    element.innerHTML = markup;
    return initializeHomepage(element, lang);
  }, [lang, markup]);
  return (
    <div
      className='docs-full-home'
      ref={root}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
