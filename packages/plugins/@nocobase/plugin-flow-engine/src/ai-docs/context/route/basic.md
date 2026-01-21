# Basic

## Navigate To Post

Use this snippet to navigate to post.

```ts
ctx.route({
  path: '/posts/:name',
  params: { name },
});
```

## Go Home

Use this snippet to go home.

```ts
ctx.route({ pathname: '/' });
```
