---
title: "nb plugin import"
description: "Referenz für den Befehl nb plugin import: Importiert ein verpacktes Plugin-Archiv oder npm-Paket in storage/plugins der ausgewählten NocoBase env oder in einen benutzerdefinierten Storage-Pfad."
keywords: "nb plugin import,NocoBase CLI,Plugin importieren,storage-path,npm-registry"
---

# nb plugin import

Importiert ein verpacktes Plugin-Archiv oder npm-Paket nach `storage/plugins`. Dieser Befehl legt das Plugin nur im Zielverzeichnis ab. Aktiviert wird es dabei nicht automatisch.

## Verwendung

```bash
nb plugin import <archive> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<archive>` | string | Plugin-Quelle. Pflichtfeld. Unterstützt einen lokalen `.tgz`-Pfad, eine entfernte `http(s)`-Archiv-URL oder einen npm-Paketnamen / Tag |
| `--env`, `-e` | string | Name der CLI env. Wenn nicht angegeben, wird normalerweise die aktuelle env verwendet. Wenn du `--storage-path` explizit angibst, kannst du `--env` weglassen |
| `--yes`, `-y` | boolean | Überspringt die interaktive Bestätigung, wenn ein explizit gesetztes `--env` auf eine andere env als die aktuelle zeigt |
| `--storage-path` | string | Überschreibt den Zielpfad des Storage-Wurzelverzeichnisses. Das tatsächliche Importverzeichnis ist `<storage-path>/plugins` |
| `--npm-registry` | string | Gibt an, welches npm-Registry verwendet werden soll, wenn die Quelle ein npm-Paketname oder Tag ist |

## Beispiele

```bash
# Entferntes Archiv
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Lokales Archiv
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm-Paket oder Tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Privates npm-Registry
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Direkt in einen lokalen Storage-Pfad schreiben, ohne auf die aktuelle env zu setzen
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Hinweise

Wenn du die Ziel-env schon ausgewählt hast, reicht es normalerweise aus, direkt in `storage/plugins` dieser env zu importieren.

Wenn du das Plugin nur in ein lokales Storage-Verzeichnis schreiben willst, gib `--storage-path` explizit an. Dann kannst du `--env` weglassen und die CLI schreibt direkt nach `<storage-path>/plugins`.

Nach dem Import ist der übliche nächste Schritt ein Neustart der App. Danach entscheidest du, ob das Plugin zusätzlich aktiviert werden muss. In den meisten Fällen gilt:

- Bei einer Erstinstallation zuerst [`nb app restart`](../app/restart.md) ausführen und danach [`nb plugin enable`](./enable.md)
- Wenn du nur eine neuere Version erneut importiert hast, zuerst neu starten und dann prüfen, ob die neue Version bereits geladen wurde

Wenn die Quelle in einem privaten npm-Registry liegt, loggst du dich normalerweise zuerst ein und startest dann den Import:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Hinweis

Du musst nichts manuell nach `storage/plugins` entpacken. `nb plugin import` legt das Plugin automatisch im richtigen Verzeichnis ab.

:::

## Verwandte Befehle

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Drittanbieter-Plugins installieren und aktualisieren`](../../../quickstart/plugins/third-party.md)
