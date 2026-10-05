---
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

An application can set global limits for every `/api` request in a new `api` section of `config.yml`. All three are off by default and nothing is installed for one that is unset, so an application that does not set them behaves as before.

```yaml
api:
  bodyLimit: 10mb
  timeout: 30s
  rateLimit:
    max: 600
    window: 1m
```

- `bodyLimit` refuses a larger body, whether it declares its length or streams it, with `413 INVALID_ARGUMENT`, reason `BODY_TOO_LARGE`. It is a ceiling over every route; a route that needs a smaller limit sets its own.
- `timeout` answers `503 UNAVAILABLE`, reason `REQUEST_TIMEOUT`, when a handler has not returned its response within the deadline. It covers only the time until the response exists, so a streaming response (SSE, NDJSON) that has started is not cut off. The handler is not cancelled; what it returns or throws after the deadline is discarded.
- `rateLimit` allows `max` requests per `window` from each client connection address and answers `429 RESOURCE_EXHAUSTED`, reason `RATE_LIMITED`, with a `Retry-After` header in seconds. `GET /api/healthz` is exempt; Better Auth's routes under `/api/auth/` are counted. Counters are fixed windows kept in process memory and bounded, so each instance of a multi-instance deployment counts on its own, and behind a reverse proxy every request shares the proxy's address. A request whose address is unknown, such as one a Hub forwards to an application it hosts in process, is not counted.

All three answer in the standard error body with domain `app` and the request's `x-request-id`. Sizes are a number of bytes or a string such as `512kb`, `10mb` or `1gb`; durations a number of milliseconds or a string such as `500ms`, `30s`, `1m` or `1h`.

`@nocobase/app-server/router` exports `defineApiConfig()`, which declares the section with its validation, so `pnpm nocobase config check` and every start report a malformed value, and maps `API_BODY_LIMIT` and `API_TIMEOUT`; `installApiLimits()` and the individual middlewares are exported too. The three templates declare the section in `server/config/api.ts` and document it, commented out, in `config.example.yml`. An existing application adds the same `server/config/api.ts` and registers it in `server/config/index.ts` to get validation and the environment variables; without it, the limits it sets in `config.yml` still apply, but `config check` reports `api` as an unknown section.

The `nocobase-app-development` Skill's HTTP API reference describes the limits and their reasons, and the `nocobase-deployment` Skill lists them among the production settings to review.
