:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Häufige Probleme und Lösungen

### 1. Leere Spalten und Zellen in Excel-Vorlagen verschwinden beim Rendern

**Problembeschreibung**: Wenn eine Zelle in einer Excel-Vorlage keinen Inhalt oder keine Formatierung aufweist, kann sie beim Rendern entfernt werden. Dies führt dazu, dass die Zelle im finalen Dokument fehlt.

**Lösungen**:

- **Hintergrundfarbe füllen**: Füllen Sie leere Zellen im Zielbereich mit einer Hintergrundfarbe. So stellen Sie sicher, dass die Zellen während des Renderprozesses sichtbar bleiben.
- **Leerzeichen einfügen**: Fügen Sie ein Leerzeichen in leere Zellen ein. Dies hilft, die Zellstruktur auch ohne tatsächlichen Inhalt zu erhalten.
- **Rahmen festlegen**: Fügen Sie der Tabelle Rahmen hinzu, um die Zellbegrenzungen zu verstärken und zu verhindern, dass Zellen beim Rendern verschwinden.

**Beispiel**:

Stellen Sie in der Excel-Vorlage für alle Zielzellen einen hellgrauen Hintergrund ein und fügen Sie in leere Zellen Leerzeichen ein.

### 2. Zusammengeführte Zellen sind in der Ausgabe ungültig

**Problembeschreibung**: Wenn Sie die Schleifenfunktion zum Ausgeben von Tabellen verwenden und die Vorlage zusammengeführte Zellen enthält, kann dies zu abnormalen Render-Ergebnissen führen. Beispielsweise können Zusammenführungseffekte verloren gehen oder Daten falsch ausgerichtet werden.

**Lösungen**:

- **Vermeiden Sie zusammengeführte Zellen**: Versuchen Sie, zusammengeführte Zellen in Tabellen, die durch Schleifen ausgegeben werden, zu vermeiden. Dies gewährleistet eine korrekte Datenwiedergabe.
- **Zentrieren über Spalten verwenden**: Wenn Sie Text horizontal über mehrere Zellen hinweg zentrieren möchten, nutzen Sie die Funktion „Zentrieren über Spalten“ anstelle des Zusammenführens von Zellen.
- **Positionen zusammengeführter Zellen begrenzen**: Falls Sie unbedingt zusammengeführte Zellen verwenden müssen, führen Sie diese nur oberhalb oder rechts von der Tabelle zusammen. Vermeiden Sie das Zusammenführen unterhalb oder links, um den Verlust von Zusammenführungseffekten beim Rendern zu verhindern.

### 3. Inhalt unterhalb des Schleifen-Renderbereichs führt zu Formatierungsfehlern

**Problembeschreibung**: Wenn in einer Excel-Vorlage unterhalb eines Schleifenbereichs, der sich dynamisch basierend auf Dateneinträgen (z. B. Bestelldetails) erweitert, weiterer Inhalt (z. B. Bestellübersicht, Notizen) vorhanden ist, werden die durch die Schleife generierten Datenzeilen beim Rendern nach unten erweitert. Dies überschreibt oder verschiebt den darunterliegenden statischen Inhalt direkt, was zu Formatierungsfehlern und Inhaltsüberlappungen im finalen Dokument führt.

**Lösungen**:

*   **Layout anpassen, Schleifenbereich nach unten verschieben**: Dies ist die am meisten empfohlene Methode. Platzieren Sie den Tabellenbereich, der durch eine Schleife gerendert werden soll, am unteren Ende des gesamten Arbeitsblatts. Verschieben Sie alle Informationen, die sich ursprünglich darunter befanden (Zusammenfassungen, Signaturen usw.), oberhalb des Schleifenbereichs. Auf diese Weise können sich die Schleifendaten frei nach unten erweitern, ohne andere Elemente zu beeinflussen.
*   **Ausreichend leere Zeilen reservieren**: Wenn Inhalt unbedingt unterhalb des Schleifenbereichs platziert werden muss, schätzen Sie die maximale Anzahl der Zeilen ab, die die Schleife generieren könnte. Fügen Sie dann manuell genügend leere Zeilen als Puffer zwischen dem Schleifenbereich und dem darunterliegenden Inhalt ein. Diese Methode birgt jedoch Risiken: Sollten die tatsächlichen Daten die geschätzte Zeilenanzahl überschreiten, tritt das Problem erneut auf.
*   **Word-Vorlagen verwenden**: Wenn die Layout-Anforderungen komplex sind und nicht durch eine Anpassung der Excel-Struktur gelöst werden können, ziehen Sie die Verwendung von Word-Dokumenten als Vorlage in Betracht. Tabellen in Word verschieben den darunterliegenden Inhalt bei zunehmender Zeilenanzahl automatisch nach unten, ohne dass es zu Inhaltsüberlappungen kommt. Dies macht Word besser geeignet für die Generierung solcher dynamischen Dokumente.

**Beispiel**:

**Falscher Ansatz**: Die Informationen zur „Bestellübersicht“ direkt unterhalb der Schleifen-Tabelle „Bestelldetails“ platzieren.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Korrekter Ansatz 1 (Layout anpassen)**: Verschieben Sie die Informationen zur „Bestellübersicht“ oberhalb der Tabelle „Bestelldetails“, sodass der Schleifenbereich das unterste Element der Seite bildet.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Korrekter Ansatz 2 (Leere Zeilen reservieren)**: Reservieren Sie viele leere Zeilen zwischen den „Bestelldetails“ und der „Bestellübersicht“, um sicherzustellen, dass der Schleifeninhalt ausreichend Platz zur Erweiterung hat.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Korrekter Ansatz 3**: Verwenden Sie Word-Vorlagen.

### 4. Fehlermeldungen erscheinen beim Rendern der Vorlage

**Problembeschreibung**: Während des Rendervorgangs der Vorlage zeigt das System Fehlermeldungen an, was zu einem Fehlschlag des Renderns führt.

**Mögliche Ursachen**:

- **Platzhalterfehler**: Die Namen der Platzhalter stimmen nicht mit den Feldern des Datensatzes überein oder enthalten Syntaxfehler.
- **Fehlende Daten**: Im Datensatz fehlen Felder, die in der Vorlage referenziert werden.
- **Unsachgemäße Verwendung des Formatierers**: Die Parameter des Formatierers sind falsch oder es werden nicht unterstützte Formatierungstypen verwendet.

**Lösungen**:

- **Platzhalter prüfen**: Stellen Sie sicher, dass die Platzhalternamen in der Vorlage mit den Feldnamen im Datensatz übereinstimmen und die Syntax korrekt ist.
- **Datensatz validieren**: Bestätigen Sie, dass der Datensatz alle in der Vorlage referenzierten Felder enthält und die Datenformate den Anforderungen entsprechen.
- **Formatierer anpassen**: Überprüfen Sie die Verwendung des Formatierers, stellen Sie sicher, dass die Parameter korrekt sind und verwenden Sie unterstützte Formatierungstypen.

**Beispiel**:

**Fehlerhafte Vorlage**:
```
Bestell-ID: {d.orderId}
Bestelldatum: {d.orderDate:format('YYYY/MM/DD')}
Gesamtbetrag: {d.totalAmount:format('0.00')}
```

**Datensatz**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Feld totalAmount fehlt
}
```

**Lösung**: Fügen Sie das Feld `totalAmount` zum Datensatz hinzu oder entfernen Sie den Verweis auf `totalAmount` aus der Vorlage.