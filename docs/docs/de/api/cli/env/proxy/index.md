---
title: 'nb env proxy'
description: 'Referenz zum Thema nb env proxy: Hier findest du die Unterbefehle für Nginx und Caddy.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,Proxy-Konfiguration'
---

# nb env proxy

In der NocoBase CLI ist `nb env proxy` jetzt ein Thema. Der Befehl erzeugt selbst keine Konfiguration mehr. Er dient vor allem dazu, die Provider-Unterbefehle für Nginx und Caddy zu finden.

Wenn deine App bereits als von der CLI verwaltetes env gespeichert wurde und dieses env den Typ `local` oder `docker` hat, reicht es normalerweise aus, einen der Provider-Unterbefehle direkt zu verwenden.

## Verwendung

```bash
nb env proxy
```

## Welchen Unterbefehl solltest du zuerst öffnen

| Ich möchte... | Hier entlang |
| --- | --- |
| Weiter Nginx für Sites, Zertifikate, Caching oder Zugriffskontrolle verwenden | [`nb env proxy nginx`](./nginx.md) |
| HTTPS schnell aktivieren und weniger TLS-Details selbst pflegen | [`nb env proxy caddy`](./caddy.md) |
| Env-Einstellungen anpassen, die die Proxy-Ausgabe beeinflussen können, etwa `app-port` oder `app-public-path` | [`nb env update`](../update.md) |

## Hinweise

- `nb env proxy` hat keine eigenen Flags
- `nb env proxy nginx` und `nb env proxy caddy` sind die Befehle, die tatsächlich Konfigurationen erzeugen
- Beide Unterbefehle funktionieren nur für verwaltete envs, deren Runtime von der aktuellen Maschine aus erreichbar ist, also `local` oder `docker`
- Wenn du Einstellungen wie `app-port` oder `app-public-path` mit `nb env update` änderst, musst du den passenden Proxy-Unterbefehl danach in der Regel erneut ausführen
- Diese Befehlsgruppe funktioniert derzeit nicht für envs mit ausschließlich entfernter API-Verbindung oder für SSH-envs

## Beispiele

```bash
# Themenhilfe anzeigen
nb env proxy

# Nginx-Konfiguration für ein env erzeugen
nb env proxy nginx --env demo --host demo.local.nocobase.com

# Caddy-Konfiguration für ein env erzeugen
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## Verwandte Befehle

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
