---
title: "Produktionsbereitstellung"
description: "Stellen Sie NocoBase produktiv bereit: Aktivieren Sie zuerst den automatischen Start der Anwendung und konfigurieren Sie dann einen Reverse Proxy."
keywords: "NocoBase,Produktionsbereitstellung,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Produktionsbereitstellung

Wenn Ihre NocoBase-Anwendung bereits korrekt auf dem Server läuft, sind für den Produktivbetrieb normalerweise nur noch zwei Schritte nötig:

1. Sicherstellen, dass die Anwendung nach einem Neustart des Servers automatisch wieder startet
2. Einen Reverse Proxy vor die Anwendung setzen, um einen stabilen externen Zugriff bereitzustellen

Im NocoBase CLI sind die wichtigsten Befehle dafür:

- `nb app autostart`
- `nb env proxy`

Diese Seite erklärt zuerst den Gesamtweg. Für Details zu Nginx oder Caddy gehen Sie anschließend zu den jeweiligen Unterseiten.

## Schritt 1: Autostart der Anwendung aktivieren

In Produktionsumgebungen ist die erste Priorität nicht die Domain, sondern dass sich der Dienst nach Neustarts, Container-Neuerstellungen oder Wartungsarbeiten zuverlässig wiederherstellen lässt.

Im CLI ist `nb app autostart` eine Befehlsgruppe. Am häufigsten werden diese Befehle verwendet:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Aktivieren Sie den Autostart für die aktuelle Env:

```bash
nb app autostart enable
```

Wenn Sie explizit eine andere Env angeben möchten:

```bash
nb app autostart enable --env app1 --yes
```

Danach können Sie prüfen, welche Envs für den Autostart markiert sind:

```bash
nb app autostart list
```

Nach dem Systemstart verwenden Sie den folgenden Befehl, um alle für den Autostart markierten Envs zu starten:

```bash
nb app autostart run
```

Wenn Sie zur Fehlersuche die zugrunde liegende Startausgabe sehen möchten:

```bash
nb app autostart run --verbose
```

:::tip Was diese Befehle tatsächlich tun

`nb app autostart enable` markiert eine vom CLI verwaltete Env als automatisch startbar.  
`nb app autostart run` startet dann tatsächlich alle Envs, die für den Autostart markiert wurden.

Das bedeutet: In einer echten Produktionsumgebung müssen Sie `nb app autostart run` normalerweise zusätzlich in Ihren eigenen Systemstart einbinden, zum Beispiel über `systemd`, ein Startskript Ihrer Container-Plattform oder einen anderen Host-Boot-Mechanismus.

:::

### Geltungsbereich

`nb app autostart` gilt nur für Envs mit einer vom CLI verwalteten Laufzeit auf der aktuellen Maschine:

- `local`
- `docker`

Wenn die Env nur eine Remote-API-Verbindung ist oder die Anwendung auf dieser Maschine nicht lokal vom CLI verwaltet wird, sind diese Befehle nicht für den Autostart geeignet.

## Schritt 2: Reverse Proxy konfigurieren

Sobald die Anwendung automatisch wieder starten kann, ist der nächste Schritt der externe Zugriffspunkt. In Produktionsumgebungen übernimmt der Reverse Proxy typischerweise:

- das Binden der Domain oder des öffentlichen Ports
- das Weiterleiten von HTTP- und WebSocket-Anfragen an NocoBase
- die Verwaltung von HTTPS, Zertifikaten, Caching oder Zugriffskontrolle

Im NocoBase CLI sind die empfohlenen Einstiegspunkte:

- `nb env proxy nginx`
- `nb env proxy caddy`

### Standardvorgehen

Wenn Ihre Anwendung bereits als CLI-Env gespeichert ist und eine `local`- oder `docker`-Env ist, reicht es in der Regel aus, die Proxy-Konfiguration vom CLI generieren zu lassen:

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

Wenn die aktuelle Env bereits die Ziel-Env ist, können Sie `--env` weglassen:

```bash
nb env proxy nginx --host app.example.com
```

Das CLI hilft dabei, Details abzudecken, die bei handgeschriebenen Konfigurationen leicht übersehen werden, zum Beispiel:

- WebSocket-Weiterleitung
- Eintrags- und statische Asset-Pfade bei Unterpfad-Bereitstellungen
- SPA-Fallback-Seiten
- gemeinsame Konfigurationsdateien des Providers

### Wann Nginx und wann Caddy?

In der Regel können Sie so entscheiden:

| Szenario | Empfehlung |
| --- | --- |
| Sie verwenden bereits Nginx für Websites, Caching, Zertifikate oder Zugriffskontrolle | [Nginx](./reverse-proxy/nginx.md) |
| Sie haben bereits eine Domain und möchten HTTPS schnell mit weniger TLS-Pflege aktivieren | [Caddy](./reverse-proxy/caddy.md) |
| Sie möchten zuerst die Gesamtübersicht dieser Befehlsgruppe lesen | [Production Reverse Proxy](./reverse-proxy/index.md) |

Wenn Sie Env-Einstellungen ändern, die das Proxy-Ergebnis beeinflussen, etwa `app-port` oder `app-public-path`, denken Sie daran, den entsprechenden Proxy-Unterbefehl erneut auszuführen.

## Empfohlener Rollout-Pfad

Wenn Sie den einfachsten Weg in die Produktion möchten, funktioniert diese Reihenfolge normalerweise gut:

1. Sicherstellen, dass die Anwendung bereits direkt auf dem Server korrekt startet
2. `nb app autostart enable` ausführen
3. `nb app autostart run` in den Systemstartprozess einbinden
4. Nginx oder Caddy auswählen und den passenden `nb env proxy`-Unterbefehl ausführen
5. Den externen Zugriff über die endgültige Domain oder öffentliche Adresse prüfen

## Schnellzugriffe

| Ich möchte... | Hier weiterlesen |
| --- | --- |
| Mit der allgemeinen Erklärung zum Reverse Proxy beginnen | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Weiterhin Nginx für die Einstiegsschicht verwenden | [Nginx](./reverse-proxy/nginx.md) |
| Caddy für eine schnellere HTTPS-Einrichtung verwenden | [Caddy](./reverse-proxy/caddy.md) |
| Start, Stopp, Logs und Upgrades verwalten | [Manage Apps](../operations/manage-app.md) |
| Die CLI-Referenz zu `nb env proxy` lesen | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Verwandte Befehle

```bash
# Autostart für eine Env aktivieren
nb app autostart enable --env app1 --yes

# Autostart-Status anzeigen
nb app autostart list

# Alle für Autostart aktivierten Envs starten
nb app autostart run

# Nginx-Reverse-Proxy-Konfiguration generieren
nb env proxy nginx --env app1 --host app.example.com

# Caddy-Reverse-Proxy-Konfiguration generieren
nb env proxy caddy --env app1 --host app.example.com
```
