# Überblick

Die NocoBase Serverseitige Plugin-Entwicklung bietet Ihnen vielfältige Funktionen und Möglichkeiten, um die Kernfunktionen von NocoBase anzupassen und zu erweitern. Hier finden Sie eine Übersicht der Hauptfunktionen und der entsprechenden Kapitel:

| Modul                                   | Beschreibung                                                                                             | Zugehöriges Kapitel                                      |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| **Plugin-Klasse**                       | Erstellen und Verwalten von serverseitigen Plugins zur Erweiterung der Kernfunktionen.                   | [plugin.md](./plugin.md)                                   |
| **Datenbankoperationen**                | Bietet Schnittstellen für Datenbankoperationen, einschließlich CRUD und Transaktionsverwaltung.          | [database.md](./database.md)                               |
| **Benutzerdefinierte Sammlungen**       | Anpassung der Sammlungsstrukturen an Geschäftsanforderungen für eine flexible Datenmodellverwaltung.     | [collections.md](./collections.md)                         |
| **Datenkompatibilität bei Plugin-Upgrades** | Stellt sicher, dass Plugin-Upgrades bestehende Daten nicht beeinträchtigen, durch Datenmigration und Kompatibilitätshandhabung. | [migration.md](./migration.md)                             |
| **Verwaltung externer Datenquellen**    | Integration und Verwaltung externer Datenquellen zur Ermöglichung der Dateninteraktion.                  | [data-source-manager.md](./data-source-manager.md)         |
| **Benutzerdefinierte APIs**             | Erweiterung der API-Ressourcenverwaltung durch das Schreiben benutzerdefinierter Schnittstellen.         | [resource-manager.md](./resource-manager.md)               |
| **API-Berechtigungsverwaltung**         | Anpassung von API-Berechtigungen für eine feingranulare Zugriffskontrolle.                              | [acl.md](./acl.md)                                         |
| **Abfangen und Filtern von Anfragen/Antworten** | Hinzufügen von Interceptoren oder Middleware für Anfragen und Antworten zur Handhabung von Aufgaben wie Protokollierung, Authentifizierung usw. | [context.md](./context.md) und [middleware.md](./middleware.md) |
| **Ereignisüberwachung**                 | Überwachung von Systemereignissen (z. B. aus der Anwendung oder Datenbank) und Auslösen entsprechender Handler. | [event.md](./event.md)                                     |
| **Cache-Verwaltung**                    | Verwaltung des Caches zur Verbesserung der Anwendungsleistung und Reaktionsgeschwindigkeit.               | [cache.md](./cache.md)                                     |
| **Geplante Aufgaben**                   | Erstellen und Verwalten von geplanten Aufgaben, wie z. B. regelmäßige Bereinigung, Datensynchronisation usw. | [cron-job-manager.md](./cron-job-manager.md)               |
| **Mehrsprachige Unterstützung**         | Integration der Mehrsprachigkeitsunterstützung zur Implementierung von Internationalisierung und Lokalisierung. | [i18n.md](./i18n.md)                                       |
| **Protokollausgabe**                    | Anpassung von Protokollformaten und Ausgabemethoden zur Verbesserung der Debugging- und Überwachungsfunktionen. | [logger.md](./logger.md)                                   |
| **Benutzerdefinierte Befehle**          | Erweiterung der NocoBase CLI durch das Hinzufügen benutzerdefinierter Befehle.                          | [command.md](./command.md)                                 |
| **Schreiben von Testfällen**            | Schreiben und Ausführen von Testfällen zur Sicherstellung der Plugin-Stabilität und Funktionsgenauigkeit. | [test.md](./test.md)                                       |