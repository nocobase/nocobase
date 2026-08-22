---
title: "Reverse-Proxy für die Produktionsumgebung"
description: "Generieren und verwalten Sie die Reverse-Proxy-Konfiguration für die von der CLI gehostete NocoBase-Umgebung basierend auf nb-Proxy-Nginx und nb-Proxy-Caddy."
keywords: "NocoBase, NB-Proxy-Nginx, NB-Proxy-Caddy, Reverse-Proxy, Nginx, Caddy, Produktionsumgebung"
---


# Reverse-Proxy

Dieser Artikel gilt nur für Anwendungen, die mit `nb init` installiert wurden.

In NocoBase leistet der Reverse-Proxy der Produktionsumgebung mehr als nur die Weiterleitung von Anfragen an den Anwendungsprozess. Er muss auch WebSockets, Unterpfade, statische Front-End-Ressourcen, Upload-Verzeichnisse, die Dateizugriffsroute `/files/` und SPA-Fallback-Seiten verarbeiten.

Die Funktion von `nb proxy` besteht darin, diese leicht übersehenen Details in einem stabilen Satz von Befehlseinträgen zusammenzufassen.

## Kernprozess

Wenn Sie nur den Kernprozess betrachten, reicht es aus, sich diese drei Befehle zu merken:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Wenn Sie Caddy verwenden, ersetzen Sie einfach `nginx` im Befehl durch `caddy`.

`use local` und `use docker` können direkt wie folgt beurteilt werden:

- Wenn Nginx oder Caddy lokal installiert wurde, verwenden Sie `use local`
- Es gibt keine lokale Installation. Wenn Sie zulassen, dass CLI Docker zur Verwaltung des Agenten verwendet, verwenden Sie `use docker`

In den meisten Szenarien reicht es aus, zuerst `use`, dann `generate` und schließlich `reload` auszuführen. Weitere Informationen zu Nginx oder Caddy finden Sie auf den jeweiligen Seiten.

## Wann Sie sich für Nginx und wann für Caddy entscheiden sollten

Normalerweise lässt sich das so beurteilen:

| Szenario | Empfehlung |
| --- | --- |
| Sie verwenden Nginx bereits zur Verwaltung Ihrer Site, Zertifikate, Cache oder Zugriffskontrolle | [Nginx](./nginx.md) |
| Sie haben bereits einen Domänennamen und möchten so schnell wie möglich HTTPS ausführen und einige TLS-Details speichern, um sie beizubehalten | [Caddy](./caddy.md) |

## Lesen Sie weiter unten

| Ich möchte... | Wo suchen |
| --- | --- |
| Folgen Sie dem Eingang zur Nginx-Verwaltungsseite | [Nginx](./nginx.md) |
| HTTPS so schnell wie möglich verbinden | [Caddy](./caddy.md) |
| Passen Sie zunächst die Umgebungskonfiguration an, die sich auf die Proxy-Ergebnisse auswirkt, z. B. `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Bestätigen Sie zunächst die Installation und Umgebungskonfiguration der Anwendung | [Mit CLI installieren (empfohlen)](../../installation/cli.md) |
