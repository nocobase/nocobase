---
pkg: '@nocobase/plugin-api-keys'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# API-Schlüssel

## Einführung

## Verwendung

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API-Schlüssel hinzufügen

![](https://static-docs.nocobase.com/46182fc0ad9a96fa5b14e97fcba12.png)

**Wichtige Hinweise**

- Der API-Schlüssel wird für den aktuellen Benutzer erstellt und erbt dessen Rolle.
- Stellen Sie sicher, dass die Umgebungsvariable `APP_KEY` konfiguriert und vertraulich behandelt wird. Wenn sich der `APP_KEY` ändert, werden alle bereits hinzugefügten API-Schlüssel ungültig.

### So konfigurieren Sie den APP_KEY

Für die Docker-Version bearbeiten Sie die Datei `docker-compose.yml`.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Bei einer Installation über den Quellcode oder mit `create-nocobase-app` können Sie den `APP_KEY` direkt in der `.env`-Datei anpassen.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```