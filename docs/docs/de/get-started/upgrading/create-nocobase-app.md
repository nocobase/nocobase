:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Aktualisieren einer create-nocobase-app Installation

:::warning Vorbereitungen vor dem Upgrade

- Sichern Sie unbedingt zuerst Ihre Datenbank.
- Stoppen Sie die laufende NocoBase-Instanz.

:::

## 1. Stoppen der laufenden NocoBase-Instanz

Wenn es sich nicht um einen Hintergrundprozess handelt, stoppen Sie diesen mit `Ctrl + C`. In einer Produktionsumgebung führen Sie den Befehl `pm2-stop` aus, um die Instanz zu stoppen.

```bash
yarn nocobase pm2-stop
```

## 2. Ausführen des Upgrade-Befehls

Führen Sie einfach den Upgrade-Befehl `yarn nocobase upgrade` aus.

```bash
# Wechseln Sie in das entsprechende Verzeichnis
cd my-nocobase-app
# Führen Sie den Aktualisierungsbefehl aus
yarn nocobase upgrade
# Starten
yarn dev
```

### Aktualisierung auf eine bestimmte Version

Bearbeiten Sie die Datei `package.json` im Stammverzeichnis Ihres Projekts und ändern Sie die Versionsnummern für `@nocobase/cli` und `@nocobase/devtools`. Beachten Sie, dass Sie nur ein Upgrade durchführen, aber kein Downgrade machen können. Zum Beispiel:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Führen Sie anschließend den Upgrade-Befehl aus:

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```