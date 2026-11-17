import { useTranslation } from '@nocobase/i18n/client';

import {
  guideContent,
  type GuideContent,
} from '../../shared/capability-guide/index.js';

export function useGuideContent(): {
  readonly content: GuideContent;
  readonly locale: string;
} {
  const { i18n } = useTranslation();
  return { content: guideContent(i18n.language), locale: i18n.language };
}
