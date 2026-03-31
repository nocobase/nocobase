:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Regeln zur Feldverknüpfung

## Einführung

Regeln zur Feldverknüpfung ermöglichen es, den Zustand von Feldern in Formular-/Detail-Blöcken dynamisch an Benutzeraktionen anzupassen. Derzeit unterstützen die folgenden Blöcke Regeln zur Feldverknüpfung:

- [Formular-Block](/interface-builder/blocks/data-blocks/form)
- [Detail-Block](/interface-builder/blocks/data-blocks/details)
- [Unterformular](/interface-builder/fields/specific/sub-form)

## Anwendungsanleitung

### **Formular-Block**

In einem Formular-Block können Regeln zur Feldverknüpfung das Verhalten von Feldern dynamisch an spezifische Bedingungen anpassen:

- **Anzeige/Ausblenden von Feldern steuern**: Entscheiden Sie, ob das aktuelle Feld basierend auf den Werten anderer Felder angezeigt wird.
- **Feld als Pflichtfeld festlegen**: Legen Sie ein Feld unter bestimmten Bedingungen dynamisch als Pflichtfeld oder optionales Feld fest.
- **Wert zuweisen**: Weisen Sie einem Feld basierend auf Bedingungen automatisch einen Wert zu.
- **Spezifiziertes JavaScript ausführen**: Schreiben Sie JavaScript gemäß den Geschäftsanforderungen.

### **Detail-Block**

In einem Detail-Block werden Regeln zur Feldverknüpfung hauptsächlich verwendet, um die Anzeige und das Ausblenden von Feldern im Block dynamisch zu steuern.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Attributverknüpfung

### Wert zuweisen

Beispiel: Wenn eine Bestellung als Zusatzbestellung markiert wird, wird der Bestellstatus automatisch auf „Zur Überprüfung ausstehend“ gesetzt.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Pflichtfeld

Beispiel: Wenn der Bestellstatus „Bezahlt“ ist, ist das Feld „Bestellbetrag“ ein Pflichtfeld.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Anzeigen/Ausblenden

Beispiel: Das Zahlungskonto und der Gesamtbetrag werden nur angezeigt, wenn der Bestellstatus „Zahlung ausstehend“ ist.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)