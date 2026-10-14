import { useEffect, useRef } from 'react';
import { useLang } from '@rspress/core/runtime';
import { Nav } from '../DocsNav';
import markup from './markup.json';
import englishMarkup from './markup.en.json';
import image0 from './assets/image-0.png';
import image1 from './assets/image-1.jpeg';
import image2 from './assets/image-2.jpeg';
import image3 from './assets/image-3.jpeg';
import image4 from './assets/image-4.jpeg';
import './index.scss';

function createContent(html: string) {
  return {
    __html: html
      .replaceAll('/architecture-pitch/image-0.png', image0)
      .replaceAll('/architecture-pitch/image-1.jpeg', image1)
      .replaceAll('/architecture-pitch/image-2.jpeg', image2)
      .replaceAll('/architecture-pitch/image-3.jpeg', image3)
      .replaceAll('/architecture-pitch/image-4.jpeg', image4),
  };
}
const content = { cn: createContent(markup), en: createContent(englishMarkup) };

export function ArchitecturePitch() {
  const lang = useLang() === 'cn' ? 'cn' : 'en';
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const links = container.querySelectorAll<HTMLAnchorElement>('[data-step]');
    const strip = container.querySelector<HTMLOListElement>('.nav ol');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((link) => {
            const active = link.dataset.step === entry.target.id;
            link.classList.toggle('active', active);
            const item = link.parentElement;
            if (active && strip && item) {
              if (item.offsetLeft < strip.scrollLeft)
                strip.scrollLeft = item.offsetLeft;
              else if (
                item.offsetLeft + item.offsetWidth >
                strip.scrollLeft + strip.clientWidth
              )
                strip.scrollLeft =
                  item.offsetLeft + item.offsetWidth - strip.clientWidth;
            }
          });
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    container
      .querySelectorAll('section.sec')
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [lang]);
  return (
    <>
      <Nav />
      <div
        ref={root}
        className='architecture-pitch'
        dangerouslySetInnerHTML={content[lang]}
      />
    </>
  );
}
