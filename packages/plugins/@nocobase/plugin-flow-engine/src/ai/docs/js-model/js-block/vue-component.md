---
title: "Embed Vue component"
description: "Use ctx.importAsync to load Vue 3 ESM build and render a reactive widget."
---

# Embed Vue component

Use ctx.importAsync to load Vue 3 ESM build and render a reactive widget

```ts
const mountNode = document.createElement('div');
mountNode.style.padding = '16px';
mountNode.style.background = '#fff';
mountNode.style.borderRadius = '8px';
const target = document.createElement('div');
target.className = 'nb-vue-counter';
mountNode.appendChild(target);
ctx.element.replaceChildren(mountNode);

async function bootstrap() {
  const mod = await ctx.importAsync('https://esm.sh/vue@3.4.27/dist/vue.runtime.esm-browser.js');
  const createApp = mod?.createApp;
  const ref = mod?.ref;
  const h = mod?.h;
  if (typeof createApp !== 'function' || typeof ref !== 'function' || typeof h !== 'function') {
    throw new Error('Vue ESM module not available');
  }

  const Counter = {
    setup() {
      const count = ref(0);
      const increase = () => {
        count.value += 1;
      };
      const openPopup = async () => {
        const popupUid = ctx.model?.uid ? ctx.model.uid + '-popup' : 'vue-popup';
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Hello from Vue'),
          params: {
            fromVue: true,
            triggerCount: count.value,
          },
        });
      };
      return () =>
        h(
          'div',
          { style: 'display:flex;align-items:center;gap:12px;' },
          [
            h(
              'button',
              {
                style:
                  'padding:6px 12px;border:1px solid #fa8c16;background:#fa8c16;color:#fff;border-radius:4px;cursor:pointer;',
                onClick: increase,
              },
              ctx.t('Increase'),
            ),
            h(
              'button',
              {
                style:
                  'padding:6px 12px;border:1px solid #1677ff;background:#1677ff;color:#fff;border-radius:4px;cursor:pointer;',
                onClick: openPopup,
              },
              ctx.t('Open popup'),
            ),
            h(
              'span',
              null,
              ctx.t('Current count') + ': ' + count.value,
            ),
          ],
        );
    },
  };

  const app = createApp(Counter);
  const mountTarget = ctx.element.querySelector('.nb-vue-counter');
  app.mount(mountTarget || ctx.element);
}

bootstrap().catch((error) => {
  console.error('[RunJS] failed to mount Vue counter', error);
  mountNode.innerHTML = '<div style="color:#c00;">' + (error?.message || ctx.t('Vue initialization failed')) + '</div>';
});
```
