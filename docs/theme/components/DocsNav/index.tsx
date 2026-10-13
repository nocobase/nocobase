import { useLang } from '@rspress/core/runtime';
import chinese from '../CapabilityOverview/header.json';
import english from '../CapabilityOverview/header.en.json';
import { useLanguageMenu } from '../LanguageMenu';
import './index.scss';

export function Nav() {
  const lang = useLang();
  const header = useLanguageMenu(lang === 'cn' ? chinese : english);
  return (
    <div
      className='docs-top-nav'
      dangerouslySetInnerHTML={{ __html: header }}
    />
  );
}
