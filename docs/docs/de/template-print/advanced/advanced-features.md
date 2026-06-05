:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Erweiterte Funktionen

### Paginierung

#### 1. Seitenzahlen aktualisieren

##### Syntax
Fügen Sie diese einfach in Ihrer Office-Software ein.

##### Beispiel
In Microsoft Word:
- Verwenden Sie die Funktion „Einfügen → Seitenzahl“.
In LibreOffice:
- Verwenden Sie die Funktion „Einfügen → Felder → Seitenzahl“.

##### Ergebnis
Im generierten Bericht werden die Seitenzahlen auf jeder Seite automatisch aktualisiert.

#### 2. Inhaltsverzeichnis erstellen

##### Syntax
Fügen Sie diese einfach in Ihrer Office-Software ein.

##### Beispiel
In Microsoft Word:
- Verwenden Sie die Funktion „Einfügen → Index und Tabellen → Inhaltsverzeichnis“.
In LibreOffice:
- Verwenden Sie die Funktion „Einfügen → Verzeichnisse → Verzeichnis, Index oder Bibliografie“.

##### Ergebnis
Das Inhaltsverzeichnis des Berichts wird automatisch basierend auf dem Dokumentinhalt aktualisiert.

#### 3. Tabellenüberschriften wiederholen

##### Syntax
Fügen Sie diese einfach in Ihrer Office-Software ein.

##### Beispiel
In Microsoft Word:
- Klicken Sie mit der rechten Maustaste auf die Tabellenüberschrift → Tabelleneigenschaften → Aktivieren Sie „Als Kopfzeile auf jeder Seite wiederholen“.
In LibreOffice:
- Klicken Sie mit der rechten Maustaste auf die Tabellenüberschrift → Tabelleneigenschaften → Registerkarte „Textfluss“ → Aktivieren Sie „Überschrift wiederholen“.

##### Ergebnis
Wenn eine Tabelle mehrere Seiten umfasst, wird die Überschrift automatisch oben auf jeder Seite wiederholt.

### Internationalisierung (i18n)

#### 1. Statische Textübersetzung

##### Syntax
Verwenden Sie das Tag `{t(Text)}`, um statischen Text zu internationalisieren:
```
{t(meeting)}
```

##### Beispiel
Im Template:
```
{t(meeting)} {t(apples)}
```
JSON-Daten oder ein externes Lokalisierungs-Wörterbuch (z. B. für „fr-fr“) stellen die entsprechenden Übersetzungen bereit, wie z. B. „meeting“ → „rendez-vous“ und „apples“ → „Pommes“.

##### Ergebnis
Beim Generieren des Berichts wird der Text entsprechend der Zielsprache durch die passende Übersetzung ersetzt.

#### 2. Dynamische Textübersetzung

##### Syntax
Für Dateninhalte können Sie den `:t`-Formatierer verwenden, zum Beispiel:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Beispiel
Im Template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
JSON-Daten und das Lokalisierungs-Wörterbuch stellen die entsprechenden Übersetzungen bereit.

##### Ergebnis
Basierend auf der Bedingung wird „lundi“ oder „mardi“ ausgegeben (am Beispiel der Zielsprache).

### Schlüssel-Wert-Zuordnung

#### 1. Enum-Konvertierung (:convEnum)

##### Syntax
```
{Daten:convEnum(EnumName)}
```
Zum Beispiel:
```
0:convEnum('ORDER_STATUS')
```

##### Beispiel
Im API-Optionsbeispiel wird Folgendes übergeben:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Im Template:
```
0:convEnum('ORDER_STATUS')
```

##### Ergebnis
Es wird „pending“ ausgegeben; wenn der Index den Enum-Bereich überschreitet, wird der ursprüngliche Wert ausgegeben.

### Dynamische Bilder
:::info
Derzeit werden XLSX- und DOCX-Dateitypen unterstützt
:::
Sie können „dynamische Bilder“ in Dokumentvorlagen einfügen. Das bedeutet, dass Platzhalterbilder in der Vorlage während des Renderns automatisch durch tatsächliche Bilder ersetzt werden, basierend auf den Daten. Dieser Vorgang ist sehr einfach und erfordert nur:

1. Fügen Sie ein temporäres Bild als Platzhalter ein.

2. Bearbeiten Sie den „Alternativtext“ dieses Bildes, um das Feld-Label festzulegen.

3. Rendern Sie das Dokument, und das System ersetzt es automatisch durch das tatsächliche Bild.

Im Folgenden erläutern wir die Vorgehensweise für DOCX- und XLSX-Dateien anhand konkreter Beispiele.

#### Dynamische Bilder in DOCX-Dateien einfügen

##### Einzelbild-Ersetzung

1. Öffnen Sie Ihre DOCX-Vorlage und fügen Sie ein temporäres Bild ein (dies kann ein beliebiges Platzhalterbild sein, z. B. ein [einfarbig blaues Bild](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Hinweise zum Bildformat**

- Derzeit werden Platzhalterbilder nur im PNG-Format unterstützt. Wir empfehlen die Verwendung unseres bereitgestellten Beispielbildes: [einfarbig blaues Bild](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Die zu rendernden Zielbilder unterstützen nur die Formate PNG, JPG und JPEG. Andere Bildtypen können möglicherweise nicht gerendert werden.

**Hinweise zur Bildgröße**

Sowohl bei DOCX als auch bei XLSX entspricht die endgültige Größe des gerenderten Bildes den Abmessungen des temporären Bildes in der Vorlage. Das heißt, das tatsächlich eingefügte Bild wird automatisch auf die Größe des von Ihnen eingefügten Platzhalterbildes skaliert. Wenn Sie möchten, dass das gerenderte Bild 150×150 Pixel groß ist, verwenden Sie bitte ein temporäres Bild in der Vorlage und passen Sie es auf diese Größe an.
:::

2. Klicken Sie mit der rechten Maustaste auf dieses Bild, bearbeiten Sie dessen „Alternativtext“ und geben Sie das gewünschte Bildfeld-Label ein, z. B. `{d.imageUrl}`:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Verwenden Sie die folgenden Beispieldaten zum Rendern:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
}
```

4. Im gerenderten Ergebnis wird das temporäre Bild durch das tatsächliche Bild ersetzt:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Mehrere Bilder in einer Schleife ersetzen

Wenn Sie eine Gruppe von Bildern in die Vorlage einfügen möchten, z. B. eine Produktliste, können Sie dies auch über Schleifen realisieren. Die genauen Schritte sind wie folgt:

1. Angenommen, Ihre Daten sehen wie folgt aus:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg"
    }
  ]
}
```

2. Richten Sie in der DOCX-Vorlage einen Schleifenbereich ein und fügen Sie in jedem Schleifenelement temporäre Bilder ein, deren Alternativtext auf `{d.products[i].imageUrl}` gesetzt ist, wie unten gezeigt:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Nach dem Rendern werden alle temporären Bilder durch die entsprechenden Datenbilder ersetzt:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Dynamische Bilder in XLSX-Dateien einfügen

Die Vorgehensweise in Excel-Vorlagen (XLSX) ist im Wesentlichen dieselbe, beachten Sie jedoch die folgenden Punkte:

1. Stellen Sie nach dem Einfügen eines Bildes sicher, dass Sie „Bild in Zelle“ auswählen und nicht, dass das Bild über der Zelle schwebt.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Nachdem Sie die Zelle ausgewählt haben, klicken Sie auf „Alternativtext anzeigen“, um das Feld-Label einzugeben, z. B. `{d.imageUrl}`.

### Barcode
:::info
Derzeit werden XLSX- und DOCX-Dateitypen unterstützt
:::

#### Barcodes generieren (z. B. QR-Codes)

Die Barcode-Generierung funktioniert auf die gleiche Weise wie bei dynamischen Bildern und erfordert nur drei Schritte:

1. Fügen Sie ein temporäres Bild in die Vorlage ein, um die Barcode-Position zu markieren.

2. Bearbeiten Sie den „Alternativtext“ des Bildes und geben Sie das Barcode-Format-Feld-Label ein, z. B. `{d.code:barcode(qrcode)}`, wobei `qrcode` der Barcode-Typ ist (siehe unterstützte Liste unten).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Nach dem Rendern wird das Platzhalterbild automatisch durch das entsprechende Barcode-Bild ersetzt:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Unterstützte Barcode-Typen

| Barcode-Name | Typ    |
| ------------ | ------ |
| QR-Code      | qrcode |