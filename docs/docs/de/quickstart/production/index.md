---
title: "Bereitstellung in Produktion"
description: "NocoBase schnell für Produktion bereitstellen: zuerst App-Autostart konfigurieren, dann den Reverse Proxy."
keywords: "NocoBase,Produktion,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Bereitstellung in Produktion

Wenn deine NocoBase-Anwendung bereits normal auf dem Server läuft, braucht ein produktiver Rollout normalerweise nur noch zwei Dinge:

1. sicherstellen, dass die Anwendung nach einem Neustart des Systems automatisch wieder hochkommt
2. einen Reverse-Proxy-Einstiegspunkt hinzufügen, damit die Anwendung von außen stabil erreichbar ist

In der NocoBase CLI sind dafür vor allem diese beiden Befehlsgruppen relevant:

- `nb app autostart`
- `nb proxy`

Diese Seite erklärt zuerst den Gesamtweg. Für Details zu Nginx oder Caddy gehst du anschließend auf die provider-spezifischen Seiten.

## Schritt 1: App-Autostart konfigurieren

In Produktion ist nicht zuerst die Domain wichtig, sondern dass sich der Dienst selbst zuverlässig erholen kann. Sonst kommt die Anwendung nach einem Maschinenneustart, einer Container-Neuerstellung oder Wartungsarbeiten womöglich nicht automatisch zurück.

Die am häufigsten verwendeten Unterbefehle von `nb app autostart` sind:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Autostart für das aktuelle Env aktivieren:

```bash
nb app autostart enable
```

Wenn das Ziel nicht das aktuelle Env ist, gib es explizit an:

```bash
nb app autostart enable --env app1 --yes
```

Prüfen, welche Envs für Autostart markiert sind:

```bash
nb app autostart list
```

Nach dem Systemstart alle aktivierten Envs starten:

```bash
nb app autostart run
```

Wenn du beim Debuggen detaillierte Startausgaben sehen möchtest:

```bash
nb app autostart run --verbose
```

:::tip Was dieser Schritt tatsächlich macht

`nb app autostart enable` markiert ein CLI-verwaltetes Env so, dass es automatisch gestartet werden darf. `nb app autostart run` startet dann tatsächlich alle Envs, für die Autostart aktiviert wurde.

In Produktion musst du `nb app autostart run` in der Regel trotzdem in deinen eigenen Systemstart einbinden, etwa über `systemd`, ein Startskript auf der Container-Plattform oder einen anderen Host-Mechanismus, den du bereits verwendest.

:::

### Geltungsbereich

`nb app autostart` funktioniert nur für Envs mit einer von der CLI verwalteten Runtime:

- `local`
- `docker`

Wenn ein Env nur eine entfernte API-Verbindung ist oder die Anwendung auf dem aktuellen Rechner nicht lokal von der CLI verwaltet wird, ist diese Befehlsgruppe nicht der richtige Weg für Autostart.

## Schritt 2: Reverse Proxy konfigurieren

Sobald sich die Anwendung automatisch wiederherstellen kann, folgt der externe Einstiegspunkt. In Produktion übernimmt der Reverse Proxy normalerweise diese Aufgaben:

- Domain oder Entry-Port binden
- HTTP- und WebSocket-Anfragen an NocoBase weiterleiten
- HTTPS, Zertifikate, Caching oder Zugriffskontrolle übernehmen

Die empfohlenen CLI-Einstiegspunkte sind:

- `nb proxy nginx`
- `nb proxy caddy`

### Standardablauf

Wenn die Anwendung bereits als CLI-Env gespeichert wurde und dieses Env `local` oder `docker` ist, lässt du die CLI die Konfiguration normalerweise direkt erzeugen:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Danach den gewählten Provider starten:

```bash
nb proxy nginx start
nb proxy caddy start
```

Die CLI kümmert sich dabei auch um Details, die in handgeschriebenen Konfigurationen leicht übersehen werden, zum Beispiel:

- WebSocket-Weiterleitung
- Entry- und Asset-URLs unter Subpfaden
- SPA-Fallback-Seiten
- gemeinsam genutzte Konfigurationsdateien auf Provider-Ebene

### Wann Nginx und wann Caddy

| Szenario | Empfehlung |
| --- | --- |
| Du verwendest Nginx bereits für Websites, Caching, Zertifikate oder Zugriffskontrolle | [Nginx](./reverse-proxy/nginx.md) |
| Du hast bereits eine Domain und willst HTTPS schnell aktivieren, mit weniger TLS-Details zur Pflege | [Caddy](./reverse-proxy/caddy.md) |
| Du möchtest zuerst die Gesamtübersicht lesen | [Reverse Proxy in Produktion](./reverse-proxy/index.md) |

Wenn du später Env-Einstellungen wie `app-port` oder `app-public-path` änderst, die das Proxy-Verhalten beeinflussen, führe den passenden Proxy-Unterbefehl erneut aus.

## Standardpfad für den Rollout

Für den einfachsten produktiven Rollout reicht normalerweise diese Reihenfolge:

1. sicherstellen, dass die Anwendung bereits direkt auf dem Server normal startet
2. `nb app autostart enable` ausführen
3. `nb app autostart run` in den Systemstart einbinden
4. Nginx oder Caddy wählen und den passenden `nb proxy`-Unterbefehl ausführen
5. den externen Zugriff über Domain oder Entry-Adresse prüfen

## Schnelleinstieg

| Ich möchte... | Hier weiterlesen |
| --- | --- |
| Zuerst die allgemeine Einführung zum Reverse Proxy lesen | [Reverse Proxy in Produktion](./reverse-proxy/index.md) |
| Nginx auf der Entry-Ebene weiterverwenden | [Nginx](./reverse-proxy/nginx.md) |
| Mit Caddy schneller HTTPS bekommen | [Caddy](./reverse-proxy/caddy.md) |
| App-Start, Stop, Logs und Upgrade-Vorgänge ansehen | [App verwalten](../operations/manage-app.md) |
| Die CLI-Referenz für `nb proxy nginx` lesen | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Die CLI-Referenz für `nb proxy caddy` lesen | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Verwandte Befehle

```bash
# Autostart für ein Env aktivieren
nb app autostart enable --env app1 --yes

# Autostart-Status prüfen
nb app autostart list

# Alle aktivierten Envs starten
nb app autostart run

# Nginx-Runtime wählen und Konfiguration erzeugen
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Caddy-Runtime wählen und Konfiguration erzeugen
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
