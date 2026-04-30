# CRM-Sales-Pipeline visualisieren

## 1. Einleitung

### 1.1 Vorwort

Dieses Kapitel ist Teil 2 der Reihe [Lead-Konvertierung in NocoBase umsetzen](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase). Im vorigen Teil haben wir die Grundlagen der Lead-Konvertierung behandelt: Anlage der benötigten Collections, Konfiguration der Datenverwaltungsseiten und die Konvertierung von Leads in Unternehmen, Kontakt und Opportunity. In diesem Kapitel konzentrieren wir uns auf das Lead-Follow-up und die Statusverwaltung.

[Die NocoBase CRM-Lösung ist offiziell verfügbar! Jetzt ausprobieren](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 Ziel dieses Kapitels

In diesem Kapitel lernen Sie, wie Sie in NocoBase die CRM-Lead-Konvertierung umsetzen. Lead-Follow-up und Statusverwaltung steigern die Effizienz und ermöglichen feinere Vertriebssteuerung.

### 1.3 Vorschau auf das Endergebnis

Im vorherigen Kapitel haben wir die Verknüpfung zwischen Lead, Unternehmen, Kontakt und Opportunity beleuchtet. Jetzt fokussieren wir das Lead-Modul - speziell Follow-up und Statusverwaltung. Hier eine Demo:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Struktur der Lead-Collection

### 2.1 Vorstellung der Lead-Collection

Im Lead-Follow-up spielt das Statusfeld (status) eine zentrale Rolle - es zeigt nicht nur den Fortschritt (Unqualifiziert, Neu, In Bearbeitung, Nurturing, Im Deal, Erledigt), sondern steuert auch die Anzeige des Formulars. Die folgenden Felder beschreiben die Lead-Collection:


| Field name     | Anzeigename        | Field interface  | Beschreibung                                                                                          |
| -------------- | ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Primärschlüssel                                                                                       |
| account_id     | **account_id**     | Integer          | Fremdschlüssel zur Unternehmens-Tabelle                                                               |
| contact_id     | **contact_id**     | Integer          | Fremdschlüssel zur Kontakt-Tabelle                                                                    |
| opportunity_id | **opportunity_id** | Integer          | Fremdschlüssel zur Opportunity-Tabelle                                                                |
| name           | **Lead-Name**      | Single line text | Name des potenziellen Kunden                                                                          |
| company        | **Firmenname**     | Single line text | Unternehmen des potenziellen Kunden                                                                   |
| email          | **E-Mail**         | Email            | E-Mail-Adresse                                                                                        |
| phone          | **Telefon**        | Phone            | Telefonnummer                                                                                         |
| status         | **Status**         | Single select    | Aktueller Status, Standard „Unqualifiziert" (Unqualifiziert, Neu, In Bearbeitung, Nurturing, ...)     |
| Account        | **Unternehmen**    | Many to one      | Verknüpfung zum Unternehmen                                                                           |
| Contact        | **Kontakt**        | Many to one      | Verknüpfung zum Kontakt                                                                               |
| Opportunity    | **Opportunity**    | Many to one      | Verknüpfung zur Opportunity                                                                           |

## 3. Leads-Tabellenblock und Detailblock anlegen

### 3.1 Hinweise

Zunächst erstellen wir einen Tabellenblock „Leads" für die nötigen Felder. Auf der rechten Seite konfigurieren wir einen Detailblock, der beim Klick auf einen Datensatz die Detailinformationen anzeigt. Konfiguration siehe Abbildung:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Aktions-Buttons konfigurieren

### 4.1 Überblick

Insgesamt benötigen wir 10 Buttons. Jeder reagiert je nach Status (status) anders (versteckt, aktiv oder deaktiviert) und führt den Anwender so durch den Prozess.
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 Detaillierte Konfiguration der Buttons


| Button                        | Style                                | Aktion                                                                          | Linkage-Regel                                                                                                                       |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Bearbeiten                    | Bearbeitungsaktion                   | -                                                                               | Bei Status „Completed" automatisch deaktivieren.                                                                                    |
| Unqualifiziert (aktiv)        | „Unqualified >"                      | Status auf „Unqualified" setzen.                                                | Standardmäßig sichtbar; bei „Completed" deaktivieren.                                                                               |
| Neuer Lead (inaktiv)          | Update-Aktion, „New >"               | Status auf „New" setzen, Erfolgshinweis anzeigen.                               | Wenn Status nicht „Unqualified" ist, ausblenden (d. h. bei „New" oder später aktiv).                                                |
| Neuer Lead (aktiv)            | Update-Aktion, „New >"               | Status auf „New" setzen.                                                        | Bei „Unqualified" ausblenden; bei „Completed" deaktivieren.                                                                         |
| In Bearbeitung (inaktiv)      | Update-Aktion, „Working >"           | Status auf „Working" setzen, Hinweis anzeigen.                                  | Wenn Status nicht „Unqualified" oder „New" ist, ausblenden.                                                                         |
| In Bearbeitung (aktiv)        | Update-Aktion, „Working >"           | Status auf „Working" setzen.                                                    | Bei „Unqualified", „New" ausblenden; bei „Completed" deaktivieren.                                                                  |
| Nurturing (inaktiv)           | Update-Aktion, „Nurturing >"         | Status auf „Nurturing" setzen, Hinweis anzeigen.                                | Wenn Status nicht „Unqualified", „New", „Working" ist, ausblenden.                                                                  |
| Nurturing (aktiv)             | Update-Aktion, „Nurturing >"         | Status auf „Nurturing" setzen.                                                  | Bei „Unqualified", „New", „Working" ausblenden; bei „Completed" deaktivieren.                                                       |
| Konvertieren                  | Bearbeitungsaktion „transfer", ✔   | Konvertierungsformular öffnen, Status nach Submit auf „Completed" setzen.       | Bei „Completed" ausblenden, um Mehrfachübertragungen zu vermeiden.                                                                  |
| Konvertierung abgeschl. (akt.)| Anzeigeaktion „transfered", ✔      | Nur Anzeige, keine Bearbeitung.                                                 | Nur bei „Completed" sichtbar; sonst ausblenden.                                                                                     |

- Beispiele für Linkage-Regeln:
  In Bearbeitung (inaktiv)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  In Bearbeitung (aktiv)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- Konvertierungsformular:
  Konvertieren-Button (inaktiv)
  ![](https://static-docs.nocobase.com/20250226094223.png)
  Konvertieren-Button (aktiv)
  ![](https://static-docs.nocobase.com/20250226094203.png)
- Hinweis nach Konvertierungs-Submit:
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 Zusammenfassung Button-Konfiguration

- Pro Funktion gibt es einen inaktiven und einen aktiven Style.
- Linkage-Regeln steuern abhängig vom Status dynamisch Sichtbarkeit (verstecken oder deaktivieren).

## 5. Linkage-Regeln im Formular

### 5.1 Regel 1: Nur Name anzeigen

- Wenn der Datensatz noch nicht bestätigt ist, zeige nur den Namen.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Regel 2: Anzeige bei Status „Neu"

- Bei Status „Neu" wird der Firmenname ausgeblendet, dafür Kontaktdaten angezeigt.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Markdown- und Handlebars-Regeln auf der Seite

### 6.1 Dynamische Texte

Wir nutzen Handlebars, um abhängig vom Status verschiedene Hinweise anzuzeigen. Beispiele:

Status „Unqualifiziert":

```markdown
{{#if (eq $nRecord.status "Unqualifiziert")}}
**Behalten Sie unqualifizierte Leads im Blick.**  
Wenn Leads kein Interesse mehr am Produkt haben oder das Unternehmen verlassen haben, sind sie unqualifiziert.  
- Erfahrungen für die Zukunft festhalten  
- Outreach-Daten und Kontakte sichern  
{{/if}}
```

Status „Neu":

```markdown
{{#if (eq $nRecord.status "Neu")}}
**Sammeln Sie weitere Informationen zu diesem Lead.**  
- Bedarf und Interessen verstehen
- Grundlegende Kontakt- und Unternehmensdaten erfassen
- Priorität und Vorgehensweise für das Follow-up festlegen
{{/if}}
```

Status „In Bearbeitung":

```markdown
{{#if (eq $nRecord.status "In Bearbeitung")}}
**Aktiv kontaktieren und Bedarf erfassen.**  
- Per Telefon/E-Mail Kontakt aufnehmen
- Probleme und Herausforderungen verstehen
- Ersteinschätzung der Passung zu Produkten/Services
{{/if}}
```

Status „Nurturing":

```markdown
{{#if (eq $nRecord.status "Nurturing")}}
**Bedarf vertiefen und den Lead pflegen.**  
- Produktunterlagen oder Lösungsempfehlungen bereitstellen
- Fragen beantworten, Bedenken ausräumen
- Konvertierungswahrscheinlichkeit bewerten
{{/if}}
```

Status „Konvertierung abgeschlossen":

```markdown
{{#if (eq $nRecord.status "Konvertierung abgeschlossen")}}
**Lead erfolgreich in Kunde überführt.**  
- Erstellung von Unternehmens- und Kontaktdatensatz bestätigen
- Opportunity anlegen und Follow-up planen
- Unterlagen und Kommunikationsverlauf an zuständigen Vertrieb weitergeben
{{/if}}
```

## 7. Verknüpfte Objekte und Sprunglinks nach erfolgter Konvertierung

### 7.1 Verknüpfte Objekte

Nach Konvertierung möchten wir die Objekte (Unternehmen, Kontakt, Opportunity) anzeigen und direkt zu den Detailseiten springen.
Suchen Sie ein beliebiges Detail-Popup (z. B. Unternehmen) und kopieren Sie den Link.
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
Hinweis: Die Zahl nach `filterbytk` steht für die ID des aktuellen Objekts, z. B.:

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 Verknüpfungslinks mit Handlebars erzeugen

Unternehmen:

```markdown
{{#if (eq $nRecord.status "Erledigt")}}
**Unternehmen:**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Kontakt:

```markdown
{{#if (eq $nRecord.status "Erledigt")}}
**Kontakt:**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Opportunity:

```markdown
{{#if (eq $nRecord.status "Erledigt")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Verknüpfte Objekte ausblenden, Werte erhalten

Damit verknüpfte Informationen nach der Konvertierung korrekt angezeigt werden, setzen Sie „Unternehmen", „Kontakt" und „Opportunity" auf „Ausgeblendet (Wert beibehalten)". So sind die Felder nicht sichtbar, ihre Werte bleiben jedoch erhalten und werden weitergegeben.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Statusänderungen nach Konvertierung verhindern

Damit der Status nach der Konvertierung nicht versehentlich geändert wird, ergänzen wir alle Buttons um eine Bedingung: Bei Status „Erledigt" werden alle Buttons deaktiviert.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Schluss

Mit diesen Schritten ist Ihre Lead-Follow-up- und Konvertierungsfunktion fertig! Wir hoffen, Sie verstehen nun klar, wie sich Statusabhängigkeiten in NocoBase realisieren lassen. Viel Erfolg beim Einsatz!
