# API keys Usage

## Creating an API Key

After enabling the plugin, go to the API keys plugin management page, click `Add API Key`, fill in the relevant information, and click Save to create an API Key.

## Using an API Key

Add the `Authorization` field to the request header, with the value of `Bearer ${API_KEY}`, to access all `NocoBase` APIs using the API Key.

Here's an example using cURL:

```bash
curl '{domain}/api/roles:check' -H 'Authorization: Bearer {API Key}'
```

## Deleting an API Key

Currently, deleting an API Key does not make it invalid. Please keep your API Key safe.
