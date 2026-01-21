# Die Funktion „Vorlagendruck“ zur Erstellung von Liefer- und Kaufverträgen nutzen

In Lieferketten- oder Handelsszenarien ist es oft notwendig, schnell einen standardisierten „Liefer- und Kaufvertrag“ zu erstellen und dessen Inhalt dynamisch mit Informationen aus Datenquellen wie Käufern, Verkäufern und Produktdetails zu füllen. Im Folgenden zeigen wir Ihnen anhand eines vereinfachten „Vertrags“-Anwendungsfalls, wie Sie die Funktion „Vorlagendruck“ konfigurieren und verwenden, um Dateninformationen auf Platzhalter in Vertrags-Vorlagen abzubilden und so automatisch das endgültige Vertragsdokument zu generieren.

---

## 1. Hintergrund und Überblick über die Datenstruktur

In unserem Beispiel gibt es grob die folgenden Haupt-Sammlungen (andere irrelevante Felder werden weggelassen):

- **Parteien**: Speichert Informationen über die Einheiten oder Personen von Partei A/Partei B, einschließlich Name, Adresse, Ansprechpartner, Telefon usw.
- **Verträge**: Speichert spezifische Vertragsdatensätze, einschließlich Vertragsnummer, Fremdschlüssel für Käufer/Verkäufer, Unterzeichnerinformationen, Start-/Enddaten, Bankkonto usw.
- **Vertragspositionen**: Speichert mehrere Positionen unter dem Vertrag (Produktname, Spezifikation, Menge, Einzelpreis, Lieferdatum usw.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Da das aktuelle System nur das Drucken einzelner Datensätze unterstützt, klicken wir auf der Seite „Vertragsdetails“ auf „Drucken“. Das System ruft dann automatisch den entsprechenden Vertragsdatensatz sowie die zugehörigen Parteien und andere Informationen ab und füllt diese in Word- oder PDF-Dokumente ein.

---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


## 2. Vorbereitung

### 2.1 Plugin-Vorbereitung

Beachten Sie, dass unser „Vorlagendruck“ ein kommerzielles Plugin ist, das vor dem Drucken erworben und aktiviert werden muss.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Plugin-Aktivierung bestätigen:**

Erstellen Sie auf einer beliebigen Seite einen Detailblock (z. B. für Benutzer) und prüfen Sie, ob in der Aktionskonfiguration eine entsprechende Option für die Vorlagenkonfiguration vorhanden ist:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Sammlung-Erstellung

Erstellen Sie die oben entworfenen Haupt-Sammlung, Vertrags-Sammlung und Produktpositions-Sammlung (wählen Sie die Kernfelder aus).

#### Vertrags-Sammlung (Contracts)

| Feldkategorie           | Anzeigename des Feldes               | Feldname                    | Feldoberfläche                  |
|-------------------------|--------------------------------------|-----------------------------|---------------------------------|
| **Primär- & Fremdschlüsselfelder** |                                      |                             |                                 |
|                         | ID                                   | id                          | Integer                         |
|                         | Käufer-ID                            | buyer_id                    | Integer                         |
|                         | Verkäufer-ID                         | seller_id                   | Integer                         |
| **Assoziationsfelder**  |                                      |                             |                                 |
|                         | Vertragspositionen                   | contract_items              | One to many                     |
|                         | Käufer (Partei A)                    | buyer                       | Many to one                     |
|                         | Verkäufer (Partei B)                 | seller                      | Many to one                     |
| **Allgemeine Felder**   |                                      |                             |                                 |
|                         | Vertragsnummer                       | contract_no                 | Single line text                |
|                         | Lieferstartdatum                     | start_date                  | Datetime (with time zone)       |
|                         | Lieferenddatum                       | end_date                    | Datetime (with time zone)       |
|                         | Anzahlungsquote (%)                  | deposit_ratio               | Percent                         |
|                         | Zahlungstage nach Lieferung          | payment_days_after          | Integer                         |
|                         | Bankkontoname (Begünstigter)         | bank_account_name           | Single line text                |
|                         | Bankname                             | bank_name                   | Single line text                |
|                         | Bankkontonummer (Begünstigter)       | bank_account_number         | Single line text                |
|                         | Gesamtbetrag                         | total_amount                | Number                          |
|                         | Währungscodes                        | currency_codes              | Single select                   |
|                         | Restbetragsquote (%)                 | balance_ratio               | Percent                         |
|                         | Restzahlungstage nach Lieferung      | balance_days_after          | Integer                         |
|                         | Lieferort                            | delivery_place              | Long text                       |
|                         | Name des Unterzeichners Partei A     | party_a_signatory_name      | Single line text                |
|                         | Titel des Unterzeichners Partei A    | party_a_signatory_title     | Single line text                |
|                         | Name des Unterzeichners Partei B     | party_b_signatory_name      | Single line text                |
|                         | Titel des Unterzeichners Partei B    | party_b_signatory_title     | Single line text                |
| **Systemfelder**        |                                      |                             |                                 |
|                         | Erstellt am                          | createdAt                   | Created at                      |
|                         | Erstellt von                         | createdBy                   | Created by                      |
|                         | Zuletzt aktualisiert am              | updatedAt                   | Last updated at                 |
|                         | Zuletzt aktualisiert von             | updatedBy                   | Last updated by                 |

#### Parteien-Sammlung (Parties)

| Feldkategorie           | Anzeigename des Feldes               | Feldname       | Feldoberfläche   |
|-------------------------|--------------------------------------|----------------|------------------|
| **Primär- & Fremdschlüsselfelder** |                                      |                |                  |
|                         | ID                                   | id             | Integer          |
| **Allgemeine Felder**   |                                      |                |                  |
|                         | Parteiname                           | party_name     | Single line text |
|                         | Adresse                              | address        | Single line text |
|                         | Ansprechpartner                      | contact_person | Single line text |
|                         | Telefonnummer                        | contact_phone  | Phone            |
|                         | Position                             | position       | Single line text |
|                         | E-Mail                               | email          | Email            |
|                         | Webseite                             | website        | URL              |
| **Systemfelder**        |                                      |                |                  |
|                         | Erstellt am                          | createdAt      | Created at       |
|                         | Erstellt von                         | createdBy      | Created by       |
|                         | Zuletzt aktualisiert am              | updatedAt      | Last updated at  |
|                         | Zuletzt aktualisiert von             | updatedBy      | Last updated by  |

#### Vertragspositionen-Sammlung (Contract Line Items)

| Feldkategorie           | Anzeigename des Feldes               | Feldname        | Feldoberfläche                  |
|-------------------------|--------------------------------------|-----------------|---------------------------------|
| **Primär- & Fremdschlüsselfelder** |                                      |                 |                                 |
|                         | ID                                   | id              | Integer                         |
|                         | Vertrags-ID                          | contract_id     | Integer                         |
| **Assoziationsfelder**  |                                      |                 |                                 |
|                         | Vertrag                              | contract        | Many to one                     |
| **Allgemeine Felder**   |                                      |                 |                                 |
|                         | Produktname                          | product_name    | Single line text                |
|                         | Spezifikation / Modell               | spec            | Single line text                |
|                         | Menge                                | quantity        | Integer                         |
|                         | Einzelpreis                          | unit_price      | Number                          |
|                         | Gesamtbetrag                         | total_amount    | Number                          |
|                         | Lieferdatum                          | delivery_date   | Datetime (with time zone)       |
|                         | Anmerkung                            | remark          | Long text                       |
| **Systemfelder**        |                                      |                 |                                 |
|                         | Erstellt am                          | createdAt       | Created at                      |
|                         | Erstellt von                         | createdBy       | Created by                      |
|                         | Zuletzt aktualisiert am              | updatedAt       | Last updated at                 |
|                         | Zuletzt aktualisiert von             | updatedBy       | Last updated by                 |

### 2.3 Oberfläche-Konfiguration

**Beispieldaten eingeben:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Konfigurieren Sie Verknüpfungsregeln, um den Gesamtpreis und die Restzahlung automatisch zu berechnen:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Erstellen Sie einen Ansichtsblock, bestätigen Sie die Daten und aktivieren Sie die Aktion „Vorlagendruck“:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Vorlagendruck-Plugin-Konfiguration

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Fügen Sie eine Vorlagenkonfiguration hinzu, z. B. „Liefer- und Kaufvertrag“:

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Als Nächstes wechseln wir zum Tab „Feldliste“, wo wir alle Felder des aktuellen Objekts sehen können. Nachdem wir auf „Kopieren“ geklickt haben, können wir mit dem Ausfüllen der Vorlage beginnen.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Vertragsdatei-Vorbereitung

**Word-Vertragsvorlagendatei**

Bereiten Sie die Vertragsvorlage (.docx-Datei) im Voraus vor, zum Beispiel: `SUPPLY AND PURCHASE CONTRACT.docx`

In diesem Beispiel stellen wir eine vereinfachte Version des „Liefer- und Kaufvertrags“ zur Verfügung, die Beispiel-Platzhalter enthält:

- `{d.contract_no}`: Vertragsnummer
- `{d.buyer.party_name}`, `{d.seller.party_name}`: Namen von Käufer und Verkäufer
- `{d.total_amount}`: Gesamtvertragssumme
- Und weitere Platzhalter wie „Ansprechpartner“, „Adresse“, „Telefon“ usw.

Als Nächstes können Sie die Felder aus Ihrer Sammlung kopieren und in Word einfügen.

---

## 3. Vorlagenvariablen-Tutorial

### 3.1 Füllen von Basisvariablen und Eigenschaften assoziierter Objekte

**Füllen von Basisfeldern:**

Zum Beispiel die Vertragsnummer oben oder das Objekt der vertragsunterzeichnenden Einheit. Wir klicken auf „Kopieren“ und fügen es direkt in den entsprechenden leeren Bereich im Vertrag ein.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Datenformatierung

#### Datumsformatierung

In Vorlagen müssen wir Felder oft formatieren, insbesondere Datumsfelder. Das direkt kopierte Datumsformat ist normalerweise lang (z. B. Wed Jan 01 2025 00:00:00 GMT) und muss formatiert werden, um den gewünschten Stil anzuzeigen.

Für Datumsfelder können Sie die Funktion `formatD()` verwenden, um das Ausgabeformat anzugeben:

```
{Feldname:formatD(Formatierungsstil)}
```

**Beispiel:**

Wenn zum Beispiel das von uns kopierte Originalfeld `{d.created_at}` ist und wir das Datum in das Format `2025-01-01` formatieren müssen, dann ändern Sie dieses Feld wie folgt:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Ausgabe: 2025-01-01
```

**Gängige Datumsformatierungsstile:**

- `YYYY` - Jahr (vierstellig)
- `MM` - Monat (zweistellig)
- `DD` - Tag (zweistellig)
- `HH` - Stunde (24-Stunden-Format)
- `mm` - Minuten
- `ss` - Sekunden

**Beispiel 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Ausgabe: 2025-01-01 14:30:00
```

#### Zahlenformatierung

Angenommen, es gibt ein Betragsfeld, wie z. B. `{d.total_amount}` im Vertrag. Wir können die Funktion `formatN()` verwenden, um Zahlen zu formatieren, indem wir Dezimalstellen und Tausendertrennzeichen angeben.

**Syntax:**

```
{Feldname:formatN(Dezimalstellen, Tausendertrennzeichen)}
```

- **Dezimalstellen**: Sie können angeben, wie viele Dezimalstellen beibehalten werden sollen. Zum Beispiel bedeutet `2` zwei Dezimalstellen.
- **Tausendertrennzeichen**: Geben Sie an, ob ein Tausendertrennzeichen verwendet werden soll, normalerweise `true` oder `false`.

**Beispiel 1: Betrag mit Tausendertrennzeichen und zwei Dezimalstellen formatieren**

```
{d.amount:formatN(2, true)}  // Ausgabe: 1.234,56
```

Dies formatiert `d.amount` auf zwei Dezimalstellen und fügt ein Tausendertrennzeichen hinzu.

**Beispiel 2: Betrag als Ganzzahl ohne Dezimalstellen formatieren**

```
{d.amount:formatN(0, true)}  // Ausgabe: 1.235
```

Dies formatiert `d.amount` als Ganzzahl und fügt ein Tausendertrennzeichen hinzu.

**Beispiel 3: Betrag mit zwei Dezimalstellen, aber ohne Tausendertrennzeichen formatieren**

```
{d.amount:formatN(2, false)}  // Ausgabe: 1234,56
```

Hier wird das Tausendertrennzeichen deaktiviert und nur zwei Dezimalstellen beibehalten.

**Weitere Anforderungen an die Betragsformatierung:**

- **Währungssymbol**: Carbone selbst bietet keine direkten Funktionen zur Formatierung von Währungssymbolen, aber Sie können Währungssymbole direkt in Daten oder Vorlagen hinzufügen. Zum Beispiel:
  ```
  {d.amount:formatN(2, true)} EUR  // Ausgabe: 1.234,56 EUR
  ```

#### Zeichenkettenformatierung

Für Zeichenkettenfelder können Sie `:upperCase` verwenden, um das Textformat, wie z. B. die Groß-/Kleinschreibung, anzugeben.

**Syntax:**

```
{Feldname:upperCase:andere_Befehle}
```

**Gängige Konvertierungsmethoden:**

- `upperCase` - In Großbuchstaben konvertieren
- `lowerCase` - In Kleinbuchstaben konvertieren
- `upperCase:ucFirst` - Ersten Buchstaben großschreiben

**Beispiel:**

```
{d.party_a_signatory_name:upperCase}  // Ausgabe: JOHN DOE
```

### 3.3 Schleifendruck

#### Wie man Listen von untergeordneten Objekten (z. B. Produktdetails) druckt

Wenn wir eine Tabelle mit mehreren Unterpositionen (z. B. Produktdetails) drucken müssen, verwenden wir in der Regel den Schleifendruck. Auf diese Weise generiert das System für jede Position in der Liste eine Zeile Inhalt, bis alle Positionen durchlaufen wurden.

Angenommen, wir haben eine Produktliste (z. B. `contract_items`), die mehrere Produktobjekte enthält. Jedes Produktobjekt hat mehrere Attribute, wie Produktname, Spezifikation, Menge, Einzelpreis, Gesamtbetrag und Anmerkungen.

**Schritt 1: Felder in der ersten Tabellenzeile ausfüllen**

Zuerst kopieren und füllen wir in der ersten Zeile der Tabelle (nicht im Header) direkt die Vorlagenvariablen aus. Diese Variablen werden durch die entsprechenden Daten ersetzt und in der Ausgabe angezeigt.

Zum Beispiel sieht die erste Zeile der Tabelle wie folgt aus:

| Produktname | Spezifikation / Modell | Menge | Einzelpreis | Gesamtbetrag | Anmerkung |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Hier stellt `d.contract_items[i]` die i-te Position in der Produktliste dar, und `i` ist ein Index, der die Reihenfolge des aktuellen Produkts angibt.

**Schritt 2: Index in der zweiten Zeile ändern**

Als Nächstes ändern wir in der zweiten Zeile der Tabelle den Feldindex auf `i+1` und füllen nur das erste Attribut aus. Dies liegt daran, dass wir beim Schleifendruck die nächste Datenposition aus der Liste abrufen und in der nächsten Zeile anzeigen müssen.

Zum Beispiel wird die zweite Zeile wie folgt ausgefüllt:
| Produktname | Spezifikation / Modell | Menge | Einzelpreis | Gesamtbetrag | Anmerkung |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

In diesem Beispiel haben wir `[i]` in `[i+1]` geändert, sodass wir die nächsten Produktdaten in der Liste abrufen können.

**Schritt 3: Automatischer Schleifendruck während der Vorlagenwiedergabe**

Wenn das System diese Vorlage verarbeitet, wird es nach folgender Logik vorgehen:

1. Die erste Zeile wird entsprechend den von Ihnen in der Vorlage festgelegten Feldern ausgefüllt.
2. Anschließend löscht das System automatisch die zweite Zeile und beginnt, Daten aus `d.contract_items` zu extrahieren, wobei jede Zeile im Tabellenformat zyklisch gefüllt wird, bis alle Produktdetails gedruckt sind.

Das `i` in jeder Zeile wird inkrementiert, um sicherzustellen, dass jede Zeile unterschiedliche Produktinformationen anzeigt.

---

## 4. Vertrags-Vorlage hochladen und konfigurieren

### 4.1 Vorlage hochladen

1. Klicken Sie auf die Schaltfläche „Vorlage hinzufügen“ und geben Sie den Vorlagennamen ein, z. B. „Liefer- und Kaufvertragsvorlage“.
2. Laden Sie die vorbereitete [Word-Vertragsdatei (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) hoch, die bereits alle Platzhalter enthält.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Nach Abschluss listet das System die Vorlage in der Liste der optionalen Vorlagen zur späteren Verwendung auf.
4. Wir klicken auf „Verwenden“, um diese Vorlage zu aktivieren.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Verlassen Sie an dieser Stelle das aktuelle Pop-up und klicken Sie auf „Vorlage herunterladen“, um die generierte vollständige Vorlage zu erhalten.

**Tipps:**

- Wenn die Vorlage `.doc` oder andere Formate verwendet, muss sie möglicherweise in `.docx` konvertiert werden, abhängig von der Plugin-Unterstützung.
- Achten Sie in Word-Dateien darauf, Platzhalter nicht in mehrere Absätze oder Textfelder aufzuteilen, um Rendering-Fehler zu vermeiden.

---

Viel Erfolg bei der Nutzung! Mit der Funktion „Vorlagendruck“ können Sie im Vertragsmanagement erheblich repetitive Arbeit sparen, manuelle Kopier- und Einfügefehler vermeiden und eine standardisierte sowie automatisierte Vertragsausgabe erreichen.