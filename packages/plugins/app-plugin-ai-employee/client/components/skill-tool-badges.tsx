import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Badge } from './ui/badge.js';
import type { ManagedSkillSummary } from '../skills-management-service.js';
import { useCatalogDisplay } from '../catalog-display.js';

export function SkillToolBadges({
  tools: sourceTools,
}: {
  tools: ManagedSkillSummary['tools'];
}): ReactElement {
  const { toolTitle, compareTitles } = useCatalogDisplay();
  const tools = useMemo(
    () =>
      sourceTools
        .map((tool) => ({ name: tool.name, title: toolTitle(tool) }))
        .sort((left, right) =>
          compareTitles(left.title, right.title, left.name, right.name),
        ),
    [sourceTools, toolTitle, compareTitles],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tools.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measurement = measureRef.current;
    if (!container || !measurement) return;
    const measure = (): void => {
      const width = container.getBoundingClientRect().width;
      if (!width) return;
      const badges = Array.from(measurement.children);
      const gap =
        Number.parseFloat(getComputedStyle(measurement).columnGap) || 0;
      const widths = badges
        .slice(0, tools.length)
        .map((badge) => badge.getBoundingClientRect().width);
      const total =
        widths.reduce((sum, value) => sum + value, 0) +
        gap * Math.max(0, tools.length - 1);
      if (total <= width) {
        setVisibleCount(tools.length);
        return;
      }
      const counter = badges[tools.length];
      let used = 0;
      let count = 0;
      for (let index = 0; index < widths.length; index++) {
        counter.textContent = `+${tools.length - index - 1}`;
        const next = used + widths[index] + (index ? gap : 0);
        if (next + gap + counter.getBoundingClientRect().width > width) break;
        used = next;
        count++;
      }
      setVisibleCount(count);
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(container);
    observer?.observe(measurement);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [tools]);

  return (
    <div ref={containerRef} className='relative min-w-0 flex-1 overflow-hidden'>
      <div className='flex min-w-0 items-center gap-2'>
        {tools.slice(0, visibleCount).map((tool) => (
          <Badge
            key={tool.name}
            variant='secondary'
            translate='no'
            className='shrink-0'
            title={tool.title.trim() || tool.name}
          >
            {tool.title.trim() || tool.name}
          </Badge>
        ))}
        {visibleCount < tools.length ? (
          <Badge
            variant='secondary'
            className='shrink-0'
            title={tools
              .slice(visibleCount)
              .map((tool) => tool.title.trim() || tool.name)
              .join(', ')}
          >
            +{tools.length - visibleCount}
          </Badge>
        ) : null}
      </div>
      <div
        ref={measureRef}
        aria-hidden='true'
        className='invisible pointer-events-none absolute top-0 left-0 flex w-max gap-2'
      >
        {tools.map((tool) => (
          <Badge
            key={tool.name}
            variant='secondary'
            translate='no'
            className='shrink-0'
          >
            {tool.title.trim() || tool.name}
          </Badge>
        ))}
        <Badge variant='secondary' className='shrink-0'>
          +{tools.length}
        </Badge>
      </div>
    </div>
  );
}
