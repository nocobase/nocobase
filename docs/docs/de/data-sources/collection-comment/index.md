---
pkg: "@nocobase/plugin-comments"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Kommentarsammlung

## Einführung

Eine Kommentarsammlung ist eine spezialisierte Datensammlungsvorlage, die zum Speichern von Benutzerkommentaren und Feedback entwickelt wurde. Mit der Kommentarfunktion können Sie jeder Datensammlung Kommentarfunktionen hinzufügen, sodass Benutzer bestimmte Datensätze diskutieren, Feedback geben oder Anmerkungen hinzufügen können. Die Kommentarsammlung unterstützt Rich-Text-Bearbeitung und bietet flexible Möglichkeiten zur Inhaltserstellung.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Funktionen

- **Rich-Text-Bearbeitung**: Enthält standardmäßig den Markdown-Editor (vditor) und unterstützt die Erstellung von Rich-Text-Inhalten.
- **Verknüpfung mit beliebigen Datensammlungen**: Kommentare können über Beziehungsfelder mit Datensätzen in jeder Datensammlung verknüpft werden.
- **Mehrstufige Kommentare**: Unterstützt das Antworten auf Kommentare und den Aufbau einer Kommentarbaumstruktur.
- **Benutzerverfolgung**: Erfasst automatisch den Ersteller und die Erstellungszeit des Kommentars.

## Benutzerhandbuch

### Eine Kommentarsammlung erstellen

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Gehen Sie zur Seite für die Verwaltung der Datensammlungen.
2. Klicken Sie auf die Schaltfläche „Neue Sammlung erstellen“.
3. Wählen Sie die Vorlage „Kommentarsammlung“.
4. Geben Sie den Namen der Sammlung ein (z. B. „Aufgabenkommentare“, „Artikelkommentare“ usw.).
5. Das System erstellt automatisch eine Kommentarsammlung mit den folgenden Standardfeldern:
   - Kommentarinhalt (Typ Markdown vditor)
   - Erstellt von (verknüpft mit der Benutzersammlung)
   - Erstellt am (Typ Datum und Uhrzeit)

### Beziehungen konfigurieren

Damit Kommentare mit einer Ziel-Datensammlung verknüpft werden können, müssen Sie Beziehungsfelder konfigurieren:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Fügen Sie in der Kommentarsammlung ein „Viele-zu-Eins“-Beziehungsfeld hinzu.
2. Wählen Sie die Ziel-Datensammlung aus, mit der verknüpft werden soll (z. B. Aufgabensammlung, Artikelsammlung usw.).
3. Legen Sie den Feldnamen fest (z. B. „Gehört zu Aufgabe“, „Gehört zu Artikel“ usw.).

### Kommentarblöcke auf Seiten verwenden

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Gehen Sie zu der Seite, auf der Sie die Kommentarfunktion hinzufügen möchten.
2. Fügen Sie einen Block in den Details oder im Popup des Ziel-Datensatzes hinzu.
3. Wählen Sie den Blocktyp „Kommentare“.
4. Wählen Sie die soeben erstellte Kommentarsammlung aus.

### Typische Anwendungsfälle

- **Aufgabenverwaltungssysteme**: Teammitglieder diskutieren Aufgaben und geben Feedback.
- **Content-Management-Systeme**: Leser kommentieren Artikel und interagieren mit ihnen.
- **Genehmigungs-Workflows**: Genehmiger kommentieren Antragsformulare und geben ihre Meinung ab.
- **Kundenfeedback**: Sammeln Sie Kundenbewertungen zu Produkten oder Dienstleistungen.

## Hinweise

- Die Kommentarsammlung ist eine Funktion des kommerziellen **Plugins** und erfordert die Aktivierung des Kommentar-**Plugins**, um genutzt werden zu können.
- Es wird empfohlen, geeignete Berechtigungen für die Kommentarsammlung festzulegen, um zu steuern, wer Kommentare anzeigen, erstellen und löschen kann.
- Bei Szenarien mit einer großen Anzahl von Kommentaren wird empfohlen, die Paginierung zu aktivieren, um die Leistung zu verbessern.