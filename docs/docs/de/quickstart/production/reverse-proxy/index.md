---
title: 'Reverse Proxy für Produktion'
description: 'Verwende nb env proxy nginx und nb env proxy caddy, um Reverse-Proxy-Konfigurationen für von der CLI verwaltete NocoBase-envs zu erzeugen.'
keywords: 'NocoBase,nb env proxy nginx,nb env proxy caddy,reverse proxy,Nginx,Caddy,Produktion'
---

# Reverse Proxy für Produktion

In der NocoBase CLI gibt es zwei empfohlene Einstiege, um einer Produktions-App einen Reverse Proxy vorzuschalten:

- `nb env proxy nginx`
- `nb env proxy caddy`

Solange deine App bereits als CLI-env gespeichert ist und der Env-Typ `local` oder `docker` lautet, reicht es normalerweise aus, die Konfiguration von der CLI erzeugen zu lassen. So hält die CLI Details wie WebSocket-Behandlung, Subpfade, SPA-Fallback-Seiten und spätere Änderungen synchron. Du musst nur entscheiden, ob die Einstiegsschicht weiter Nginx nutzen oder auf Caddy wechseln soll.

Wenn deine App nicht von der CLI verwaltet wird oder du die komplette Proxy-Konfiguration bewusst selbst schreiben möchtest, geh direkt zum Abschnitt für handgeschriebene Konfiguration in den Provider-Seiten.

## Prüfe zuerst, ob dieser Weg zu deinem Setup passt

- Deine App ist intern bereits über eine Adresse wie `http://127.0.0.1:13000` erreichbar
- Die App wurde bereits als CLI-env gespeichert und der Env-Typ ist `local` oder `docker`
- Für das env ist `appPort` bereits gespeichert

Wenn der Befehl meldet, dass `appPort` fehlt, führe zuerst [`nb env update`](../../../api/cli/env/update.md) aus und speichere den Wert.

Wenn du später Einstellungen wie `app-port` oder `app-public-path` änderst, die die Proxy-Ausgabe beeinflussen, solltest du den passenden Proxy-Unterbefehl danach erneut ausführen.

## Standardweg: zuerst die Konfiguration von der CLI erzeugen lassen

Wenn du bereits weißt, welchen Einstiegs-Provider du weiter nutzen möchtest, kannst du direkt den passenden Unterbefehl aufrufen:

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy caddy --env demo --host demo.example.com
```

Wenn du bereits zum aktuellen env gewechselt hast, kannst du `--env` auch weglassen:

```bash
nb env proxy nginx --host demo.example.com
```

Dabei gilt:

- Wenn du Nginx bereits für Sites, Caching, Zugriffskontrolle oder Zertifikate nutzt, beginne mit [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- Wenn du HTTPS schnell aktivieren möchtest und nicht viele TLS-Details selbst pflegen willst, beginne mit [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- `--port` ist der Eingangsport des Proxys, nicht das `appPort` der App

Wenn die CLI die gemeinsame Konfiguration zusätzlich in die Hauptkonfiguration des Providers einbinden und sie nach der Prüfung neu laden soll, ergänze:

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

Die vollständige Befehlsreferenz findest du unter [`nb env proxy`](../../../api/cli/env/proxy/index.md).

## Was die CLI für dich synchron hält

Die CLI erzeugt nicht nur einen einzelnen Proxy-Snippet. Sie pflegt auch Provider-spezifische Hilfsdateien. Die Ausgabe unterscheidet sich je nach Provider:

- Nginx pflegt `app.conf`, `public/index-v1.html`, `public/index-v2.html`, die gemeinsame `nocobase.conf` und das gemeinsame Verzeichnis `snippets/`
- Caddy pflegt `generated.caddy`, `app.caddy` und die gemeinsame `nocobase.caddy`

:::warning Hinweis

Wenn du Site-spezifische Konfiguration ergänzen musst, bearbeite `app.conf` oder `app.caddy`. Von der CLI verwaltete Hilfsdateien solltest du nicht manuell ändern, weil sie beim nächsten Ausführen des Befehls überschrieben werden.

:::

## Welche Seite solltest du zuerst öffnen

| Ich möchte... | Hier entlang |
| --- | --- |
| Nginx weiter für Sites, Zertifikate, Caching oder Zugriffskontrolle verwenden | [Nginx](./nginx.md) |
| HTTPS schnell aktivieren und weniger Zertifikats- und TLS-Details pflegen | [Caddy](./caddy.md) |
| Den Befehlsbaum ansehen und erst danach einen Provider wählen | [`nb env proxy`](../../../api/cli/env/proxy/index.md) |
| Erst die Optionen, Ausgabedateien und Beispiele von Nginx sehen | [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) |
| Erst die Optionen, Ausgabedateien und Beispiele von Caddy sehen | [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) |
| Env-Einstellungen anpassen, die die Proxy-Ausgabe beeinflussen können, etwa `app-port` oder `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Die App zuerst als von der CLI verwaltetes env installieren | [Mit CLI installieren (empfohlen)](../../installation/cli.md) |

## Wann der von der CLI erzeugte Weg nicht gut passt

Diese Fälle sind normalerweise im Abschnitt für handgeschriebene Konfiguration der Provider-Seiten besser aufgehoben:

- Deine App wird nicht von der CLI verwaltet
- Das env hat nur eine entfernte API-Verbindung oder ist ein SSH-env
- Du möchtest die vollständige Nginx-Konfiguration oder das vollständige `Caddyfile` bewusst selbst pflegen

Solange die App bereits als CLI-env gespeichert ist und die aktuelle Maschine ihre Runtime erreichen kann, bleibt die Standardempfehlung aber, zuerst diese Befehle zu verwenden. Das macht spätere Domain-Änderungen, Site-spezifische Anpassungen und erneute Generierung deutlich leichter.

## Verwandte Links

- [`nb env proxy`](../../../api/cli/env/proxy/index.md)
- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [App-Umgebungsvariablen](../../installation/env.md)
- [Mit CLI installieren (empfohlen)](../../installation/cli.md)
