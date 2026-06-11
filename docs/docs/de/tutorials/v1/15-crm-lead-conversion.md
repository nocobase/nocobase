# CRM-Lead-Konvertierung umsetzen

## 1. Einleitung

Dieses Tutorial führt Sie Schritt für Schritt durch die Implementierung der CRM-Funktion zur Opportunity-Konvertierung in NocoBase. Wir zeigen, wie Sie die benötigten Collections (Datentabellen) anlegen, Datenverwaltungsseiten konfigurieren, den Konvertierungsprozess gestalten und die Verknüpfungsverwaltung einrichten, damit Sie den gesamten Geschäftsprozess reibungslos abbilden können.

[Die NocoBase CRM-Lösung ist offiziell verfügbar! Jetzt ausprobieren](https://www.nocobase.com/cn/blog/crm-solution)

## 2. Vorbereitung: Benötigte Collections anlegen

Bevor wir starten, legen wir vier Collections an und konfigurieren ihre Beziehungen.

### 2.1 LEAD-Collection (Lead)

Diese Collection speichert Informationen über potenzielle Kunden. Felddefinitionen:


| Field name     | Anzeigename        | Field interface  | Beschreibung                                                                          |
| -------------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Primärschlüssel                                                                       |
| account_id     | **account_id**     | Integer          | Fremdschlüssel ACCOUNT                                                                |
| contact_id     | **contact_id**     | Integer          | Fremdschlüssel CONTACT                                                                |
| opportunity_id | **opportunity_id** | Integer          | Fremdschlüssel OPPORTUNITY                                                            |
| name           | **Lead-Name**      | Single line text | Name des potenziellen Kunden                                                          |
| company        | **Firmenname**     | Single line text | Unternehmen des potenziellen Kunden                                                   |
| email          | **E-Mail**         | Email            | E-Mail-Adresse                                                                        |
| phone          | **Telefon**        | Phone            | Telefonnummer                                                                         |
| status         | **Status**         | Single select    | Aktueller Status (Unqualifiziert, Neu, In Bearbeitung, Nurturing, Im Deal, Erledigt)  |
| Account        | **Unternehmen**    | Many to one      | Verknüpfung zur Unternehmens-Collection                                               |
| Contact        | **Kontakt**        | Many to one      | Verknüpfung zur Kontakt-Collection                                                    |
| Opportunity    | **Opportunity**    | Many to one      | Verknüpfung zur Opportunity-Collection                                                |

### 2.2 ACCOUNT-Collection (Unternehmen)

Speichert Detailinformationen zu Unternehmen:


| Field name | Anzeigename     | Field interface  | Beschreibung                                |
| ---------- | --------------- | ---------------- | ------------------------------------------- |
| name       | **Name**        | Single line text | Name des Unternehmens oder der Organisation |
| industry   | **Branche**     | Single select    | Branche des Unternehmens                    |
| phone      | **Telefon**     | Phone            | Telefonnummer des Unternehmens              |
| website    | **Webseite**    | URL              | Offizielle Webseite                         |

### 2.3 CONTACT-Collection (Kontakt)

Speichert Kontaktdaten:


| Field name | Anzeigename | Field interface  | Beschreibung           |
| ---------- | ----------- | ---------------- | ---------------------- |
| name       | **Name**    | Single line text | Name des Kontakts      |
| email      | **E-Mail**  | Email            | E-Mail-Adresse         |
| phone      | **Telefon** | Phone            | Telefonnummer          |

### 2.4 OPPORTUNITY-Collection (Opportunity)

Speichert Opportunity-Informationen:


| Field name | Anzeigename     | Field interface  | Beschreibung                                                                  |
| ---------- | --------------- | ---------------- | ----------------------------------------------------------------------------- |
| name       | **Name**        | Single line text | Name der Opportunity                                                          |
| stage      | **Phase**       | Single select    | Aktuelle Phase (Qualifizierung, Bedarf, Angebot, Verhandlung, Abschluss, ...) |
| amount     | **Betrag**      | Number           | Wert der Opportunity                                                          |
| close_date | **Abschluss**   | Datetime         | Erwartetes Abschlussdatum                                                     |

## 3. Konvertierungsprozess verstehen

### 3.1 Übersicht des Standardprozesses

Eine Opportunity durchläuft auf dem Weg vom Lead zur formalen Opportunity üblicherweise folgenden Prozess:

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 Verknüpfungsbeziehungen

Wir gehen davon aus, dass Sie die vier Collections erfolgreich angelegt und ihre Geschäftsbeziehungen konfiguriert haben:

![Verknüpfungen](https://static-docs.nocobase.com/20250225090913.png)

## 4. Datenverwaltungsseiten anlegen

Erstellen Sie im NocoBase-Workspace für jede Collection eine Datenverwaltungsseite und legen Sie einige Test-Leads an, um später testen zu können.

![Datenverwaltungsseiten](https://static-docs.nocobase.com/20250224234721.png)

## 5. Opportunity-Konvertierung umsetzen

In diesem Kapitel zeigen wir, wie Sie einen Lead in Unternehmens-, Kontakt- und Opportunity-Daten überführen und sicherstellen, dass die Konvertierung nicht mehrfach ausgelöst wird.

### 5.1 Bearbeitungsaktion „Konvertieren" anlegen

Erstellen Sie in der Lead-Detailansicht eine Bearbeitungsaktion namens „Konvertieren". Konfigurieren Sie das Konvertierungs-Popup wie folgt:

#### 5.1.1 Lead-Basisinformationen anzeigen

Zeigen Sie die Lead-Informationen schreibgeschützt an, damit Originaldaten nicht versehentlich geändert werden.

#### 5.1.2 Verknüpfungsfelder anzeigen

Zeigen Sie im Popup die drei Verknüpfungsfelder an und aktivieren Sie für jedes die Funktion „Schnell anlegen", damit fehlende Datensätze direkt angelegt werden können.

![Verknüpfungsfelder](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 Standard-Mapping für Schnell anlegen konfigurieren

Konfigurieren Sie in den Einstellungen von „Schnell anlegen" Standardwerte, damit Lead-Daten automatisch in das Ziel-Collection übernommen werden:

- Lead/Lead-Name → Unternehmen/Name
- Lead/E-Mail → Unternehmen/E-Mail
- Lead/Telefon → Unternehmen/Telefon
- Lead/Lead-Name → Kontakt/Name
- Lead/E-Mail → Kontakt/E-Mail
- Lead/Telefon → Kontakt/Telefon
- Lead/Lead-Name → Opportunity/Name
- Lead/Status → Opportunity/Phase

Beispielkonfiguration:

![Standard-Mapping 1](https://static-docs.nocobase.com/20250225000218.png)

Anschließend ergänzen wir noch eine freundliche Rückmeldung beim Senden:
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

Resultat:
![Standard-Mapping 2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 Konvertierung in Aktion

Beim Ausführen der Konvertierung legt das System anhand des Mappings neue Datensätze an und verknüpft sie. Beispiele:

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 Mehrfachkonvertierung verhindern

Damit ein Lead nicht mehrfach konvertiert wird, können Sie folgende Schritte einrichten:

#### 5.2.1 Lead-Status aktualisieren

Erweitern Sie die Submit-Aktion des Konvertierungsformulars um eine automatische Datenaktualisierung, die den Lead-Status auf „Konvertiert" setzt.

Konfiguration:

![Statusaktualisierung 1](https://static-docs.nocobase.com/20250225001758.png)
![Statusaktualisierung 2](https://static-docs.nocobase.com/20250225001817.png)
Demo:
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 Linkage-Regeln für den Button

Fügen Sie für den Konvertierungs-Button eine Linkage-Regel hinzu: Sobald der Lead-Status „Konvertiert" ist, wird der Button automatisch ausgeblendet.

Konfiguration:

![Button-Linkage 1](https://static-docs.nocobase.com/20250225001838.png)
![Button-Linkage 2](https://static-docs.nocobase.com/20250225001939.png)
![Button-Linkage 3](https://static-docs.nocobase.com/20250225002026.png)

## 6. Verknüpfungsverwaltung in den Detailseiten

Damit Anwender in den Detailseiten der Collections verknüpfte Daten sehen, konfigurieren Sie entsprechende Listen- oder Detailblöcke.

### 6.1 Detailseite des Unternehmens

Fügen Sie in der Detailansicht eines Unternehmens (z. B. im Bearbeiten-/Detail-Popup) folgende Listen hinzu:

- Kontaktliste
- Opportunity-Liste
- Lead-Liste

Beispiel:

![Detailseite Unternehmen](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 Filterbedingungen ergänzen

Ergänzen Sie pro Liste Filterregeln, damit jeweils nur Datensätze mit der aktuellen Unternehmens-ID angezeigt werden.

Konfiguration:

![Filter 1](https://static-docs.nocobase.com/20250225085513.png)
![Filter 2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 Detailseiten von Kontakt und Opportunity

Fügen Sie in der Detailansicht eines Kontakts folgende Blöcke hinzu:

- Opportunity-Liste
- Unternehmensdetails
- Lead-Liste (gefiltert nach ID)

Screenshot:

![Kontaktdetails](https://static-docs.nocobase.com/20250225090231.png)

In der Detailansicht einer Opportunity ebenfalls:

- Kontaktliste
- Unternehmensdetails
- Lead-Liste (gefiltert nach ID)

Screenshot:

![Opportunity-Details](https://static-docs.nocobase.com/20250225091208.png)

## 7. Zusammenfassung

Mit den obigen Schritten haben Sie eine einfache CRM-Konvertierung umgesetzt und Verknüpfungsverwaltung zwischen Kontakten, Unternehmen und Leads konfiguriert. Wir hoffen, dieses Tutorial hilft Ihnen, den gesamten Geschäftsprozess klar und strukturiert nachzubauen und Ihrem Projekt zu mehr Effizienz zu verhelfen.

---

Bei Fragen während der Umsetzung können Sie das [NocoBase Community-Forum](https://forum.nocobase.com) besuchen oder die [offizielle Dokumentation](https://docs-cn.nocobase.com) konsultieren. Viel Erfolg bei Ihrem Projekt!
