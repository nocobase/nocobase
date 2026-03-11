---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/actions/types/duplicate).
:::

# Duplizieren

## Einführung

Die Duplizieren-Aktion ermöglicht es Benutzern, basierend auf vorhandenen Daten schnell neue Datensätze zu erstellen. Es werden zwei Duplizierungsmodi unterstützt: **Direktes Duplizieren** und **In Formular duplizieren und weiter ausfüllen**.

## Installation

Dies ist ein integriertes Plugin, eine separate Installation ist nicht erforderlich.

## Duplizierungsmodus

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Direktes Duplizieren

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Wird standardmäßig als „Direktes Duplizieren“ ausgeführt;
- **Vorlagenfelder**: Geben Sie die zu duplizierenden Felder an. „Alle auswählen“ wird unterstützt. Dies ist eine erforderliche Konfiguration.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Klicken Sie nach der Konfiguration auf die Schaltfläche, um die Daten zu duplizieren.

### In Formular duplizieren und weiter ausfüllen

Die konfigurierten Vorlagenfelder werden als **Standardwerte** in das Formular übernommen. Benutzer können diese Werte vor dem Absenden ändern, um die Duplizierung abzuschließen.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Vorlagenfelder konfigurieren**: Nur die ausgewählten Felder werden als Standardwerte übernommen.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Formularfelder synchronisieren

- Analysiert automatisch die im aktuellen Formularblock konfigurierten Felder als Vorlagenfelder;
- Wenn Formularblockfelder später geändert werden (z. B. Anpassung von Komponenten für Beziehungsfelder), müssen Sie die Vorlagenkonfiguration erneut öffnen und auf **Formularfelder synchronisieren** klicken, um die Konsistenz zu gewährleisten.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Die Vorlagendaten werden als Formular-Standardwerte ausgefüllt, und Benutzer können nach der Änderung absenden, um die Duplizierung abzuschließen.


### Zusätzliche Hinweise

#### Duplizieren, Referenzieren, Vorladen

Verschiedene Feldtypen (Beziehungstypen) haben unterschiedliche Verarbeitungslogiken: **Duplizieren / Referenzieren / Vorladen**. Die **Feldkomponente** eines Beziehungsfeldes beeinflusst diese Logik ebenfalls:

- Select / Record Picker: Wird zum **Referenzieren** verwendet
- Sub-Form / Sub-Table: Wird zum **Duplizieren** verwendet

**Duplizieren**

- Reguläre Felder werden dupliziert;
- `hasOne` / `hasMany` können nur dupliziert werden (diese Beziehungen sollten keine Auswahlkomponenten wie Dropdown-Auswahl oder Datensatz-Auswahl verwenden, sondern Sub-Form- oder Sub-Table-Komponenten);
- Das Ändern der Komponente für `hasOne` / `hasMany` wird die Verarbeitungslogik **nicht** ändern (es bleibt beim Duplizieren);
- Bei duplizierten Beziehungsfeldern können alle Unterfelder ausgewählt werden.

**Referenzieren**

- `belongsTo` / `belongsToMany` werden als Referenz behandelt;
- Wenn die Feldkomponente von „Dropdown-Auswahl“ auf „Sub-Form“ geändert wird, wechselt die Beziehung von **Referenzieren zu Duplizieren** (sobald sie zu Duplizieren wird, sind alle Unterfelder auswählbar).

**Vorladen**

- Beziehungsfelder unter einem Referenzfeld werden als Vorladen behandelt;
- Vorladungsfelder können nach einer Komponentenänderung zu Referenzieren oder Duplizieren werden.

#### Alle auswählen

- Wählt alle **Duplizierungsfelder** und **Referenzfelder** aus.

#### Die folgenden Felder werden aus dem als Datenvorlage ausgewählten Datensatz herausgefiltert:

- Primärschlüssel von duplizierten Beziehungsdaten werden gefiltert; Primärschlüssel für Referenzieren und Vorladen werden nicht gefiltert;
- Fremdschlüssel;
- Felder, die keine Duplikate zulassen (Eindeutig);
- Sortierfelder;
- Automatische Kodierungsfelder (Sequence);
- Passwort;
- Erstellt von, Erstellt am;
- Zuletzt aktualisiert von, Aktualisiert am.

#### Formularfelder synchronisieren

- Analysiert automatisch die im aktuellen Formularblock konfigurierten Felder in Vorlagenfelder;
- Nach dem Ändern von Formularblockfeldern (z. B. Anpassung von Komponenten für Beziehungsfelder) müssen Sie erneut synchronisieren, um die Konsistenz zu gewährleisten.