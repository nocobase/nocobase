---
order: 100
toc: menu
---

# Contributing

## Basic process

- Fork the source code to your own repository
- Modify source code
- Submit pull request

## Installation and start-up

```bash
# Replace the following git address with your own repo
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
yarn install
yarn bootstrap
yarn build
yarn nocobase init --import-demo
yarn start
```

Open http://localhost:8000/ in your browser

<Alert title="Note">
Involved in core code development, the project starts with a documentation page, not the application's login page.
</Alert>

## Main scripts

### Startup and reboot

The above commands are only executed the first time, after that the project is restarted with

```bash
yarn start
```

### Reinstallation

If you want to clear and reinstall

```bash
### If you want to import demo data, you can add --import-demo
yarn nocobase init --import-demo
# After reinstallation, you also need to restart
yarn start
```

### Build

<Alert title="Note">

For integration testing or site-wide debugging, the following package changes need to be recompiled and repackaged.

- actions
- database
- resourcer
- server
- test
- utils

In addition to the compilation issues, there are many details of the project build that remain unresolved. If you have some good suggestions, you are welcome to discuss them on [GitHub Discussions](https://github.com/nocobase/nocobase/discussions).

</Alert>

```bash
# for all packages
yarn build

# for specific package
yarn build <package_name_1> <package_name_2>

# e.g.
# yarn build database
```

### Testing

<Alert title="Note">

After upgrading v0.5, some tests have not been fixed yet, and the ci tests are not available yet. The code tests are not perfect yet, more tests will be added and improved in phases...

</Alert>

```bash
# For all packages
yarn test

# For specific package
yarn test packages/<name>
```

### More scripts

View [scripts](https://github.com/nocobase/nocobase/blob/ff4d432c9fc3faa38cd65ab6d4dad250da02c2fd/package.json#L7) of package.json

## Document revision and translation

The documentation is in the [docs](https://github.com/nocobase/nocobase/tree/develop/docs) directory and follows Markdown syntax, defaults to English and ends with `.zh-CN.md` in Chinese, e.g.

```bash
|- /docs/
  |- index.md # English document
  |- index.zh-CN.md # Chinese document, when it is missing, the content of index.md is displayed
```

After modification, open http://localhost:8000/ in your browser to see the final effect.

## Back-end

Most of the changes on the back-end can be verified by the test command.

```bash
yarn test packages/<name>
```

Of course, if you are adding new content, you will need to write new tests. ``@nocobase/test`` provides ``mockDatabase`` and ``mockServer` for database and server testing, e.g.

```ts
import { mockServer, MockServer } from '@nocobase/test';

describe('mock server', () => {
  let api: MockServer;

  beforeEach(() => {
    api = mockServer({
      dataWrapping: false,
    });
    api.actions({
      list: async (ctx, next) => {
        ctx.body = [1, 2];
        await next();
      },
    });
    api.resource({
      name: 'test',
    });
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('agent.get', async () => {
    const response = await api.agent().get('/test');
    expect(response.body).toEqual([1, 2]);
  });

  it('agent.resource', async () => {
    const response = await api.agent().resource('test').list();
    expect(response.body).toEqual([1, 2]);
  });
});
```

## Full-stack demo

http://localhost:8000/develop

To facilitate local debugging for developers, the full-stack demo is also an embedded demo, which can be opened full-screen by clicking on the new tab in the bottom left corner.

## Client components

<Alert title="Note">
The component library is still being organized...
</Alert>

Each component is independent, easy to debug and use. See the component list at http://localhost:8000/components

## Provide more examples

<Alert title="Note">
Examples are still being compiled...
</Alert>

Examples are available at http://localhost:8000/examples

