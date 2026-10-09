---
title: 'API keys'
description: 'Create an API key for scripts and external systems to call application APIs.'
---

# API keys

An API key lets scripts, scheduled jobs, or external systems call application APIs without signing in through a browser. By default, a key represents its creator and uses that user's existing permissions.

For example, a procurement application can synchronize orders daily. Create a key for the account that performs the synchronization so the program can read orders that account may access.

## Create a key

Sign in with the account that will call the API. Go to Settings → API keys and click Create key. Enter a descriptive name, such as `Order sync`, and select an expiration period.

![Enter a name and expiration period for an API key](../../../../cn/capabilities/auth/assets/api-key-create.png)

The full key appears only once after creation. Copy it and save it in the calling program's runtime environment. The list subsequently displays only a fragment for identification; you cannot retrieve the full value again.

The account needs permission to access the API keys page. If this setting is unavailable, ask an application administrator to grant the appropriate role access.

## View and revoke keys

The list shows each key's name, status, expiration, and last-used time.

![View the order synchronization key and its usage status](../../../../cn/capabilities/auth/assets/api-key-list.png)

When a key is no longer needed, click its revoke action and confirm. The revoked key can no longer call APIs. Create a new key if you need to connect again.

A key does not grant additional permissions. Create it with an account that has suitable business permissions. Disabling an account also prevents its keys from accessing the application.

## Example: fetch orders with a script

This example reads orders from a procurement application. First save the key in the script's runtime environment as `NOCOBASE_API_KEY`, then ask your development Agent:

```text
My API key is stored in the NOCOBASE_API_KEY environment variable.
Write a Python script that calls the procurement application's orders API, fetches all orders this account is permitted to access, and prints the result.
The application URL is http://localhost:13000/main and the orders API path is /api/orders.
Read the key from the environment variable rather than putting it in the script.
```

The generated script reads the key from the environment, places it in the `x-api-key` request header, and calls the orders API. For this example, the script can be:

```python
import json
import os
from urllib.request import Request, urlopen

request = Request(
    "http://localhost:13000/main/api/orders",
    headers={"x-api-key": os.environ["NOCOBASE_API_KEY"]},
)
with urlopen(request) as response:
    result = json.load(response)

print(json.dumps(result, ensure_ascii=False, indent=2))
```

Save the script as `fetch_orders.py` and run `python3 fetch_orders.py` in a terminal with the environment variable set. A successful request prints orders accessible to the account, for example:

```json
{
  "data": [
    {
      "number": "PO-2026-001",
      "title": "Office equipment purchase",
      "status": "approved"
    }
  ]
}
```

This excerpt shows one order and only some of its fields. For your application, replace the URL and API path in the prompt with the actual values. If the orders API returns paginated data, ask your Agent to fetch all pages using that API's pagination format.
