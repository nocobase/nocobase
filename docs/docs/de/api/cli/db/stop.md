---
title: 'nb db stop'
description: 'Referenz zum Befehl nb db stop: Stoppt den integrierten Datenbank-Container der angegebenen env.'
keywords: 'nb db stop,NocoBase CLI,Datenbank stoppen,Docker'
---

# nb db stop

Stoppt den integrierten Datenbank-Container der angegebenen env. Dieser Befehl gilt nur für envs, bei denen die CLI-verwaltete integrierte Datenbank aktiviert ist.

## Verwendung

```bash
nb db stop [flags]
```

## Parameter

| Parameter     | Typ     | Beschreibung                                                                                                          |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Name der CLI-env, deren integrierte Datenbank gestoppt werden soll; wenn ausgelassen, wird die aktuelle env verwendet |
| `--verbose`   | boolean | Zeigt die Ausgabe des zugrunde liegenden Docker-Befehls an                                                            |

## Beispiele

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Verwandte Befehle

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
