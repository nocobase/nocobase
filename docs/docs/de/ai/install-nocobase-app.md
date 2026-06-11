---
title: NocoBase-App installieren
description: Installieren Sie die NocoBase CLI und erstellen Sie mit `nb init --ui` schnell eine neue NocoBase-Anwendung, damit Ihr AI Agent direkt loslegen kann.
---

# NocoBase-App installieren

Wenn Sie noch keine NocoBase-Anwendung haben, ist der schnellste Weg: zuerst `@nocobase/cli` installieren und dann einmal `nb init --ui` ausführen. In den meisten Fällen reichen die Standardoptionen im Assistenten aus.

## Voraussetzungen

- Node.js >= 22
- Yarn 1.x
- Wenn Sie mit Docker installieren möchten, stellen Sie sicher, dass Docker bereits läuft

## Schritt 1: CLI installieren

Installieren Sie die NocoBase CLI zunächst global:

```bash
npm install -g @nocobase/cli
nb --version
```

Wenn Sie häufig mehrere Terminals gleichzeitig verwenden oder parallel mit AI Agents arbeiten möchten, empfehlen wir zusätzlich einmal `nb session setup`. So pflegt jede Sitzung ihr eigenes `current env`, und sie beeinflussen sich weniger leicht gegenseitig.

## Schritt 2: Anwendung initialisieren

Als Standard empfehlen wir, den visuellen Assistenten direkt zu öffnen:

```bash
nb init --ui
```

Führen Sie im Assistenten diese Schritte der Reihe nach aus:

1. Den Anwendungsnamen festlegen - er wird gleichzeitig der env-Name in der CLI
2. „Neuinstallation" auswählen
3. Die Installationsmethode wählen - Docker, npm oder Git
4. Port, Datenbank und Administratorkonto festlegen
5. Warten, bis Download, Installation und Start abgeschlossen sind

Wenn Sie lieber rein im Terminal arbeiten, können Sie auch direkt Folgendes ausführen:

```bash
nb init
```

Wenn Sie in Skripten oder in CI initialisieren, nutzen Sie den nicht-interaktiven Modus:

```bash
nb init --yes --env app1
```

:::tip Installation auf einem Remote-Server

Wenn Sie `nb init --ui` auf einem Server ausführen, empfehlen wir, den Standard-Host zuerst auf die aktuelle Server-IP zu setzen. So können Sie den Assistenten im lokalen Browser öffnen.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Schritt 3: Prüfen, ob die Anwendung bereit ist

Nach der Installation sollten Sie in der Regel zuerst diese drei Punkte prüfen:

- Ob die env erfolgreich gespeichert wurde
- Ob die Anwendung normal gestartet ist
- Ob Sie sich mit dem Administratorkonto anmelden können

Häufig verwendete Befehle:

```bash
nb env list
nb env status
nb app logs
```

Bei einer lokalen Standardinstallation können Sie im Browser normalerweise direkt `http://localhost:13000` öffnen. Melden Sie sich an und starten Sie dann eine neue AI-Agent-Sitzung oder starten Sie die aktuelle Sitzung neu. Danach kann die AI mit dieser NocoBase-Anwendung arbeiten.

Die CLI-Konfiguration wird standardmäßig unter `~/.nocobase/` gespeichert. AI Agents können daher in der Regel aus jedem Arbeitsverzeichnis darauf zugreifen.

Wenn diese Anwendung später produktiv für echte Benutzer bereitgestellt werden soll, empfehlen wir langfristig nicht die direkte Nutzung über `IP + port`. Der nächste Schritt ist normalerweise ein Reverse Proxy mit HTTPS.

## Nächste Schritte

- Wenn Sie bereits eine laufende NocoBase-Instanz haben, lesen Sie direkt die [Anbindungsanleitung für AI Agents](./quick-start.mdx)
- Wenn Sie mit einem Produktions-Deployment weitermachen möchten, lesen Sie [Per CLI installieren](../nocobase-cli/installation/cli.md) und [Überblick zur Produktivbereitstellung](../nocobase-cli/production/index.md)
- Wenn Sie als Nächstes mit AI mit dem Aufbau der Anwendung beginnen möchten, lesen Sie [AI Builder](../ai-builder/index.md)
