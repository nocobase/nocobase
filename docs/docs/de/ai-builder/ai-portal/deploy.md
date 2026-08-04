---
title: "Deployment und Quellcodeverwaltung"
description: "Der vollständige Ablauf aus Entwicklung, Push und Deployment eines AI Portals sowie die beiden source-storage-Modi und das Deployment über mehrere Umgebungen."
keywords: "AI Portal,Deployment,source storage,Git,nb portal deploy,nb portal push,mehrere Umgebungen"
---

# Deployment und Quellcodeverwaltung

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie gemäß dem [Schnellstart Aufbau mit AI Portal](./index.md) Ihr erstes Portal zum Laufen gebracht haben.

:::

Der Quellcode eines Portals liegt an drei Orten: im lokalen Entwicklungs-Workspace, im source storage und in den deployten Artefakten. `nb portal` hält diese drei synchron.

## Der vollständige Lebenszyklus

Der Kreislauf der täglichen Entwicklung sieht so aus:

```text
dev (lokale Entwicklung) → push (Quellcode pushen) → deploy (builden und deployen)
```

Dabei gilt:

1. `nb portal dev <portal>` – den lokalen Entwicklungsserver starten, Code ändern und das Ergebnis sehen
2. `nb portal push <portal>` – lokale Quellcodeänderungen in den source storage pushen
3. `nb portal deploy <portal>` – builden und deployen, damit Änderungen für Nutzer wirksam werden

Wenn Sie ein Portal übernehmen, das ein Kollege bereits angelegt hat, oder den Rechner gewechselt haben, ziehen Sie es zuerst lokal:

```bash
nb portal list                 # Ansehen, welche Portale es gibt
nb portal pull customer        # Quellcode lokal ziehen
nb portal dev customer         # Mit der Entwicklung beginnen
```

`pull` lädt den Quellcode herunter und entpackt ihn in den Entwicklungs-Workspace, standardmäßig nach `./<portal>`, mit `--path` auch woanders hin. Die Abhängigkeiten werden automatisch installiert; in CI oder wenn Sie das lieber selbst erledigen, überspringen Sie das mit `--no-install`.

Nach einem erfolgreichen Ziehen wird der Ort des Entwicklungs-Workspace in der CLI-env-Konfiguration vermerkt, sodass `dev`, `push` und `deploy` den Quellcode von dort lesen und Sie ihn nicht jedes Mal erneut angeben müssen.

## Ein weiteres Portal anlegen

Eine Anwendung kann mehrere Portale haben, deren Seiten und Berechtigungen voneinander unabhängig sind, während die Daten gemeinsam genutzt werden. Etwa ein Einstieg für interne Mitarbeiter und einer für externe Kunden:

```bash
nb portal create customer
```

Beim Erstellen entsteht auf Basis der Vorlage `@nocobase/portal-template-default` im aktuellen Verzeichnis `./customer` als Entwicklungs-Workspace, es werden `.env` und `.env.local` geschrieben und anschließend die Abhängigkeiten installiert. Mit `--path` legen Sie ihn an einem anderen Ort ab.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

Ein Portal-Name darf nur Kleinbuchstaben, Ziffern, Unterstriche und Bindestriche enthalten und muss mit einem Kleinbuchstaben oder einer Ziffer beginnen.

## source storage

Der Quellcode eines Portals kann an zwei Orten liegen:

| Modus | Beschreibung | Wann geeignet |
| --- | --- | --- |
| `nocobase` | Der Standard, der Quellcode wird vom source storage auf NocoBase-Seite verwaltet | schneller Einstieg, Entwicklung durch eine Person, kein Code-Review nötig |
| `git` | Der Quellcode wird in einem von Ihnen angegebenen Git-Repository gespeichert | Zusammenarbeit im Team, Code-Review, Anbindung an CI |

Der standardmäßige `nocobase`-Modus ist der schnellste Einstieg, weil Sie kein Repository vorbereiten müssen. Er hat allerdings keine Versionshistorie – eine fehlerhafte Änderung lässt sich nur durch vollständiges Überschreiben zurücknehmen. **Wenn dieses Portal langfristig weiterentwickelt wird, sollten Sie früh auf Git umstellen.**

### Auf Git umstellen

`create` erzeugt nur den Entwicklungs-Workspace; die source-storage-Konfiguration läuft einheitlich über `config`. Nach dem Erstellen können Sie jederzeit umstellen:

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` überträgt die source-storage-Konfiguration in den Portal-Datensatz auf der Gegenstelle, und danach läuft `push` über Git.

Wenn ein Repository genau ein Portal enthält, genügt für `--git-path` das standardmäßige Repository-Wurzelverzeichnis. Ein Unterverzeichnis brauchen Sie nur, wenn Sie mehrere Portale in dasselbe Repository legen möchten:

```bash
nb portal config customer --git-path portals/customer
```

### Vorübergehend aus einem anderen Repository ziehen

Wenn Sie den Quellcode eines anderen Repositories ausprobieren möchten, ohne die Konfiguration des Portals anzufassen, unterstützt `pull` eine einmalige Angabe:

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

Dabei wird der Portal-Datensatz auf der Gegenstelle nicht verändert, und `--git-branch` und `--git-path` lassen sich nur zusammen mit `--git-repo` verwenden. Für eine dauerhafte Umstellung auf Git-Speicherung nutzen Sie weiterhin `config` wie oben.

`config` kann auch den Ort des Entwicklungs-Workspace ändern – wenn Sie den Quellcode in ein anderes Verzeichnis verschoben haben, teilen Sie der CLI den neuen Ort mit `--path` mit:

```bash
nb portal config customer --path ./workspaces/customer
```

## Unterschiede zwischen den env-Typen

`nb portal` synchronisiert je nach env-Typ unterschiedlich:

| env-Typ | Beschreibung |
| --- | --- |
| `local` | Die Anwendung liegt auf dem aktuellen Rechner. `pull` zieht den Quellcode in den Entwicklungs-Workspace, `deploy` buildet aus dem Entwicklungs-Workspace und synchronisiert die Deployment-Artefakte |
| `docker` | Die Anwendung läuft in Docker und wird über ein Volume geteilt, das Verhalten entspricht dem obigen |
| `http` | Die Synchronisierung läuft über die API, `pull` / `push` laden ein Quellcode-Archiv herunter oder hoch |

`ssh`-envs unterstützen die Portal-Verwaltung derzeit noch nicht.

## Deployment über mehrere Umgebungen

Dasselbe Portal lässt sich in verschiedene Umgebungen deployen; das Ziel geben Sie mit `--env` an:

```bash
nb portal deploy customer --env prod --yes
```

`--yes` überspringt die interaktive Bestätigung. Weicht das explizit übergebene `--env` von der aktuellen env ab, hält die CLI standardmäßig an und fragt nach. Denken Sie in Skripten oder in CI daran, `--yes` mitzugeben, sonst bleibt der Befehl an der Bestätigung hängen.

Für die umgebungsübergreifende Veröffentlichung von Datentabellenstrukturen und Konfigurationen siehe [Release-Verwaltung](../publish.md).

## Zugriffspfad

Nach abgeschlossenem Deployment lautet der Zugriffspfad eines Portals:

```text
<appPublicPath>/x/<portal>/
```

Bei einem Portal unterhalb einer Sub-App:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

Das Präfix `/x/` gehört zu AI Portalen; No-Code-Portale verwenden `/v/`.

## Portal löschen

```bash
nb portal destroy customer
```

Dieser Vorgang löscht den Portal-Datensatz und die deployten Dateien; der lokale Entwicklungs-Workspace bleibt standardmäßig erhalten. Wenn Sie auch den Entwicklungs-Workspace loswerden möchten, ergänzen Sie `--delete-dev-path`.

## Verwandte Links

- [Schnellstart Aufbau mit AI Portal](./index.md) – bringen Sie Ihren ersten von der KI geschriebenen Frontend-Einstieg zum Laufen
- [Aufbau mit einem AI Agent](./agent-workflow.md) – Seiten in natürlicher Sprache von der KI schreiben lassen
- [Projektstruktur und Technologie-Stack](./project-structure.md) – Build-Befehle und Umgebungsvariablen
- [Release-Verwaltung](../publish.md) – Datentabellenstrukturen und Konfigurationen umgebungsübergreifend veröffentlichen
- [`nb portal` Befehlsreferenz](../../api/cli/portal/index.md) – vollständige Parameterbeschreibung aller Portal-Befehle
- [`nb portal create`](../../api/cli/portal/create.md) – alle Parameter zum Erstellen eines Portals
- [`nb portal config`](../../api/cli/portal/config.md) – source storage und Pfad des Entwicklungs-Workspace anpassen
- [`nb portal push`](../../api/cli/portal/push.md) – Quellcode in den source storage pushen
- [`nb portal deploy`](../../api/cli/portal/deploy.md) – ein Portal builden und deployen
- [`nb portal pull`](../../api/cli/portal/pull.md) – Quellcode aus dem source storage ziehen
- [`nb portal destroy`](../../api/cli/portal/destroy.md) – den Portal-Datensatz und die deployten Dateien löschen
