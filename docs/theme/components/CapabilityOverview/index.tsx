import { useEffect, useRef } from 'react';
import { useLang } from '@rspress/core/runtime';
import pages from './pages.json';
import englishPages from './pages.en.json';
import chineseHeader from './header.json';
import englishHeader from './header.en.json';
import chineseHome from '../FullHome/data.json';
import englishHome from '../FullHome/data.en.json';
import { images } from './images';
import { initializeOverview } from './interactions.mjs';
import './index.scss';

function moduleId(routePath: string) {
  return /^\/capabilities\/([^/]+)\/?$/.exec(routePath)?.[1];
}
export function isCapabilityOverview(routePath: string) {
  const id = moduleId(routePath);
  return !!id && Object.hasOwn(pages, id);
}
export function CapabilityOverview({ routePath }: { routePath: string }) {
  const lang = useLang();
  const header = lang === 'cn' ? chineseHeader : englishHeader;
  const homepage = lang === 'cn' ? chineseHome : englishHome;
  const localizedPages = lang === 'cn' ? pages : englishPages;
  const root = useRef<HTMLDivElement>(null);
  const page = localizedPages[moduleId(routePath) as keyof typeof pages];
  const markup =
    header +
    page.markup.replace(
      /assets\/([^"\s]+)/g,
      (source, file: string) => images[file] ?? source,
    );
  useEffect(() => {
    if (!root.current) return;
    root.current.innerHTML = markup;
    const library = homepage.promptLibrary[
      page.promptKey as keyof typeof homepage.promptLibrary
    ].prompts as Record<string, { label: string; text: string }>;
    const scenarios = page.scenarios.map((scenario) => ({
      ...scenario,
      label: library[scenario.id].label,
      prompt: library[scenario.id].text,
      image: images[scenario.image],
    }));
    return initializeOverview(root.current, scenarios, lang);
  }, [page, markup, homepage, lang]);
  return (
    <div
      className='capability-overview'
      lang={lang === 'cn' ? 'zh-CN' : 'en'}
      ref={root}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
