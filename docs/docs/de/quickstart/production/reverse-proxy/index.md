---
title: "Reverse Proxy in Produktion"
description: "Mit nb proxy nginx und nb proxy caddy Reverse-Proxy-Konfigurationen für CLI-verwaltete NocoBase-Envs erzeugen und verwalten."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,Produktion"
---

# Reverse Proxy in Produktion

In der NocoBase CLI sind diese beiden Einstiegspunkte die empfohlene Wahl für einen produktiven Reverse Proxy:

- `nb proxy nginx`
- `nb proxy caddy`

Dabei gilt:

- `proxy` verwaltet die Entry-Ebene
- `nginx` und `caddy` sind die Provider-Implementierungen
- `docker` und `local` sind die Runtime-Driver
- `--env <name>` gibt an, für welches CLI-Env die Konfiguration erzeugt werden soll

Solange deine Anwendung als CLI-verwaltetes Env gespeichert wurde und dieses Env `local` oder `docker` ist, reicht es normalerweise aus, die Konfiguration direkt von der CLI erzeugen und verwalten zu lassen. So bleiben WebSocket-Behandlung, Subpfade, SPA-Fallback-Seiten und spätere Aktualisierungen an einer Stelle abgestimmt.

Wenn die Anwendung nicht CLI-verwaltet ist oder du die vollständige Proxy-Konfiguration bewusst selbst pflegen willst, geh direkt zu den Abschnitten für handgeschriebene Konfiguration auf den Provider-Seiten.

## Vor dem Start

Stelle sicher, dass:

- die Anwendung intern bereits erreichbar ist, zum Beispiel unter `http://127.0.0.1:13000`
- die Anwendung bereits als CLI-Env gespeichert wurde und dieses Env `local` oder `docker` ist
- im Env bereits `appPort` gespeichert ist

Wenn der Befehl meldet, dass `appPort` fehlt, ergänze es zuerst mit [`nb env update`](../../../api/cli/env/update.md).

Wenn du später Einstellungen wie `app-port` oder `app-public-path` änderst, die das Proxy-Verhalten beeinflussen, führe den passenden `generate`-Befehl erneut aus.

## Standardablauf

Für Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Für Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Die Rollen dieser Schritte sind:

- `use docker|local`: Runtime-Driver des aktuellen Providers wählen
- `generate --env <name> --host <domain>`: Reverse-Proxy-Konfiguration für ein Env erzeugen
- `start`: lokalen Prozess oder Docker-Container des aktuellen Providers starten

Wenn du die Konfiguration später aktualisierst, ist `reload` normalerweise die erste Wahl. Verwende `restart`, wenn du die Entry-Ebene vollständig neu starten musst.

## Aufteilung der Befehlsgruppe

Am Beispiel von Nginx:

| Befehl | Zweck |
| --- | --- |
| `nb proxy nginx use docker` | Nginx-Runtime auf Docker umstellen |
| `nb proxy nginx use local` | Nginx-Runtime auf einen lokalen Prozess umstellen |
| `nb proxy nginx current` | Aktuellen Runtime-Driver anzeigen |
| `nb proxy nginx generate --env <name> --host <domain>` | Nginx-Konfiguration für ein Env erzeugen |
| `nb proxy nginx start` | Nginx starten |
| `nb proxy nginx reload` | Nginx-Konfiguration neu laden |
| `nb proxy nginx restart` | Nginx neu starten |
| `nb proxy nginx stop` | Nginx stoppen |
| `nb proxy nginx status` | Nginx-Status anzeigen |
| `nb proxy nginx info` | Aktuelle Konfiguration, Pfade und Runtime-Details anzeigen |

Caddy verwendet dieselbe Aktionsgruppe, nur mit einem anderen Provider.

## Was die CLI verwaltet

Die CLI erzeugt nicht nur ein einzelnes Proxy-Fragment. Sie hält auch die Hilfsdateien und die Site-Entry-Struktur passend zum jeweiligen Provider synchron:

- Nginx verwaltet gemeinsame `snippets`, `app.conf`, `public/index-v1.html` und `public/index-v2.html`
- Caddy verwaltet `nocobase.caddy`, `app.caddy`, `public/index-v1.html` und `public/index-v2.html`, wobei `app.caddy` die vollständige Site-Konfiguration für ein einzelnes Env ist

:::warning Hinweis

Wenn du Site-Level-Konfiguration ergänzen musst, bearbeitest du bei Nginx normalerweise `app.conf` und verwendest bei Caddy `app.caddy` als Ausgangspunkt. Bearbeite CLI-verwaltete Hilfsdateien nicht direkt. Beachte außerdem, dass `app.caddy` beim erneuten Ausführen von `generate` vollständig überschrieben wird, während `nocobase.caddy` hauptsächlich als Entry-Datei auf Provider-Ebene dient.

:::

## Welche Seite du zuerst öffnen solltest

| Ich möchte... | Hier weiterlesen |
| --- | --- |
| Nginx weiter für Websites, Zertifikate, Caching oder Zugriffskontrolle verwenden | [Nginx](./nginx.md) |
| HTTPS schnell verfügbar machen und weniger TLS-Details pflegen | [Caddy](./caddy.md) |
| Env-Einstellungen anpassen, die das Proxy-Verhalten beeinflussen können, etwa `app-port` oder `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Die Anwendung zuerst als CLI-verwaltetes Env installieren | [Mit der CLI installieren](../../installation/cli.md) |

## Wann der CLI-Weg nicht der richtige ist

In diesen Fällen passen die Abschnitte für handgeschriebene Konfiguration auf den Provider-Seiten meist besser:

- die Anwendung ist nicht CLI-verwaltet
- das Env ist nur eine entfernte API-Verbindung oder ein SSH-Env
- du möchtest die vollständige Nginx-Konfiguration oder das gesamte `Caddyfile` bewusst selbst pflegen

Solange die Anwendung als CLI-Env gespeichert ist und ihre Runtime vom aktuellen Rechner aus erreichbar ist, bleibt diese Befehlsgruppe dennoch die empfohlene Standardwahl. Spätere Änderungen an Domain, Site-Level-Konfiguration, Driver oder neu erzeugten Entry-Dateien lassen sich so in der Regel deutlich einfacher pflegen.

## Verwandte Links

- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Umgebungsvariablen](../../installation/env.md)
- [Mit der CLI installieren](../../installation/cli.md)
