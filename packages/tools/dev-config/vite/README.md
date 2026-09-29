# Application Vite factory

`createAppViteConfig` provides the shared application build baseline:

- React and Tailwind Vite plugins;
- `dist/client` build output;
- a relative `base` for builds, so one build can be mounted at any path;
- the development `base` from `APP_BASE_PATH`, which `pnpm dev` passes to Vite;
- development HMR client port from `APP_VITE_DEV_PORT`;
- development HMR host from `APP_VITE_DEV_HOST` when it is set to a specific
  hostname. When it is unset or `0.0.0.0`, Vite uses the page hostname.

Pass a Vite config object or config function. It is merged after the shared
configuration, so local values can extend or override the baseline:

```js
import { createAppViteConfig } from '@nocobase/dev-config/vite/app';
import path from 'node:path';

export default createAppViteConfig(() => ({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './client'),
    },
  },
}));
```

The effective Vite `root` defaults to `process.cwd()`. Set `root` in the local
config when Vite runs from another directory.

## Mount path

A build does not know where it will be mounted. With a relative `base`, Vite resolves every chunk, preload dependency and asset against the module that references it, and CSS `url()` against its own file. The only relative references left are in `index.html` — its `./assets/` chunks and every `public/` file it names, such as `./favicon.svg` — which the application server rewrites to the mount path when it serves the page, together with the client configuration it renders there. The mount path is chosen at run time, through `APP_BASE_PATH` for a standalone server or by the Hub for an application it hosts.

The development server cannot use a relative base, so it serves from the mount path in `APP_BASE_PATH` and refuses to start without one. `pnpm dev` always sets it. The same applies to anything else that resolves the configuration in serve mode, such as `vite preview`, which is not a way to look at a build anyway: the page needs the client configuration only the application server renders into it, so a build is previewed with `pnpm start`.

## Application plugin contributions

Call `await loadAppVitePlugins({ appRoot, environment })` from `@nocobase/dev-config/vite/plugins` and include the returned plugins in the application's Vite config. The loader reads the explicit `defineClientPlugins([...])` calls in `client/plugins.ts`, without importing browser modules into the configuration process. Use default imports of package `/client` entries and explicit factory calls in that array; aliases of `defineClientPlugins` are supported. Merely importing a plugin or listing it in management metadata does not enable its contribution.

A registered package may export `./vite` with a default factory accepting `{ appRoot, environment, registration }`. The loader resolves that export with Node ESM import conditions from the application, so it works with pnpm's isolated dependencies and import-only exports. A package need not export its own `package.json`.

A contribution must not require the package's client code to import an id that only its Vite plugin can resolve. An installing application pre-bundles that client code from `node_modules` with esbuild, which runs no Vite plugin, and an application that does not call the loader must still build. When the page needs a virtual module, inject it from the plugin, for example with a development-only `transformIndexHtml` script, as the Workflow contribution does.

## What stays out

Browser code reads its runtime values from the client configuration the server renders into the page, so do not add `define` entries or `envPrefix` settings that bake environment values into the client. Keep proxy settings, aliases and package-specific plugins local.

Development excludes `@silurus/ooxml` from dependency prebundling to preserve its parser WASM asset URLs.
