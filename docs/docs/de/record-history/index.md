---
pkg: '@nocobase/plugin-record-history'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Historie

## Einführung

Das **Historie-Plugin** dient dazu, Datenänderungen zu verfolgen, indem es automatisch Schnappschüsse und Differenzen von Erstellungs-, Änderungs- und Löschvorgängen speichert. Es hilft Benutzern, Datenänderungen schnell nachzuvollziehen und Vorgänge zu prüfen.

![](https://static-docs.nocobase.com/202511011338499.png)

## Historie aktivieren

### Sammlungen und Felder hinzufügen

Gehen Sie zunächst zur Konfigurationsseite des Historie-Plugins, um die Sammlungen und Felder hinzuzufügen, für die Sie den Änderungsverlauf aufzeichnen möchten. Um die Effizienz der Aufzeichnung zu verbessern und Datenredundanz zu vermeiden, empfehlen wir, nur die wesentlichen Sammlungen und Felder zu konfigurieren. Felder wie **eindeutige ID**, **Erstellungsdatum**, **Aktualisierungsdatum**, **Erstellt von** und **Aktualisiert von** müssen in der Regel nicht aufgezeichnet werden.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Historische Daten-Schnappschüsse synchronisieren

- Für Daten, die vor der Aktivierung der Historie erstellt wurden, können Änderungen erst nach der ersten Aktualisierung, die einen Schnappschuss erzeugt, aufgezeichnet werden; daher hinterlässt die erste Aktualisierung oder Löschung keinen Verlauf.
- Um den Verlauf bestehender Daten zu erhalten, können Sie eine einmalige Schnappschuss-Synchronisierung durchführen.
- Die Größe eines Schnappschusses pro Sammlung berechnet sich wie folgt: Anzahl der Datensätze × Anzahl der zu verfolgenden Felder.
- Bei großen Datenmengen empfiehlt es sich, den Datenbereich zu filtern und nur wichtige Datensätze zu synchronisieren.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Klicken Sie auf die Schaltfläche „Historische Schnappschüsse synchronisieren“, konfigurieren Sie die zu synchronisierenden Felder und den Datenbereich, und starten Sie die Synchronisierung.

![](https://static-docs.nocobase.com/202511011320958.png)

Die Synchronisierungsaufgabe wird in den Hintergrund verschoben und dort ausgeführt. Sie können die Liste aktualisieren, um den Abschlussstatus zu überprüfen.

## Den Historie-Block verwenden

### Einen Block hinzufügen

Wählen Sie den **Historie-Block** und eine Sammlung aus, um den entsprechenden Historie-Block zu Ihrer Seite hinzuzufügen.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Wenn Sie einen Historie-Block in einem Detail-Pop-up eines Datensatzes hinzufügen, können Sie „Aktueller Datensatz“ auswählen, um den Verlauf speziell für diesen Datensatz anzuzeigen.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Beschreibungsvorlagen bearbeiten

Klicken Sie in den Blockeinstellungen auf „Vorlage bearbeiten“, um den Beschreibungstext für die Vorgangsaufzeichnungen zu konfigurieren.

![](https://static-docs.nocobase.com/202511011340406.png)

Derzeit können Sie separate Beschreibungsvorlagen für **Erstellungs-**, **Aktualisierungs-** und **Löschvorgänge** konfigurieren. Für Aktualisierungen können Sie auch die Beschreibungsvorlage für Feldänderungen konfigurieren, entweder als eine einzige Vorlage für alle Felder oder für bestimmte Felder individuell.

![](https://static-docs.nocobase.com/202511011346400.png)

Beim Konfigurieren des Textes können Variablen verwendet werden.

![](https://static-docs.nocobase.com/202511011347163.png)

Nach der Konfiguration können Sie wählen, ob die Vorlage für **Alle Historie-Blöcke der aktuellen Sammlung** oder **Nur diesen Historie-Block** gelten soll.

![](https://static-docs.nocobase.com/202511011348885.png)