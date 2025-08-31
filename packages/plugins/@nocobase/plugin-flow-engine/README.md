## Flow Engine (Server)

This plugin provides server endpoints used by the Flow Engine. It now includes a secure server-side variable resolver for `{{ ctx.* }}` expressions.

### variables:resolve API

- URL: `/api/variables:resolve`
- Method: POST
- Auth: logged in recommended (ACL is honored if enabled)
- Body (two forms, pick one):
  - Use whole `values` as template
  - Or put template under `values.template`

Examples:

1) Resolve from whole `values`:

POST /api/variables:resolve
{
  "userId": "{{ ctx.user.id }}",
  "now": "{{ ctx.now }}",
  "unknown": "{{ ctx.notExist }}"
}

Response data keeps unresolvable placeholders as-is:
{
  "data": {
    "userId": 1,
    "now": "2024-08-30T12:34:56.000Z",
    "unknown": "{{ ctx.notExist }}"
  }
}

2) Resolve using `values.template`:

POST /api/variables:resolve
{
  "template": { "time": "{{ ctx.timestamp }}" }
}

Response:
{
  "data": { "time": 1725000000000 }
}

Server-side ctx layers (Server Base Context):
- GlobalContext: `now`, `timestamp`, `env`
- HttpRequestContext: `user`, `roleName`, `locale`, `ip`, `headers`, `query`, `params`, `record`
- Both contexts extend a shared Server Base Context and support `ctx.defineMethod(name, fn)` for callable helpers, e.g., `{{ ctx.formatDate(ctx.now) }}`.

Record context params
- When your template references `{{ ctx.record ... }}`, pass `contextParams.record`:

POST /api/variables:resolve
{
  "template": {
    "id": "{{ ctx.record.id }}"
  },
  "contextParams": {
    "record": {
      "dataSourceKey": "main",            // optional, default 'main'
      "collection": "users",               // required
      "filterByTk": 1,                      // required
      "fields": ["id"],                    // optional
      "appends": ["roles"]                 // optional, load associations for nested access
    }
  }
}

If required params are missing, the API returns 400 with:
{
  "error": {
    "code": "INVALID_CONTEXT_PARAMS",
    "message": "Missing required parameters for record context: contextParams.record.collection, contextParams.record.filterByTk",
    "missing": ["contextParams.record.collection", "contextParams.record.filterByTk"]
  }
}

Notes:
- The resolver executes expressions inside a SES Compartment with a minimal, whitelisted global scope.
- It supports path access and basic JS operations (e.g., `{{ ctx.user.id + 1 }}`, `{{ ctx.record.roles[0].name }}`), via a safe rewrite to an internal `__get(var, path)` accessor.
- Only whitelisted ctx properties are available. Unresolvable or unsupported references are preserved as-is.
- Global `env` is filtered to public prefixes only (PUBLIC_, NEXT_PUBLIC_, NCB_PUBLIC_) to avoid leaking secrets.
