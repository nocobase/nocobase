---
title: Anleitung zum Upgrade von NocoBase 2.0 auf 2.1
description: Aktualisiere eine NocoBase 2.0 App auf 2.1, einschließlich alter Installationsmethoden, nb CLI und empfohlenem Migrationspfad.
---

# So aktualisierst du NocoBase von 2.0 auf 2.1

Das Upgrade von NocoBase 2.0 auf NocoBase 2.1 ist für die App selbst weitgehend reibungslos. Die größere Änderung betrifft die NocoBase CLI.

Dabei gilt:

- In 2.0 und früher beginnen CLI-Befehle normalerweise mit `yarn nocobase`
- In 2.1 und neuer wird das global installierte `nb` verwendet

Alte Apps müssen nicht sofort auf `nb` migriert werden. Wenn du nur eine stabil laufende NocoBase 2.0 App auf 2.1 aktualisieren möchtest, verwende standardmäßig weiter die ursprüngliche Installations- und Upgrade-Methode. Für neu installierte Apps empfehlen wir die neue `nb` CLI.

## Die ursprüngliche Installations- und Upgrade-Methode weiterverwenden

Wenn du mit der bisherigen Installationsmethode vertraut bist, kannst du sie weiter nutzen. Installation und Upgrade folgen weiterhin den ursprünglichen Dokumentationen.

### NocoBase installieren

- [Docker-Installation](/get-started/installation/docker)
- [create-nocobase-app-Installation](/get-started/installation/create-nocobase-app)
- [Git-Quellinstallation](/get-started/installation/git)

### NocoBase aktualisieren

- [Upgrade einer Docker-Installation](/get-started/upgrading/docker)
- [Upgrade einer create-nocobase-app-Installation](/get-started/upgrading/create-nocobase-app)
- [Upgrade einer Git-Quellinstallation](/get-started/upgrading/git)

## `nb` CLI für neue Apps verwenden

Für neue Apps empfehlen wir die bequemere Installation und Aktualisierung mit `nb`.

### NocoBase installieren

- [NocoBase-App installieren](./install-nocobase-app.md)

### NocoBase aktualisieren

- [NocoBase-App aktualisieren](./upgrade-nocobase-app.md)

## Zur `nb` CLI migrieren

Wenn du Apps künftig einheitlich mit `nb` verwalten möchtest, ist der derzeit verlässlichere Weg, eine neue App zu erstellen und die Daten der alten App dorthin zu migrieren.

Migrationsschritte:

1. Erstelle mit `nb init` zuerst eine neue CLI-App
2. Migriere die Datenbank, `storage` und die erforderlichen Umgebungsvariablen der alten App
3. Prüfe, ob die neue App korrekt funktioniert, und schalte danach die Produktionsumgebung um

Du kannst auch noch etwas warten. Die Fähigkeit von `nb`, bestehende lokale Apps zu übernehmen, befindet sich noch in Entwicklung.

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
