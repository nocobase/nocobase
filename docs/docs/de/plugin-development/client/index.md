:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

Die Entwicklung von NocoBase Client-Plugins bietet vielfältige Funktionen und Möglichkeiten, um Entwicklern die Anpassung und Erweiterung der Frontend-Funktionen von NocoBase zu erleichtern. Im Folgenden finden Sie die wichtigsten Funktionen der NocoBase Client-Plugin-Entwicklung und die entsprechenden Kapitel:

| Funktionsmodul                 | Beschreibung                                                              | Zugehöriges Kapitel                                      |
|--------------------------------|---------------------------------------------------------------------------|----------------------------------------------------------|
| **Plugin-Klasse**              | Erstellen und Verwalten von Client-Plugins, um die Frontend-Funktionalität zu erweitern. | [plugin.md](plugin.md)                                   |
| **Router-Verwaltung**          | Anpassen des Frontend-Routings, Implementierung von Seitennavigation und Weiterleitungen. | [router.md](router.md)                                   |
| **Ressourcen-Operationen**     | Verwalten von Frontend-Ressourcen, Verarbeiten von Datenabruf und -operationen. | [resource.md](resource.md)                               |
| **Anfrageverarbeitung**        | Anpassen von HTTP-Anfragen, Verarbeiten von API-Aufrufen und Datenübertragung. | [request.md](request.md)                                 |
| **Kontextverwaltung**          | Abrufen und Verwenden des Anwendungs-Kontextes, Zugriff auf globalen Zustand und Dienste. | [context.md](context.md)                                 |
| **Zugriffskontrolle (ACL)**    | Implementierung der Frontend-Zugriffskontrolle, Steuerung der Zugriffsrechte für Seiten und Funktionen. | [acl.md](acl.md)                                         |
| **Datenquellen-Manager**       | Verwalten und Verwenden mehrerer Datenquellen, Implementierung des Wechsels und Zugriffs auf Datenquellen. | [data-source-manager.md](data-source-manager.md)         |
| **Stile & Themen**             | Anpassen von Stilen und Themen, Implementierung der UI-Anpassung und -Verschönerung. | [styles-themes.md](styles-themes.md)                     |
| **Mehrsprachigkeitsunterstützung (i18n)** | Integration von Mehrsprachigkeitsunterstützung, Implementierung von Internationalisierung und Lokalisierung. | [i18n.md](i18n.md)                                       |
| **Logger**                     | Anpassen von Protokollformaten und Ausgabemethoden, Verbesserung der Debugging- und Überwachungsfähigkeiten. | [logger.md](logger.md)                                   |
| **Testfälle schreiben**        | Schreiben und Ausführen von Testfällen, um die Stabilität und funktionale Genauigkeit des Plugins zu gewährleisten. | [test.md](test.md)                                       |

UI-Erweiterungen

| Funktionsmodul                 | Beschreibung                                                                                                                              | Zugehöriges Kapitel                                      |
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| **UI-Konfiguration**           | Verwenden von FlowEngine und Flow-Modellen zur dynamischen Konfiguration und Orchestrierung von Komponenten-Eigenschaften, um die visuelle Anpassung komplexer Seiten und Interaktionen zu unterstützen. | [FlowEngine](../../flow-engine/index.md) und [Flow-Modell](../../flow-engine/flow-model.md) |
| **Block-Erweiterungen**        | Anpassen von Seiten-Blöcken, Erstellen wiederverwendbarer UI-Module und Layouts.                                                         | [Blöcke](../../ui-development-block/index.md)           |
| **Feld-Erweiterungen**         | Anpassen von Feldtypen, Implementierung der Anzeige und Bearbeitung komplexer Daten.                                                      | [Felder](../../ui-development-field/index.md)           |
| **Aktions-Erweiterungen**      | Anpassen von Aktionstypen, Implementierung komplexer Logik und Interaktionsverarbeitung.                                                  | [Aktionen](../../ui-development-action/index.md)         |