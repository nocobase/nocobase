import { I18nProvider, I18nRuntime } from '@nocobase/i18n/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './app';

// Registry items translate through @nocobase/i18n, so the preview mounts a runtime the way an application does. It
// registers no resources, which leaves every string at its English default.
// Many demos sit on one long page, and a form that focuses a field when it mounts (the sign-in form's autoFocus)
// would scroll the page to itself. Focus that no recent click or key press asked for keeps the page where it is.
let lastInput = Number.NEGATIVE_INFINITY;
const noteInput = () => {
  lastInput = performance.now();
};
window.addEventListener('pointerdown', noteInput, true);
window.addEventListener('keydown', noteInput, true);
const { focus } = HTMLElement.prototype; // eslint-disable-line @typescript-eslint/unbound-method -- called with .call
HTMLElement.prototype.focus = function focusWithoutJump(
  this: HTMLElement,
  options?: FocusOptions,
) {
  const unprompted = performance.now() - lastInput > 1000;
  focus.call(this, unprompted ? { preventScroll: true, ...options } : options);
};

const i18n = new I18nRuntime({ defaultLocale: 'en-US', locales: ['en-US'] });

void i18n.init().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider runtime={i18n}>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
});
