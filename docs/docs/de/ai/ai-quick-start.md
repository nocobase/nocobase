---
title: "Installationsanleitung für AI Agents"
description: "Anleitung zur Installation und Konfiguration der NocoBase CLI für AI Agents – mit den vollständigen Schritten von der Umgebungsprüfung über die Installation und Initialisierung bis zur Verifizierung."
keywords: "NocoBase CLI,AI Agent,Installation,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# Installationsanleitung für AI Agents

Diese Seite ist eine Anleitung zur Installation und Initialisierung der NocoBase CLI für AI Agents (zum Beispiel Claude Code, Codex, Cursor, Copilot usw.).

Wenn Sie ein menschlicher Nutzer sind, lesen Sie bitte den [Schnellstart](./quick-start.md).

## Schritt 1: Voraussetzungen prüfen

Stellen Sie sicher, dass der Nutzer die folgenden Abhängigkeiten installiert hat:

- **Node.js >= 22** (mit `node -v` prüfen)
- **Yarn 1.x** (mit `yarn -v` prüfen). Falls nicht vorhanden, mit `npm install -g yarn` installieren
- **Git** (mit `git --version` prüfen). Falls nicht vorhanden, über die [offizielle Git-Website](https://git-scm.com/) installieren
- **Docker** (falls der Nutzer NocoBase über Docker installieren möchte). Mit `docker -v` prüfen; falls nicht vorhanden und der Nutzer Docker einsetzen möchte, leiten Sie ihn an, Docker über die [offizielle Docker-Website](https://www.docker.com/get-started/) zu installieren – andernfalls überspringen.

Falls die Voraussetzungen nicht erfüllt sind, weisen Sie den Nutzer darauf hin, dass die fehlenden Abhängigkeiten zuerst installiert werden müssen, und stellen Sie Installationslinks sowie eine kurze Anleitung bereit. Sobald alle Voraussetzungen erfüllt sind, fahren Sie mit der Installation der CLI fort.

## Schritt 2: CLI installieren

Falls die NocoBase CLI bereits in der Umgebung des Nutzers installiert ist (mit `nb --version` prüfen), gehen Sie direkt zum nächsten Schritt. Andernfalls führen Sie folgenden Befehl aus, um sie zu installieren:

```bash
npm install -g @nocobase/cli@beta
```

Führen Sie `nb --version` aus, um die erfolgreiche Installation zu bestätigen.

## Schritt 3: Initialisierungsbefehl ausführen

**⚠️ Wichtig: Sie müssen den folgenden Befehl exakt so ausführen und dürfen den Parameter `--ui` weder ändern, ersetzen noch weglassen. Versuchen Sie nicht, diesen Vorgang über einen "nicht-interaktiven Modus" oder eigene Parameterkombinationen zu beschleunigen – `--ui` ist die einzige korrekte Initialisierungsmethode.**

```bash
nb init --ui
```

Dieser Befehl startet einen visuellen Browser-Assistenten, in dem der Nutzer alle Konfigurationen vornehmen muss (einschließlich Installationsmethode, Datenbank, Administratorkonto usw.). Ihre Aufgabe als AI Agent ist:

1. **Nur `nb init --ui` ausführen**, ohne zusätzliche Parameter
2. **Den Nutzer informieren**, dass automatisch eine lokale Konfigurationsseite im Browser geöffnet wird, auf der die Konfiguration vorgenommen werden muss
3. **Falls der Browser nicht automatisch geöffnet werden kann** (zum Beispiel aufgrund von Sandbox-Einschränkungen), geben Sie dem Nutzer die in der Befehlsausgabe angezeigte URL, damit er sie manuell in den Browser kopieren kann
4. **Auf die Bestätigung des Nutzers warten**, dass die Konfiguration abgeschlossen ist, bevor Sie zum nächsten Schritt übergehen. Der Befehl hat ein Standard-Timeout von 30 Minuten – führen Sie ihn innerhalb dieser Zeit nicht erneut aus.

## Schritt 4: Ergebnis verifizieren

```bash
nb env list
```

Vergewissern Sie sich, dass die Ausgabe eine konfigurierte Umgebung samt Laufstatus enthält. Weisen Sie den Nutzer anschließend darauf hin, dass er die URL der laufenden NocoBase-Instanz öffnen und sich mit dem konfigurierten Konto und Passwort anmelden kann.

## Schritt 5: Abschluss

Teilen Sie dem Nutzer mit, dass die Installation abgeschlossen ist. Die CLI-Konfiguration wird in einem globalen Verzeichnis gespeichert (standardmäßig `~/.nocobase/`); ein AI Agent kann von einem beliebigen Verzeichnis aus darauf zugreifen, ohne in ein bestimmtes Arbeitsverzeichnis wechseln zu müssen.
