# Lead-Follow-up und Statusverwaltung

## 1. Einleitung

### 1.1 Ziel dieses Kapitels

In diesem Kapitel lernen Sie, wie Sie in NocoBase die CRM-Opportunity-Konvertierung umsetzen. Mit Lead-Follow-up und Statusverwaltung steigern Sie die Effizienz und kontrollieren den Vertriebsprozess feiner.

### 1.2 Vorschau auf das Endergebnis

Im vorherigen Kapitel haben wir die Verknüpfung zwischen Lead, Unternehmen, Kontakt und Opportunity erläutert. Jetzt fokussieren wir uns auf das Lead-Modul - speziell auf Follow-up und Statusverwaltung. Hier eine Demo:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Struktur der Lead-Collection

### 2.1 Vorstellung der Lead-Collection

Im Lead-Follow-up spielt das Feld „Status" (status) eine zentrale Rolle - es zeigt nicht nur den aktuellen Fortschritt (Unqualifiziert, Neu, In Bearbeitung, Nurturing, Im Deal, Erledigt), sondern steuert auch das gesamte Formular. Der folgende Tabellenblock stellt die Felder der Lead-Collection vor:


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

## 3. Leads-Tabellenblock und Detailblock anlegen

### 3.1 Hinweise zur Erstellung

Zunächst erstellen wir einen Tabellenblock „Leads" mit den nötigen Feldern. Auf der rechten Seite konfigurieren wir einen Detailblock - klicken Sie auf einen Datensatz, erscheinen rechts die Detailinformationen. Konfiguration siehe Abbildung:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Aktions-Buttons konfigurieren

### 4.1 Überblick

Um alle Operationen abzudecken, erstellen wir insgesamt 11 Buttons. Jeder Button verhält sich abhängig vom Status (status) anders (versteckt, aktiv oder deaktiviert) und führt den Anwender so durch den Prozess.
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Detaillierte Konfiguration der Funktions-Buttons

#### 4.2.1 Bearbeiten-Button

- Linkage-Regel: Wenn der Status „Completed" (Erledigt) ist, wird der Button automatisch deaktiviert, um unnötige Bearbeitungen zu verhindern.

#### 4.2.2 Unqualifiziert Button 1 (inaktiver Style)

- Style: Titel „Unqualified >".
- Aktion: Beim Klick wird der Status auf „Unqualified" aktualisiert; nach erfolgreichem Update kehrt das System zur vorherigen Seite zurück und zeigt einen Erfolgshinweis.
- Linkage-Regel: Nur sichtbar, wenn der Status leer ist; sobald ein Status gesetzt ist, wird der Button automatisch ausgeblendet.

#### 4.2.3 Unqualifiziert Button 2 (aktiver Style)

- Style: Ebenfalls „Unqualified >".
- Aktion: Aktualisiert den Status auf „Unqualified".
- Linkage-Regel: Wenn der Status leer ist, ausblenden; bei Status „Completed" deaktivieren.

#### 4.2.4 Neuer Lead Button 1 (inaktiv)

- Style: Titel „New >".
- Aktion: Beim Klick wird der Status auf „New" gesetzt und ein Erfolgshinweis angezeigt.
- Linkage-Regel: Wenn der Status bereits „New", „Working", „Nurturing" oder „Completed" ist, wird der Button ausgeblendet.

#### 4.2.5 Neuer Lead Button 2 (aktiv)

- Style: Titel „New >".
- Aktion: Setzt den Status auf „New".
- Linkage-Regel: Bei „Unqualified" oder leerem Status ausblenden; bei „Completed" deaktivieren.

#### 4.2.6 In Bearbeitung Button (inaktiv)

- Style: Titel „Working >".
- Aktion: Setzt den Status auf „Working" und zeigt einen Erfolgshinweis.
- Linkage-Regel: Wenn der Status bereits „Working", „Nurturing" oder „Completed" ist, ausblenden.

#### 4.2.7 In Bearbeitung Button (aktiv)

- Style: Titel „Working >".
- Aktion: Setzt den Status auf „Working".
- Linkage-Regel: Bei Status „Unqualified", „New" oder leerem Status ausblenden; bei „Completed" deaktivieren.

#### 4.2.8 Nurturing Button (inaktiv)

- Style: Titel „Nurturing >".
- Aktion: Setzt den Status auf „Nurturing" und zeigt einen Erfolgshinweis.
- Linkage-Regel: Wenn der Status bereits „Nurturing" oder „Completed" ist, ausblenden.

#### 4.2.9 Nurturing Button (aktiv)

- Style: Titel „Nurturing >".
- Aktion: Setzt den Status auf „Nurturing".
- Linkage-Regel: Bei „Unqualified", „New", „Working" oder leerem Status ausblenden; bei „Completed" deaktivieren.

#### 4.2.10 Konvertieren Button

- Style: Titel „transfer", öffnet sich als Modal.
- Aktion: Führt die Datensatzübertragung durch. Nach dem Update öffnet sich ein Drawer mit Tabs und Formular.
- Linkage-Regel: Wenn der Status „Completed" ist, ausblenden, um Mehrfachübertragungen zu vermeiden.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Konvertierung abgeschlossen Button (aktiv)

- Style: Titel „transfered", öffnet sich als Modal.
- Aktion: Zeigt nach Konvertierung Informationen, ohne Bearbeitung.
- Linkage-Regel: Nur bei Status „Completed" sichtbar, sonst ausgeblendet.
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Zusammenfassung Button-Konfiguration

- Jede Funktion hat einen inaktiven und einen aktiven Button-Style.
- Linkage-Regeln steuern abhängig vom Status dynamisch Sichtbarkeit (verstecken oder deaktivieren) und führen so durch den Prozess.

## 5. Linkage-Regeln im Formular

### 5.1 Regel 1: Nur Name anzeigen

- Wenn der Datensatz noch nicht bestätigt ist oder der Status leer ist, wird nur der Name angezeigt.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Regel 2: Anzeigeoptimierung im Status „Neu"

- Bei Status „Neu" wird der Firmenname ausgeblendet und stattdessen die Kontaktdaten angezeigt.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Markdown-Regeln und Handlebars-Syntax auf der Seite

### 6.1 Dynamische Texte

Auf der Seite verwenden wir Handlebars-Syntax, um abhängig vom Status verschiedene Hinweise anzuzeigen. Beispiele:

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
**Identifizieren Sie die für diese Chance benötigten Produkte oder Services.**  
- Kunden-Cases, Referenzen oder Wettbewerbsanalysen sammeln  
- Wichtige Stakeholder bestätigen  
- Verfügbare Ressourcen klären  
{{/if}}
```

Status „In Bearbeitung":

```markdown
{{#if (eq $nRecord.status "In Bearbeitung")}}
**Liefern Sie Ihre Lösung an die Stakeholder.**  
- Wertversprechen kommunizieren  
- Zeitplan und Budget klären  
- Mit dem Kunden festlegen, wann und wie der Abschluss erfolgt  
{{/if}}
```

Status „Nurturing":

```markdown
{{#if (eq $nRecord.status "Nurturing")}}
**Klären Sie die Implementierungsplanung des Kunden.**  
- Vereinbarungen je nach Bedarf treffen  
- Internen Rabattprozess befolgen  
- Unterzeichneten Vertrag einholen  
{{/if}}
```

Status „Konvertierung abgeschlossen":

```markdown
{{#if (eq $nRecord.status "Konvertierung abgeschlossen")}}
**Bestätigen Sie Implementierungsplan und nächste Schritte.**  
- Sicherstellen, dass alle verbleibenden Vereinbarungen und Unterschriften vorliegen  
- Internen Rabattprozess einhalten  
- Vertrag unterzeichnet, Implementierung läuft planmäßig  
{{/if}}
```

## 7. Verknüpfte Objekte und Sprunglinks nach erfolgter Konvertierung

### 7.1 Verknüpfte Objekte

Nach der Konvertierung möchten wir die verknüpften Objekte (Unternehmen, Kontakt, Opportunity) anzeigen und Direktlinks zu deren Detailseiten anbieten. Hinweis: In Popups oder Seiten steht die Zahl nach `filterbytk` für die ID des aktuellen Objekts, z. B.:

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Verknüpfungslinks mit Handlebars erzeugen

Für Unternehmen:

```markdown
{{#if (eq $nRecord.status "Erledigt")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Für Kontakt:

```markdown
{{#if (eq $nRecord.status "Erledigt")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Für Opportunity:

```markdown
{{#if (eq $nRecord.status "Erledigt")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Verknüpfte Objekte ausblenden, Werte erhalten

Damit verknüpfte Informationen nach der Konvertierung korrekt angezeigt werden, setzen Sie „Unternehmen", „Kontakt" und „Opportunity" auf „Ausgeblendet (Wert beibehalten)". So sind die Felder im Formular nicht sichtbar, ihre Werte bleiben jedoch erhalten und werden weitergegeben.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Statusänderungen nach Konvertierung verhindern

Um versehentliche Statusänderungen zu vermeiden, fügen wir allen Buttons eine Bedingung hinzu: Bei Status „Erledigt" werden alle Buttons deaktiviert.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Schluss

Mit diesen Schritten ist die Lead-Follow-up- und Konvertierungsfunktion komplett! Wir hoffen, Sie verstehen nun klar, wie sich Statusabhängigkeiten in NocoBase umsetzen lassen. Viel Erfolg beim Einsatz!
