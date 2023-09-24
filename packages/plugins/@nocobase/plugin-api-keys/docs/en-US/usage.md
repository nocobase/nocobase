# API keys Usage

## Creating an API key

After enabling the plugin, go to the API keys plugin management page, click `Add API key`, fill in the relevant information, and click Save to create an API key.

## Using an API key

Add the `Authorization` field to the request header, with the value of `Bearer ${API_KEY}`, to access all `NocoBase` APIs using the API key.

Here's an example using cURL:

```bash
curl '{domain}/api/roles:check' -H 'Authorization: Bearer {API key}'
```

## Deleting an API key

After deleting the API key, it will no longer be usable.
