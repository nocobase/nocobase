import { useEffect, useMemo, useRef } from 'react';
import { useLang } from '@rspress/core/runtime';
import chinese from './markup.json';
import english from './markup.en.json';
import { initializeHomepage } from './interactions.mjs';
import { useLanguageMenu } from '../LanguageMenu';
import './index.scss';

/** Shared homepage layout with language-specific content. */
export function FullHome() {
  const lang = useLang();
  const markup = useLanguageMenu(lang === 'cn' ? chinese : english);
  const root = useRef<HTMLDivElement>(null);
  // Keep React from replacing DOM initialized by the effect on parent rerenders.
  const html = useMemo(() => ({ __html: markup }), [markup]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Restore the static markup for React Strict Mode and client-side return visits.
    element.innerHTML = markup;
    return initializeHomepage(element, lang);
  }, [lang, markup]);
  return (
    <div className='docs-full-home' ref={root} dangerouslySetInnerHTML={html} />
  );
}
