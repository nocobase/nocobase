# Open View

## Code

Use this snippet to code.

```ts
ctx.element.innerHTML = '<button class="js-open-view">Open dialog</button>';
const button = ctx.element.querySelector('.js-open-view');
button?.addEventListener('click', () => {
  ctx.runAction('openView', {
    navigation: false,
    mode: 'dialog',
    collectionName: 'users',
    dataSourceKey: 'main',
    filterByTk: 1,
  });
});
```
