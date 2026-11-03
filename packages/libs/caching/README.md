# Caching

`createCaching(config)` creates an application-local caching service with Memory built in. Get Cache, Counter and BloomFilter capabilities through `getCache`, `getCounter` and `getBloomFilter`, passing a namespace and optionally a configured provider name.

## Driver migration

The global `registerCachingDriver` and `getCachingDriver` exports have been removed. Register on the exact `Caching` instance used by the application instead:

```ts
const caching = createCaching({
  default: 'shared',
  providers: { shared: { driver: 'custom' } },
});
caching.registerDriver(customDriver);
```

Registration returns `void`; duplicate names on one instance, including `memory`, fail. Different instances may register the same name. Factories are synchronous and registration neither creates providers nor connects to external services. Register before consumers first select the driver. Drivers are resolved lazily when a capability getter first selects a provider, not during application boot. An unavailable default driver fails on first use. Unselected definitions may name unavailable drivers. Unknown provider names never fall back to Memory.

## Resource ownership

`dispose()` retains its existing behavior: clear the provider cache and call each provider's `dispose`. It is not terminal; later getters may call a registered factory again. An externally owned provider may use a non-owning `dispose`; its plugin must then own and close its connections during application shutdown and reject operations after that shutdown. Close the application, not only the caching service, to release plugin-owned resources. Memory behavior and supported values are unchanged.
