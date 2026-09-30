import type { ReactElement, ReactNode } from 'react';
import { PageContainer } from './components/page-container.js';
import { PageHeader } from './components/page-header.js';
import { useT } from './locales/index.js';

interface SettingsShellProps {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
  /**
   * Fill the host's scroll viewport on large screens so a page with its own
   * scroll regions does not also scroll the page around them. Below the floor
   * the whole page grows and the host scrolls it once, rather than squeezing
   * the content past the page padding.
   */
  readonly fill?: boolean;
}

export function SettingsShell({
  title,
  description,
  fill = false,
  children,
}: SettingsShellProps): ReactElement {
  const t = useT();
  return (
    <PageContainer
      className={
        fill ? 'lg:flex lg:h-full lg:min-h-[36rem] lg:flex-col' : undefined
      }
    >
      <PageHeader title={t(title)} description={t(description)} />
      <div
        className={
          fill ? 'lg:flex lg:min-h-0 lg:flex-1 lg:flex-col' : undefined
        }
      >
        {children}
      </div>
    </PageContainer>
  );
}
