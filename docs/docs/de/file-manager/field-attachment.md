:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Anlagenfeld

## Einführung

Das System verfügt über einen integrierten Feldtyp „Anhang“, der das Hochladen von Dateien in benutzerdefinierten Sammlungen ermöglicht.

Das Anlagenfeld ist im Grunde ein Viele-zu-Viele-Beziehungsfeld, das auf die systeminterne Sammlung „Attachments“ (`attachments`) verweist. Wenn Sie ein Anlagenfeld in einer Sammlung erstellen, wird automatisch eine Verknüpfungstabelle für die Viele-zu-Viele-Beziehung generiert. Die Metadaten der hochgeladenen Dateien werden in der Sammlung „Attachments“ gespeichert, und die in der Sammlung referenzierten Dateiinformationen werden über diese Verknüpfungstabelle verknüpft.

## Feldkonfiguration

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME-Typ-Beschränkungen

Hier legen Sie fest, welche Dateitypen hochgeladen werden dürfen. Verwenden Sie dazu das [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-Syntaxformat. Zum Beispiel steht `image/*` für Bilddateien. Mehrere Typen können Sie mit einem Komma trennen, wie zum Beispiel: `image/*,application/pdf` erlaubt sowohl Bild- als auch PDF-Dateien.

### Speicher-Engine

Wählen Sie die Speicher-Engine aus, die zum Speichern der hochgeladenen Dateien verwendet werden soll. Wenn Sie keine Auswahl treffen, wird die Standard-Speicher-Engine des Systems verwendet.