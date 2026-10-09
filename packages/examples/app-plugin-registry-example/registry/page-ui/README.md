# Registry Page UI Example

This item demonstrates a page-oriented Registry recipe. Its `pages` directory
is intentional because the item delivers a complete page.

After installation, the source lives at
`client/extensions/nocobase-registry-example-page-ui` and belongs to the
consuming application. The extension replaces only the component for the
stable route ID exported by
`@nocobase/app-plugin-registry-example/client/route-contracts`; the route path
and fallback page remain owned by the plugin.

The installed page imports `#components/ui/button`, so the consuming app must
have the shadcn `button` component. Remote `shadcn add` resolves it from
`registryDependencies`; repository-local `materialize` expects it to exist
already.

Review upgrades with a three-way merge instead of overwriting application
changes.
