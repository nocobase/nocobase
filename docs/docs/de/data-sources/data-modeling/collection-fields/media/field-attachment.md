:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Anhangsfeld

## Einführung

Das System verfügt über einen integrierten Feldtyp "Anhang", der das Hochladen von Dateien in benutzerdefinierten Sammlungen unterstützt.

Im Hintergrund ist das Anhangsfeld ein Viele-zu-Viele-Beziehungsfeld, das auf die systeminterne Sammlung "Anhänge" (`attachments`) verweist. Wenn Sie in einer beliebigen Sammlung ein Anhangsfeld erstellen, wird automatisch eine Viele-zu-Viele-Verknüpfungstabelle generiert. Die Metadaten der hochgeladenen Dateien werden in der Sammlung "Anhänge" gespeichert, und die in Ihrer Sammlung referenzierten Dateiinformationen werden über diese Verknüpfungstabelle verknüpft.

## Feldkonfiguration

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME-Typ-Beschränkung

Hiermit können Sie die Dateitypen einschränken, die hochgeladen werden dürfen. Die Beschreibung des Formats erfolgt mithilfe der [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-Syntax. Zum Beispiel steht `image/*` für Bilddateien. Mehrere Typen können durch Kommas getrennt werden, z. B. `image/*,application/pdf`, was sowohl Bild- als auch PDF-Dateien zulässt.

### Speicher-Engine

Wählen Sie die Speicher-Engine aus, die zum Speichern der hochgeladenen Dateien verwendet werden soll. Wenn Sie keine Auswahl treffen, wird die Standard-Speicher-Engine des Systems verwendet.