:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Verknüpfungsregeln

## Einführung

In NocoBase sind Verknüpfungsregeln ein Mechanismus zur Steuerung des interaktiven Verhaltens von Frontend-Oberflächenelementen. Sie ermöglichen es Benutzern, die Anzeige- und Verhaltenslogik von Blöcken, Feldern und Aktionen in der Oberfläche basierend auf verschiedenen Bedingungen anzupassen. Dadurch wird eine flexible, Low-Code-Interaktion ermöglicht. Diese Funktion wird kontinuierlich weiterentwickelt und optimiert.

Durch die Konfiguration von Verknüpfungsregeln können Sie beispielsweise Folgendes erreichen:

- Bestimmte Blöcke basierend auf der aktuellen Benutzerrolle ausblenden/anzeigen. Verschiedene Rollen sehen Blöcke mit unterschiedlichen Datenbereichen; so sehen Administratoren beispielsweise Blöcke mit vollständigen Informationen, während normale Benutzer nur Blöcke mit grundlegenden Informationen sehen.
- Wenn in einem Formular eine Option ausgewählt wird, andere Feldwerte automatisch ausfüllen oder zurücksetzen.
- Wenn in einem Formular eine Option ausgewählt wird, bestimmte Eingabefelder deaktivieren.
- Wenn in einem Formular eine Option ausgewählt wird, bestimmte Eingabefelder als Pflichtfelder festlegen.
- Steuern, ob Aktionsschaltflächen unter bestimmten Bedingungen sichtbar oder anklickbar sind.

## Bedingungskonfiguration

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Linke Variable

Die linke Variable in einer Bedingung definiert das „Objekt der Bewertung“ in der Verknüpfungsregel. Basierend auf dem Wert dieser Variablen wird die Bedingung geprüft, um zu entscheiden, ob die Verknüpfungsaktion ausgelöst werden soll.

Wählbare Variablen umfassen:

- Felder im Kontext, wie z. B. `Aktuelles Formular/xxx`, `Aktueller Datensatz/xxx`, `Aktueller Popup-Datensatz/xxx` usw.
- Systemglobale Variablen, wie z. B. `Aktueller Benutzer`, `Aktuelle Rolle` usw., die sich für die dynamische Steuerung basierend auf Benutzeridentität, Berechtigungen und anderen Informationen eignen.
  > ✅ Die verfügbaren Optionen für die linke Variable werden durch den Kontext des Blocks bestimmt. Verwenden Sie die linke Variable sinnvoll entsprechend Ihren Geschäftsanforderungen:
  >
  > - `Aktueller Benutzer` stellt die Informationen des aktuell angemeldeten Benutzers dar.
  > - `Aktuelles Formular` stellt die Echtzeit-Eingabewerte im Formular dar.
  > - `Aktueller Datensatz` stellt den gespeicherten Datensatzwert dar, z. B. einen Zeilendatensatz in einer Tabelle.

### Operator

Der Operator wird verwendet, um die Logik für die Bedingungsprüfung festzulegen, d. h., wie die linke Variable mit dem rechten Wert verglichen werden soll. Verschiedene Typen linker Variablen unterstützen unterschiedliche Operatoren. Gängige Operatoren sind:

- **Texttyp**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty` usw.
- **Zahlentyp**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte` usw.
- **Boolescher Typ**: `$isTruly`, `$isFalsy`
- **Array-Typ**: `$match`, `$anyOf`, `$empty`, `$notEmpty` usw.

> ✅ Das System empfiehlt automatisch eine Liste verfügbarer Operatoren basierend auf dem Typ der linken Variablen, um eine sinnvolle Konfigurationslogik sicherzustellen.

### Rechter Wert

Wird zum Vergleich mit der linken Variablen verwendet und ist der Referenzwert zur Bestimmung, ob die Bedingung erfüllt ist.

Unterstützte Inhalte umfassen:

- Konstante Werte: Geben Sie feste Zahlen, Texte, Daten usw. ein.
- Kontextvariablen: wie z. B. andere Felder im aktuellen Formular, der aktuelle Datensatz usw.
- Systemvariablen: wie z. B. der aktuelle Benutzer, die aktuelle Uhrzeit, die aktuelle Rolle usw.

> ✅ Das System passt die Eingabemethode für den rechten Wert automatisch an den Typ der linken Variablen an, zum Beispiel:
>
> - Wenn die linke Seite ein „Auswahlfeld“ ist, wird der entsprechende Optionsselektor angezeigt.
> - Wenn die linke Seite ein „Datumsfeld“ ist, wird ein Datumswähler angezeigt.
> - Wenn die linke Seite ein „Textfeld“ ist, wird ein Texteingabefeld angezeigt.

> 💡 Die flexible Verwendung rechter Werte (insbesondere dynamischer Variablen) ermöglicht es Ihnen, Verknüpfungslogiken zu erstellen, die auf dem aktuellen Benutzer, dem aktuellen Datenstatus und dem Kontext basieren, und so eine leistungsfähigere interaktive Erfahrung zu erzielen.

## Regelausführungslogik

### Bedingungsauslösung

Wenn die Bedingung in einer Regel erfüllt ist (optional), wird die darunterliegende Eigenschaftsänderungsaktion automatisch ausgeführt. Wird keine Bedingung festgelegt, gilt die Regel standardmäßig immer als erfüllt und die Eigenschaftsänderungsaktion wird automatisch ausgeführt.

### Mehrere Regeln

Sie können für ein Formular mehrere Verknüpfungsregeln konfigurieren. Wenn die Bedingungen mehrerer Regeln gleichzeitig erfüllt sind, führt das System die Ergebnisse in der Reihenfolge von der ersten zur letzten Regel aus, wobei das letzte Ergebnis als endgültiger Standard gilt.
Beispiel: Regel 1 setzt ein Feld auf „Deaktiviert“, und Regel 2 setzt das Feld auf „Bearbeitbar“. Sind die Bedingungen beider Regeln erfüllt, wird das Feld „Bearbeitbar“.

> Die Ausführungsreihenfolge mehrerer Regeln ist entscheidend. Stellen Sie beim Entwurf von Regeln sicher, dass Sie deren Prioritäten und Wechselbeziehungen klären, um Konflikte zu vermeiden.

## Regelverwaltung

Für jede Regel können die folgenden Operationen durchgeführt werden:

- **Benutzerdefinierte Benennung**: Legen Sie einen leicht verständlichen Namen für die Regel fest, um die Verwaltung und Identifizierung zu erleichtern.
- **Sortierung**: Passen Sie die Reihenfolge basierend auf der Ausführungspriorität der Regeln an, um sicherzustellen, dass das System sie in der richtigen Reihenfolge verarbeitet.
- **Löschen**: Entfernen Sie Regeln, die nicht mehr benötigt werden.
- **Aktivieren/Deaktivieren**: Deaktivieren Sie eine Regel vorübergehend, ohne sie zu löschen. Dies ist nützlich für Szenarien, in denen eine Regel temporär außer Kraft gesetzt werden muss.
- **Regel duplizieren**: Erstellen Sie eine neue Regel, indem Sie eine bestehende kopieren, um eine wiederholte Konfiguration zu vermeiden.

## Über Variablen

Bei der Feldwertzuweisung und Bedingungskonfiguration werden sowohl Konstanten als auch Variablen unterstützt. Die Liste der Variablen variiert je nach Position des Blocks. Eine sinnvolle Auswahl und Verwendung von Variablen kann Geschäftsanforderungen flexibler erfüllen. Weitere Informationen zu Variablen finden Sie unter [Variablen](/interface-builder/variables).

## Block-Verknüpfungsregeln

Block-Verknüpfungsregeln ermöglichen die dynamische Steuerung der Anzeige eines Blocks basierend auf Systemvariablen (wie aktuellem Benutzer, Rolle) oder Kontextvariablen (wie aktuellem Popup-Datensatz). Ein Administrator kann beispielsweise vollständige Bestellinformationen einsehen, während eine Kundendienstrolle nur bestimmte Bestelldaten sehen kann. Mithilfe von Block-Verknüpfungsregeln können Sie entsprechende Blöcke basierend auf Rollen konfigurieren und innerhalb dieser Blöcke verschiedene Felder, Aktionsschaltflächen und Datenbereiche festlegen. Wenn die angemeldete Rolle der Zielrolle entspricht, zeigt das System den entsprechenden Block an. Es ist wichtig zu beachten, dass Blöcke standardmäßig angezeigt werden, sodass Sie in der Regel die Logik zum Ausblenden des Blocks definieren müssen.

👉 Details finden Sie unter: [Block/Block-Verknüpfungsregeln](/interface-builder/blocks/block-settings/block-linkage-rule)

## Feld-Verknüpfungsregeln

Feld-Verknüpfungsregeln werden verwendet, um den Status von Feldern in einem Formular oder Detailblock basierend auf Benutzeraktionen dynamisch anzupassen. Dies umfasst hauptsächlich:

- Steuerung des **Anzeige-/Ausblende-Status** eines Feldes
- Festlegen, ob ein Feld **Pflichtfeld** ist
- **Wertzuweisung**
- Ausführen von JavaScript zur Handhabung benutzerdefinierter Geschäftslogik

👉 Details finden Sie unter: [Block/Feld-Verknüpfungsregeln](/interface-builder/blocks/block-settings/field-linkage-rule)

## Aktions-Verknüpfungsregeln

Aktions-Verknüpfungsregeln unterstützen derzeit die Steuerung von Aktionsverhalten, wie z. B. Ausblenden/Deaktivieren, basierend auf Kontextvariablen wie dem aktuellen Datensatzwert und dem aktuellen Formular sowie globalen Variablen.

👉 Details finden Sie unter: [Aktion/Verknüpfungsregeln](/interface-builder/actions/action-settings/linkage-rule)