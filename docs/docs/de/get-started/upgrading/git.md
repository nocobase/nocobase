:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Aktualisierung einer NocoBase-Installation aus dem Git-Quellcode

:::warning Vorbereitungen vor der Aktualisierung

- Sichern Sie unbedingt zuerst Ihre Datenbank.
- Stoppen Sie die laufende NocoBase-Instanz (`Ctrl + C`).

:::

## 1. Wechseln Sie in das NocoBase-Projektverzeichnis

```bash
cd my-nocobase-app
```

## 2. Rufen Sie den neuesten Code ab

```bash
git pull
```

## 3. Löschen Sie Cache und alte Abhängigkeiten (optional)

Sollte der normale Aktualisierungsprozess fehlschlagen, können Sie versuchen, den Cache und die Abhängigkeiten zu leeren und sie anschließend neu herunterzuladen.

```bash
# NocoBase-Cache leeren
yarn nocobase clean
# Abhängigkeiten löschen
yarn rimraf -rf node_modules # entspricht rm -rf node_modules
```

## 4. Aktualisieren Sie die Abhängigkeiten

📢 Aufgrund von Faktoren wie Netzwerkumgebung und Systemkonfiguration kann dieser nächste Schritt über zehn Minuten dauern.

```bash
yarn install
```

## 5. Führen Sie den Upgrade-Befehl aus

```bash
yarn nocobase upgrade
```

## 6. Starten Sie NocoBase

```bash
yarn dev
```

:::tip Hinweis für die Produktionsumgebung

Es wird nicht empfohlen, eine NocoBase-Installation aus dem Quellcode direkt in einer Produktionsumgebung bereitzustellen (für Produktionsumgebungen beachten Sie bitte [Bereitstellung in der Produktion](../deployment/production.md)).

:::

## 7. Aktualisierung von Drittanbieter-Plugins

Beachten Sie [Plugins installieren und aktualisieren](../install-upgrade-plugins.mdx).