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

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

Je nach Setup-Pfad sehen Sie leicht unterschiedliche Schritte. Wenn Sie dem Standardpfad `Install a new app` folgen, sehen Sie in der Regel diese sechs Schritte:

1. `Getting started` - die `--env` Kennung festlegen und `Install a new app` auswählen
2. `App environment` - Basisdaten der App, Speicherort und Laufzeit-Port festlegen
3. `App source and version` - auswählen, wie Sie die App beziehen und welche Quelle und Version Sie verwenden möchten
4. `Configure the database` - die integrierte Datenbank oder eine benutzerdefinierte Datenbank wählen
5. `Create an admin account` - das erste Administratorkonto einrichten
6. `Connection & authentication` - die Zugriffs-URL der App eingeben und eine Authentifizierungsmethode wählen

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
nb env info
nb app logs
```

Bei einer lokalen Standardinstallation können Sie im Browser normalerweise direkt `http://localhost:13000` öffnen. Melden Sie sich an und starten Sie dann eine neue AI-Agent-Sitzung oder starten Sie die aktuelle Sitzung neu. Danach kann die AI mit dieser NocoBase-Anwendung arbeiten.

Die CLI-Konfiguration wird standardmäßig unter `~/.nocobase/` gespeichert. AI Agents können daher in der Regel aus jedem Arbeitsverzeichnis darauf zugreifen.

Wenn diese Anwendung später produktiv für echte Benutzer bereitgestellt werden soll, empfehlen wir langfristig nicht die direkte Nutzung über `IP + port`. Der nächste Schritt ist normalerweise ein Reverse Proxy mit HTTPS.

## Verwandte Links

- [Installationsmethoden und Versionsvergleich](../get-started/quickstart.md) — Vergleichen Sie zuerst Installationsmethoden und Versionskanäle, und entscheiden Sie dann, wie Sie installieren möchten
- [Anbindungsanleitung für AI Agents](./quick-start.mdx) — Verbinden Sie eine bestehende NocoBase-App und lassen Sie Ihren AI Agent loslegen
- [`nb init` Befehlsreferenz](../api/cli/init.md) — Eine neue App initialisieren, eine bestehende lokale App übernehmen oder eine Remote-App verbinden
- [`nb env info` Befehlsreferenz](../api/cli/env/info.md) — Verbindungsdetails und Laufzeitkonfiguration der aktuellen env anzeigen
- [NocoBase CLI](../api/cli/index.md) — Vollständige Referenz für alle `nb` Befehle
- [Mehrere Umgebungsverwaltung](../nocobase-cli/operations/multi-environment.md) — Häufige Abläufe, wenn Sie mehrere envs gleichzeitig pflegen
