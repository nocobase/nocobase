---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/actions/types/bulk-edit).
:::

# Massenbearbeitung

## Einführung

Die Massenbearbeitung eignet sich für Szenarien, in denen Daten flexibel in Stapeln aktualisiert werden müssen. Nach dem Klicken auf die Schaltfläche zur Massenbearbeitung können Sie das Formular zur Massenbearbeitung in einem Popup-Fenster konfigurieren und verschiedene Aktualisierungsstrategien für die Felder festlegen.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Konfiguration der Aktion

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Benutzerhandbuch

### Konfiguration des Formulars zur Massenbearbeitung

1. Fügen Sie eine Schaltfläche zur Massenbearbeitung hinzu.

2. Legen Sie den Umfang der Massenbearbeitung fest: Ausgewählt / Alle, standardmäßig ist „Ausgewählt“ eingestellt.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Fügen Sie ein Formular zur Massenbearbeitung hinzu.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Konfigurieren Sie die zu bearbeitenden Felder und fügen Sie eine Schaltfläche zum Absenden hinzu.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Formularübermittlung

1. Wählen Sie die zu bearbeitenden Datenzeilen aus.

2. Wählen Sie den Bearbeitungsmodus für die Felder aus und geben Sie die zu übermittelnden Werte ein.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=Verfügbare Bearbeitungsmodi}
* **Nicht aktualisieren**: Das Feld bleibt unverändert.
* **Ändern in**: Aktualisiert das Feld auf den übermittelten Wert.
* **Leeren**: Löscht die Daten in diesem Feld.

:::

3. Senden Sie das Formular ab.