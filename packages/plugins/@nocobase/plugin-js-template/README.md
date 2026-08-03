# JS Templates

`@nocobase/plugin-js-template` is the canonical package for the JS Templates product. It resolves to the established
`light-extension` plugin runtime so existing installations keep one plugin record, one enable state, and the same
persistent RunJS and VSC identities.

The canonical package ships server, client, and client-v2 facade entries and installs
`@nocobase/plugin-light-extension` as its compatible runtime implementation. The legacy package remains independently
buildable, installable, and publishable for existing deployments, cached artifacts, and rollback.

See the
[migration, upgrade, rollback, and final acceptance guide](../plugin-light-extension/docs/js-templates-migration-compatibility.md)
before changing packages in an existing application.
