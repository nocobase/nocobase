---
title: "nb env auth"
description: "Referenz für den Befehl nb env auth: eine gespeicherte NocoBase-env mit basic, token oder OAuth authentifizieren."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,Login,Authentifizierung"
---

# nb env auth

Authentifiziert eine gespeicherte NocoBase-env erneut oder aktualisiert die dafür gespeicherten Authentifizierungsdaten. Wenn der Umgebungsname weggelassen wird, wird die aktuelle env verwendet.

`nb env auth` unterstützt drei Authentifizierungsmethoden: `basic`, `token` und `oauth`. Wenn `--auth-type` weggelassen wird, leitet die CLI die Methode zuerst aus den übergebenen Authentifizierungsoptionen ab. Wenn das nicht möglich ist, verwendet sie die in der env gespeicherte Authentifizierungsmethode.

## Verwendung

```bash
nb env auth [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name der konfigurierten Umgebung, bei der die Anmeldung durchgeführt wird; wird bei Weglassen aus der aktuellen env übernommen |
| `--auth-type`, `-a` | string | Authentifizierungsmethode: `basic`, `token` oder `oauth` |
| `--access-token`, `-t` | string | API key oder access token für die `token`-Authentifizierung |
| `--username` | string | Benutzername für die `basic`-Authentifizierung; wird in einem TTY abgefragt, wenn er fehlt |
| `--password` | string | Passwort für die `basic`-Authentifizierung; wird in einem TTY abgefragt, wenn es fehlt |

## Kompatibilitätsoptionen

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Umgebungsname, entspricht `[name]`. Diese versteckte Option bleibt zur Kompatibilität mit anderen Befehlen erhalten; normalerweise reicht das Positionsargument aus |

## Beschreibung

Die Authentifizierungsmethoden funktionieren so:

- `basic`: meldet sich mit Benutzername und Passwort bei NocoBase an und speichert den zurückgegebenen access token sowie den Benutzernamen
- `token`: speichert den über `--access-token` übergebenen API key oder access token
- `oauth`: startet den Browser-Authentifizierungsablauf und speichert nach erfolgreicher Authentifizierung den access token

In einem interaktiven Terminal fragt die CLI `--auth-type`, `--username`, `--password` oder `--access-token` bei Bedarf ab. Im nicht interaktiven Modus benötigt die `basic`-Authentifizierung sowohl `--username` als auch `--password`.

Die `oauth`-Authentifizierung versucht zuerst Device Authorization Grant. Wenn der OAuth-Server diesen Ablauf unterstützt, gibt der Befehl eine Verifizierungs-URL und einen Benutzercode aus und wartet anschließend per Polling auf die Freigabe im Browser. Das funktioniert auch auf Remote- oder Headless-Servern, weil kein lokaler Callback-Listener nötig ist.

Wenn der OAuth-Server keinen device authorization endpoint bereitstellt, fällt der Befehl auf den PKCE-loopback-Ablauf zurück: Er startet einen lokalen Callback-Dienst, öffnet den Browser zur Autorisierung, tauscht das token aus und speichert es in der Konfigurationsdatei.

Nach erfolgreicher Authentifizierung führt die CLI automatisch `nb env update <name>` aus, damit der env-Status neu synchronisiert wird.

## Einschränkungen

- `[name]` und `--env` dürfen nicht gleichzeitig unterschiedliche Umgebungsnamen angeben
- `--access-token` darf nicht zusammen mit `--username` oder `--password` verwendet werden
- `--auth-type oauth` darf nicht zusammen mit `--access-token`, `--username` oder `--password` verwendet werden
- `--auth-type token` darf nicht zusammen mit `--username` oder `--password` verwendet werden
- `--auth-type basic` darf nicht zusammen mit `--access-token` verwendet werden
- `--access-token`, `--username` und `--password` dürfen nach der Übergabe nicht leer sein

## Beispiele

```bash
# Die aktuelle env mit der gespeicherten Authentifizierungsmethode authentifizieren
nb env auth

# Eine bestimmte env authentifizieren
nb env auth prod

# OAuth-Browser-Login verwenden
nb env auth prod --auth-type oauth

# Mit Benutzername und Passwort anmelden
nb env auth prod --auth-type basic --username admin --password secret

# API key oder access token speichern
nb env auth prod --auth-type token --access-token <api-key>
```

Bei device authorization öffnest du die vom Befehl ausgegebene URL und gibst den angezeigten Code im Browser ein.

## Verwandte Befehle

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
