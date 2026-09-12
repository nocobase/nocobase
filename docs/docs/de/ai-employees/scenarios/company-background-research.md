---
title: "Workflow + KI für Mitarbeiter zur Vervollständigung der Automatisierung der Hintergrundrecherche im Unternehmen"
description: "Durch Unternehmensinformationsformulare, Hintergrundermittlungsaufzeichnungen, Arbeitsabläufe und KI-Mitarbeiter kann ein Hintergrundermittlungsprozess für das Unternehmen automatisch ausgelöst, gespeichert und zur manuellen Überprüfung unterstützt werden."
keywords: "NocoBase, KI-Mitarbeiter, Workflow, Unternehmenshintergrundrecherche, Due Diligence, Automatisierung, Geschäftspraxis"
---

# Workflow + KI für Mitarbeiter zur Vervollständigung der Automatisierung der Hintergrundrecherche im Unternehmen

In NocoBase können Sie Unternehmenshintergrundrecherchen in einen nachverfolgbaren automatisierten Aufgabenablauf umwandeln. Geschäftsmitarbeiter arbeiten weiterhin auf der vertrauten Unternehmensinformationsseite, während Workflow- und KI-Mitarbeiter für die Vervollständigung von Hintergrundinformationen, die Aufzeichnung des Verarbeitungsprozesses und die Speicherung jedes generierten Berichts verantwortlich sind.

![](https://static-docs.nocobase.com/202607121806356.png)

Dieses Szenario eignet sich zur Lösung eines häufigen Problems: Unternehmenshintergrundinformationen sind kein statisches Feld, das nach einmaliger Eingabe endet. Öffentliche Informationen werden sich ändern, regulatorische Ereignisse werden eintreten und der Status der Zusammenarbeit wird sich im Laufe des Geschäftsverlaufs ständig anpassen. Wenn Sie sich nur regelmäßig auf die manuelle Zusatzaufzeichnung verlassen, kann dies leicht übersehen werden; Wenn man AI direkt Unternehmensinformationen abdecken lässt, wird es schwierig sein zu erklären, „wie es zu diesem Urteil kam.“ Der Ansatz hier besteht darin, die aktuellen Daten und den Forschungsprozess zu trennen und zu speichern – der Unternehmensdatensatz speichert die vom Geschäftspersonal verwendete Version und der Hintergrundüberprüfungsdatensatz speichert den Status, die Ausgabe und den Verlauf jeder KI-Umfrage.

## Schauen wir uns zunächst die beiden Tabellen an

Das Unternehmensinformationsformular liefert die grundlegenden Informationen zum Forschungsobjekt, und das Hintergrundermittlungsdatensatzformular ist für die Durchführung jeder Forschungsaufgabe verantwortlich. Einer speichert die aktuell verfügbaren Informationen und der andere speichert den Verarbeitungsprozess und historische Ergebnisse.

### `companies`: Firmeninformationstabelle

| Kernfelder               | Wirkung                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Company name           | Die wichtigsten identifizierenden Informationen des Forschungsobjekts.                                   |
| Website                | Geben Sie auf der offiziellen Website Hinweise, um Fehleinschätzungen durch Unternehmen mit demselben Namen oder der gleichen Abkürzung vorzubeugen.                   |
| Address                | Unterstützung bei der Bestimmung von Regionen, Einheiten und Geschäftsumfang.                                 |
| Company type           | Markieren Sie Geschäftsbeziehungen wie Kunden, Lieferanten, Partner usw., um eine spätere Beurteilung und Folgeprioritäten zu erleichtern. |
| Background information | Speichern Sie den Unternehmenshintergrundbericht, den Sie gerade verwenden, und verwenden Sie Markdown, um strukturierte Inhalte darzustellen. |

### `background_check_tasks`: Datensatzformular für Hintergrundüberprüfung

| Kernfelder                  | Wirkung                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company ID / Company name | Notieren Sie, für welches Unternehmen diese Umfrage bestimmt ist, um die Aufgabenausführung und die historische Überprüfung zu erleichtern.                                 |
| Status                    | Der Ablauf der Markierungsaufgaben von `pending` zu `processing` und `completed` ist auch die Grundlage, um wiederholte Auslösungen zu verhindern. |
| Research report           | Speichern Sie dieses Mal den vollständigen von AI erstellten Forschungsbericht.                                                   |
| Summary                   | Speichern Sie die Zusammenfassung des Forschungsprozesses, der Risikopunkte und der zu ergänzenden Informationen durch AI.                                     |
| Previous background       | Speichern Sie die alte Version, bevor Sie zurückschreiben. Dies unterstützt die Verlaufsverfolgung und den Vergleich alter und neuer Berichte.                                   |

![](https://static-docs.nocobase.com/202607121807627.png)

## Geben Sie den Rechercheprozess anhand der Unternehmensinformationen ein

Die Firmenliste ist für Geschäftsleute der bekannteste Einstieg. Auf der Seite können Sie den Firmennamen, die offizielle Website, den Unternehmenstyp, die Kontaktperson, die E-Mail-Adresse und andere Informationen sehen. Nach Eintritt in ein Unternehmen können Unternehmensmitarbeiter den aktuellen Hintergrundbericht einsehen oder eine neue Hintergrundermittlung einleiten.

Nach dem Aufrufen der Bearbeitungsseite werden mithilfe der Markdown-Bearbeitungskomponente „Hintergrundinformationen“ angezeigt. Bei den KI-generierten Inhalten handelt es sich nicht um eine kurze Zusammenfassung, sondern um einen strukturierten Bericht, der gelesen, kopiert und weiter gepflegt werden kann. Das Geschäftspersonal kann es weiterhin manuell ändern, aber jedes von der KI generierte Ergebnis hinterlässt einen entsprechenden Verlauf im Hintergrundüberprüfungsdatensatz.

![](https://static-docs.nocobase.com/202607121807450.png)

Auf diese Weise sieht die Seite immer noch wie eine gewöhnliche Schnittstelle zur Datenpflege eines Unternehmens aus, und die zugrunde liegende Verarbeitungsmethode ist zu „aktuelle Daten + Forschungsverlauf“ geworden. Die Firmentabelle speichert die aktuelle Version und die Aufgabentabelle speichert den Prozess und die Beweiskette.

## Drei Auslösemethoden

![](https://static-docs.nocobase.com/202607121807495.png)

Hintergrundrecherchen sollten sich nicht nur auf einen manuellen Knopf verlassen. Im realen Geschäftsleben möchten Sie möglicherweise die Informationen automatisch vervollständigen, nachdem Sie ein neues Unternehmen hinzugefügt haben. Möglicherweise müssen Sie auch regelmäßig historische Aufzeichnungen erstellen. Möglicherweise ergreifen Sie auch die Initiative, die Informationen erneut zu untersuchen, bevor Sie einen Vertrag unterzeichnen oder überprüfen.

Der `New company background check`-Workflow übernimmt die automatische Recherche nach dem Hinzufügen oder Aktualisieren eines Unternehmens. Es lauscht auf die Datenereignisse der Firmentabelle und wird ausgelöst, wenn der Firmenname vorhanden und die Hintergrundinformationen leer sind. Die KI wird nicht sofort nach dem Auslösen aufgerufen, sondern prüft zunächst, ob es noch offene Aufgaben für dasselbe Unternehmen gibt; Andernfalls wird ein neuer Hintergrundüberprüfungsdatensatz erstellt.

![](https://static-docs.nocobase.com/202607121807374.png)

Der `Timing company background check`-Workflow ist für die kontinuierliche Vervollständigung historischer Daten verantwortlich. Es läuft alle 30 Minuten, fragt Unternehmen ab, deren Hintergrundinformationen noch leer sind, und durchläuft Stapel. Innerhalb der Schleife prüfen wir außerdem, ob die Aufgabe bereits existiert, und entscheiden dann, ob eine neue Aufgabe erstellt wird. Auf diese Weise kann die geplante Aufgabe wiederholt ausgeführt werden, ohne dass aufgrund wiederholter Scans mehrere gleichzeitig verarbeitete Datensätze erstellt werden.

![](https://static-docs.nocobase.com/202607121807404.png)

Der `Manual company background check`-Workflow ist an die Schaltfläche „Hintergrundprüfung durchführen“ auf der Seite mit den Unternehmensdetails gebunden, die für Geschäftsmitarbeiter geeignet ist, vor einem Besuch, einer Vertragsunterzeichnung oder einer Überprüfung proaktiv eine Umfrage zu initiieren. Manuelles Auslösen und automatisches Auslösen verwenden denselben Satz von Folgelinks: Zuerst wird ein Hintergrundüberprüfungsdatensatz erstellt, und dann übernimmt der Aufgabenausführungs-Workflow die KI-Untersuchung.

![](https://static-docs.nocobase.com/202607121807793.png)

Diese drei Eingänge lösen Probleme zu unterschiedlichen Zeitpunkten und werden schließlich in derselben Hintergrunduntersuchungsaufzeichnungsform zusammengeführt. Neue Auslöser, geplante Auslöser und manuelle Auslöser sind nur für die Aufzeichnung des „Untersuchungsbedarfs“ verantwortlich, und die spezifische Ausführung, Statusverwaltung und Ergebnisrückschreibung werden zur einheitlichen Verarbeitung an nachfolgende Workflows übergeben.

## KI-Forschung in Aufgaben verwandeln

`Do company background check` ist der Workflow, der tatsächlich die Recherche durchführt. Es wartet auf den `pending`-Datensatz in der Hintergrundprüfungsdatensatztabelle. Sobald der vorherige automatische, geplante oder manuelle Prozess eine Aufgabe erstellt, wird dieser Workflow asynchron ausgelöst.

Bei der Ausführung fragt der Workflow zunächst ab, ob das Unternehmen noch existiert. Existiert das Unternehmen nicht, wird die Aufgabe geschlossen und die Beschreibung verfasst; Wenn das Unternehmen vorhanden ist, wird der Aufgabenstatus auf `processing` geändert und dann wird der KI-Mitarbeiter aufgerufen, den Bericht zu erstellen. Das Aufforderungswort des KI-Mitarbeiters erfordert die Ausgabe von zwei Teilen: einem Markdown-Bericht, der direkt in das Hintergrundfeld des Unternehmens geschrieben werden kann, und einer Zusammenfassung zur manuellen Überprüfung.

![](https://static-docs.nocobase.com/202607121808833.png)

Nachdem die KI strukturierte Ergebnisse zurückgegeben hat, schreibt der Workflow zunächst den Bericht, die Zusammenfassung und den alten Hintergrundinhalt in den Hintergrundüberprüfungsdatensatz und schreibt dann den neuen Bericht zurück in den Unternehmensdatensatz. Diese Reihenfolge vermeidet das Problem „nur die neuesten Ergebnisse, keine Prozessdatensätze“: Die Unternehmensseite behält den neuesten verfügbaren Inhalt und die Aufgabendatensätze behalten den Kontext vor dieser Generierung und dem Zurückschreiben.

![](https://static-docs.nocobase.com/202607121808662.png)

Nach der Aufgabenerteilung wird auch die Stapelverarbeitung natürlicher. Der geplante Workflow muss nicht darauf warten, dass die Recherchen jedes Unternehmens abgeschlossen sind, sondern ist nur für die Erstellung mehrerer zu verarbeitender Datensätze verantwortlich. Jeder Datensatz löst unabhängig voneinander die KI-Umfrage aus. Mehrere Unternehmen können parallel voranschreiten, und wenn eine bestimmte Aufgabe fehlschlägt oder eine Zeitüberschreitung auftritt, werden andere Unternehmen nicht blockiert.

## Machen Sie KI-Ergebnisse überprüfbar

KI-generierte Berichte sind nach einer festen Struktur organisiert: Unternehmensprofil, Kerngeschäft, Entwicklungsgeschichte und Kapitalhintergrund, Marktposition und Wettbewerbsperspektive, Beurteilung der Verkaufsnachverfolgung und Zitierlinks. In der Zusammenfassung sieht das Fachpersonal nicht nur das „Fazit“, sondern auch die Risikohinweise und Zusatzinformationen der KI.

Auf der Detailseite des Hintergrunduntersuchungsdatensatzes werden „Forschungsbericht“ und „Vorheriger Hintergrund“ in Registerkarten angezeigt und es ist die Funktion „Kopieren“ verfügbar. Auf diese Weise können Sie diesen Bericht während der Diskussion, Überprüfung oder externen Kommunikation schnell kopieren und Änderungen gegenüber der alten Version überprüfen.

Die Datensatzdetails konfigurieren auch zwei AI-Worker-Aufgaben. In:

- Verbessern Sie den Hintergrundforschungsbericht: Erstellen Sie den Bericht neu, nachdem Sie Informationen im Dialog hinzugefügt haben, und schreiben Sie die Ergebnisse zurück in die Unternehmensunterlagen
- Vergleichen Sie die alten und neuen Hintergrundforschungsberichte: Lesen Sie die alten und neuen Berichte und lassen Sie sich von AI die wesentlichen Unterschiede erklären, die dieses Update mit sich bringt

Dies ermöglicht es der KI, sich nicht mit der „einmaligen Generierung von Texten“ zufrieden zu geben, sondern am Prozess der kontinuierlichen Wartung, Überprüfung und des Versionsvergleichs teilzunehmen.

![](https://static-docs.nocobase.com/202607121808444.png)

## So kombinieren Sie Workflows

Insgesamt lässt sich dieser Workflow in vier Ebenen unterteilen.

Die erste Schicht ist für die Erstellung von Aufgaben verantwortlich. `New company background check` ist für neu hinzugefügte oder aktualisierte Unternehmen, `Timing company background check` dient der Vervollständigung historischer Daten und `Manual company background check` dient der manuellen Initiative. Sie alle prüfen vor dem Erstellen einer Aufgabe, ob noch nicht abgeschlossene Datensätze vorhanden sind, wodurch die doppelte Verarbeitung aus der Quelle reduziert wird.

Die zweite Schicht ist für die Ausführung von Aufgaben verantwortlich. `Do company background check` lauscht dem Hintergrundüberprüfungsdatensatz, leitet die ausstehende Aufgabe zur Verarbeitung weiter, ruft den KI-Mitarbeiter an und schreibt nach Abschluss den Bericht, die Zusammenfassung und die aktuellen Hintergrundfelder des Unternehmens.

Die dritte Schicht ist für die Bereitstellung kontrollierter Rückschreibfunktionen für KI-Mitarbeiter verantwortlich. Als werkzeugbasierter Workflow beschränkt `Update company background` die KI darauf, nur bestimmte Datensätze gemäß eindeutigen Parametern zu schreiben, um eine übermäßige Belastung der Datenänderungsberechtigungen zu vermeiden.

Die vierte Schicht ist für die Ausnahmereinigung zuständig. `Clean overtime processing background check` wird alle 30 Minuten ausgeführt, um nicht abgeschlossene Aufgaben zu bereinigen, die länger als 15 Minuten nicht abgeschlossen wurden, um eine langfristige Verarbeitung von Aufgaben nach einer abnormalen Unterbrechung zu vermeiden.

![](https://static-docs.nocobase.com/202607121808799.png)

## Auf welche Szenarien kann migriert werden?

Was diese Szene zeigt, ist kein isoliertes Formular oder eine separate KI-Schaltfläche, sondern eine Kombination mehrerer Funktionen in NocoBase: Die Datentabelle ist für die Übertragung von Geschäftsobjekten und historischen Datensätzen verantwortlich, die Seite ist für die Anzeige und Auslösung durch Geschäftspersonal verantwortlich, der Workflow ist für die Planung und das Zurückschreiben verantwortlich und das KI-Personal ist für die Generierung überprüfbarer strukturierter Ergebnisse verantwortlich.

Ähnliche Modelle können auf Szenarien wie Lieferantenzulassung, Kunden-Due-Diligence, Vorprüfung des Vertragsrisikos, Lead-Qualitätsbewertung, Verfolgung der öffentlichen Meinung und Vorprüfung von Investitions- und Finanzierungszielen migriert werden. Solange es im Unternehmen mehrere Anforderungen gibt, wie zum Beispiel „Daten müssen kontinuierlich vervollständigt werden“, „KI-Ergebnisse müssen zurückbleiben“ und „Historische Versionen können nicht überschrieben werden“, kann auf ähnliche Weise ein lauffähiger, nachverfolgbarer und skalierbarer automatisierter Prozess aufgebaut werden.

## Referenzdokumentation

- [NocoBase Workflow](/workflow/)
- [NocoBase AI Employee](/ai-employees/)
- [NocoBase Workflow AI-Mitarbeiterknoten ](/ai-employees/workflow/nodes/employee/configuration)
- [NocoBase AI-Mitarbeiteranpassungstool ](/ai-employees/features/tools)
