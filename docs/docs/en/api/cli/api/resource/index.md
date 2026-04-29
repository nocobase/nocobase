---
title: "nb api resource"
description: "nb api resource command reference: run generic CRUD and aggregate queries against any NocoBase resource."
keywords: "nb api resource,NocoBase CLI,CRUD,resource,collection"
---

# nb api resource

Run generic CRUD and aggregate queries against any NocoBase resource. The resource can be a normal resource such as `users`, or an association resource such as `posts.comments`.

## Usage

```bash
nb api resource <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb api resource list`](./list.md) | List resource records |
| [`nb api resource get`](./get.md) | Get one resource record |
| [`nb api resource create`](./create.md) | Create a resource record |
| [`nb api resource update`](./update.md) | Update resource records |
| [`nb api resource destroy`](./destroy.md) | Delete resource records |
| [`nb api resource query`](./query.md) | Run aggregate queries |

## Common Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase API URL, for example `http://localhost:13000/api` |
| `--verbose` | boolean | Show detailed progress |
| `--env`, `-e` | string | Env name |
| `--role` | string | Role override sent as the `X-Role` request header |
| `--token`, `-t` | string | API key override |
| `--json-output`, `-j` / `--no-json-output` | boolean | Whether to output raw JSON; enabled by default |
| `--resource` | string | Resource name, required, for example `users`, `orders`, or `posts.comments` |
| `--data-source` | string | Data source key, default `main` |

Association resource commands can also use `--source-id` to specify the source record ID.

## Examples

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Related Commands

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
