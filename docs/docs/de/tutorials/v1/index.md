# Überblick: Aufgabenverwaltungssystem

## Einführung

Willkommen in der Welt von **NocoBase**! In der heutigen, sich schnell verändernden Geschäftswelt stehen Unternehmen und Entwicklungsteams oft vor folgenden Herausforderungen:

- **Häufig wechselnde Anforderungen**, auf die klassische Entwicklung nur schwer schnell reagieren kann.
- **Knappe Lieferfristen**, kombiniert mit umständlichen und ineffizienten Abläufen.
- **Begrenzte Möglichkeiten von No-Code-Plattformen**, die komplexen Anforderungen nicht gerecht werden.
- **Datenschutz und Systemstabilität** lassen sich nur schwer gewährleisten.
- **Schwierige Integration mit bestehenden Systemen**, was die Gesamteffizienz beeinträchtigt.
- **Abrechnung pro Benutzer oder App**, wodurch Kosten kaum kontrollierbar sind.

**NocoBase** wurde entwickelt, um genau diese Probleme zu lösen. Als **extrem erweiterbare No-Code-Entwicklungsplattform** bietet NocoBase folgende einzigartige Vorteile:

- **Kostenlos, Open Source, flexibel und schnell**: Der Quellcode ist offen und die Community sehr aktiv. Installation in wenigen Minuten, sofortige Entwicklung und Bereitstellung.
- **Hochgradig erweiterbar**: Mikrokernel-Architektur, modulares Design, alle Funktionen werden als Plugin bereitgestellt.
- **Einzigartige Kernkonzepte**: Systeme werden durch die Kombination aus Datenquellen, Blocks und Actions zusammengestellt – das fühlt sich flüssig und natürlich an.
- **WYSIWYG**: Intuitiver UI-Editor, mit dem sich Oberflächen mühelos gestalten lassen.
- **Datengetrieben**: Unterstützt verschiedene Datenquellen, Datenstruktur und UI sind voneinander getrennt.

## Designziele von NocoBase

NocoBase findet eine besonders ausgewogene Balance zwischen **Benutzerfreundlichkeit**, **Funktionsstärke** und **geringer Komplexität**. Es bietet eine reichhaltige Palette an Funktionsmodulen für vielfältige komplexe Anforderungen und behält dabei eine schlanke, intuitive Benutzeroberfläche bei, in die Sie sich mühelos einarbeiten. Der **Plugin-Mechanismus** erlaubt es Ihnen außerdem, auf Basis der Plattform Grenzen zu sprengen, hochgradig individuelle Erweiterungen zu realisieren und so die Flexibilität und nachhaltige Weiterentwicklung des Systems zu sichern.

---

Mit dieser Einführung haben Sie sicherlich einen ersten Eindruck von **NocoBase** bekommen. Diese Tutorial-Reihe stellt die praktische Projektarbeit in den Mittelpunkt und führt Sie Schritt für Schritt durch die Kernkonzepte und den Aufbau-Workflow von NocoBase. Am Ende werden Sie ein schlankes und effizientes Aufgabenverwaltungssystem erstellt haben.

## Warum ein Aufgabenverwaltungssystem?

Ein Aufgabenverwaltungssystem ist ein hervorragendes Einstiegsprojekt für Anfänger:

- Einerseits hängt es eng mit unseren täglichen Bedürfnissen zusammen.
- Andererseits ist seine Struktur einfach, aber sehr gut erweiterbar – aus einer einfachen Aufgabenverwaltung kann schrittweise ein vollständiges Projektmanagementsystem werden.

Dieses Tutorial beginnt mit grundlegenden Funktionen und deckt die Kernmodule und Bedienschritte von NocoBase ab, darunter Aufgabenerstellung, Kommentar-Interaktion, Berechtigungsverwaltung, Benachrichtigungseinstellungen und mehr. So erhalten Sie einen umfassenden Einblick in die Grundfunktionen von NocoBase.

### Kernkonzepte und Aufgabenverwaltung kombiniert

In den einzelnen Kapiteln vertiefen wir anhand der Praxis einige Kernkonzepte von NocoBase, unter anderem:

- **Datentabellen (Collections)**: Die grundlegende Datenstruktur des Systems. Tabellen für Aufgaben, Benutzer, Kommentare usw. liefern die Informationsbasis.
- **Blocks**: Stellen Daten auf einer Seite dar und unterstützen verschiedene Darstellungsstile. Mit Blocks können Sie Daten beim Anlegen, Bearbeiten, Anzeigen und Verwalten von Aufgaben dynamisch präsentieren. Über Plugins lassen sich zusätzliche Funktionen ergänzen (z. B. der Kommentar-Block).
- **Actions**: Anlegen, Lesen, Aktualisieren und Löschen von Daten sowie Verwaltungssteuerung. Benutzer können Aufgaben- und Kommentardaten anlegen, filtern, aktualisieren, löschen usw. – passend zu unterschiedlichsten Anwendungsfällen.
- **Plugin-Erweiterungen**: Sämtliche Funktionen von NocoBase werden über Plugins integriert, was eine hohe Erweiterbarkeit ermöglicht. In diesem Tutorial binden wir Markdown- und Kommentar-Plugins ein, um Aufgabenbeschreibungen und Teamzusammenarbeit praktisch zu ergänzen.
- **Workflow**: Eine Glanzleistung von NocoBase. In diesem Tutorial setzen Sie einen einfachen automatisierten Workflow um – etwa eine Erinnerung für Aufgabenverantwortliche – und bekommen einen ersten Eindruck von der Stärke der Workflow-Engine.
- ......

Bereit? Dann starten wir mit [der Oberfläche und der Installation](https://www.nocobase.com/cn/tutorials/task-tutorial-beginners-guide) und bauen Schritt für Schritt Ihr eigenes Aufgabenverwaltungssystem!
