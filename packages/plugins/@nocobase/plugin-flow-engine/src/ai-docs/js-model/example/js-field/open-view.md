# Open View

## Code

Use this snippet to code.

```ts
const targetViewId = ctx.args?.targetViewId || 'TARGET_VIEW_UID';
ctx.element.innerHTML = '<a class="js-field-open-view" href="#">Open details</a>';
ctx.element.querySelector('.js-field-open-view')?.addEventListener('click', async (event) => {
  event.preventDefault();
  await ctx.openView(targetViewId, {
    from: 'JSFieldModel',
    recordId: ctx.record?.id,
  });
});
```
