# Concurrency

## open multiple views

```ts
ctx.viewer.dialog({ uid: `${ctx.model.uid}-dialog-a`, content: () => <DialogA /> });
ctx.viewer.dialog({ uid: `${ctx.model.uid}-dialog-b`, content: () => <DialogB /> });
```
