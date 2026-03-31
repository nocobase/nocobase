:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Daten Hinzufügen

Mit diesem Knoten können Sie einer Sammlung eine neue Datenzeile hinzufügen.

Die Feldwerte für die neue Datenzeile können Variablen aus dem Workflow-Kontext nutzen. Für die Zuweisung von Werten zu Beziehungsfeldern können Sie direkt die entsprechenden Datenvariablen im Kontext referenzieren – entweder als Objekt oder als Fremdschlüsselwert. Wenn Sie keine Variablen verwenden, müssen Sie die Fremdschlüsselwerte manuell eingeben. Bei mehreren Fremdschlüsselwerten in einer N:M-Beziehung müssen diese durch Kommas getrennt werden.

## Knoten Erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol („+“) im Workflow, um den Knoten „Daten Hinzufügen“ hinzuzufügen:

![Knoten 'Daten Hinzufügen' erstellen](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Knotenkonfiguration

![Knoten 'Daten Hinzufügen'_Beispiel_Knotenkonfiguration](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Sammlung

Wählen Sie die Sammlung aus, der Sie neue Daten hinzufügen möchten.

### Feldwerte

Weisen Sie den Feldern der Sammlung Werte zu. Sie können Variablen aus dem Workflow-Kontext verwenden oder statische Werte manuell eingeben.

:::info{title="Hinweis"}
Daten, die über den Knoten „Daten Hinzufügen“ in einem Workflow erstellt werden, verwalten Benutzerdaten wie „Erstellt von“ und „Zuletzt geändert von“ nicht automatisch. Sie müssen die Werte für diese Felder bei Bedarf selbst konfigurieren.
:::

### Beziehungsdaten vorladen

Wenn die Felder der neuen Daten Beziehungsfelder enthalten und Sie die entsprechenden Beziehungsdaten in nachfolgenden Workflow-Schritten verwenden möchten, können Sie die entsprechenden Beziehungsfelder in der Vorladekonfiguration auswählen. Auf diese Weise werden die entsprechenden Beziehungsdaten nach dem Hinzufügen der neuen Daten automatisch geladen und zusammen mit den Ergebnisdaten des Knotens gespeichert.

## Beispiel

Wenn beispielsweise Daten in der Sammlung „Artikel“ hinzugefügt oder aktualisiert werden, soll automatisch ein Datensatz in „Artikelversionen“ erstellt werden, um eine Änderungshistorie des Artikels zu protokollieren. Dies können Sie mit dem Knoten „Daten Hinzufügen“ erreichen:

![Knoten 'Daten Hinzufügen'_Beispiel_Workflow-Konfiguration](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Knoten 'Daten Hinzufügen'_Beispiel_Knotenkonfiguration](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Nachdem Sie den Workflow mit dieser Konfiguration aktiviert haben, wird bei einer Änderung der Daten in der Sammlung „Artikel“ automatisch ein Datensatz in „Artikelversionen“ erstellt, der die Änderungshistorie des Artikels protokolliert.