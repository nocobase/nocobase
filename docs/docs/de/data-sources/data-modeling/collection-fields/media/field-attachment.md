---
title: "Anhang-Feld"
description: "Anhang-Feld zur Verknüpfung mit der Dateitabelle und zum Speichern von Bildern, Dokumenten und anderen Dateien."
keywords: "Anhang-Feld,field-attachment,Dateiverknüpfung,Bilder,Dokumente,NocoBase"
---

# Anhang-Feld

## Einführung

Das System verfügt über einen integrierten Feldtyp „Anhang“, mit dem Benutzer in benutzerdefinierten Datentabellen Dateien hochladen können.

Das Anhang-Feld basiert auf einem Viele-zu-viele-Beziehungsfeld und verweist auf die integrierte Dateitabelle „Anhänge“ (`attachments`). Nachdem in einer Datentabelle ein Anhang-Feld erstellt wurde, wird automatisch eine Zwischentabelle für die Viele-zu-viele-Beziehung mit der Anhang-Tabelle angelegt. Die Metadaten der hochgeladenen Dateien werden in der Tabelle „Anhänge“ gespeichert. Die in der Datentabelle referenzierten Dateiinformationen werden über diese Zwischentabelle verknüpft.

## Feldkonfiguration

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Einschränkung der MIME-Typen

Dient dazu, die zulässigen Dateitypen für Uploads einzuschränken. Verwenden Sie zur Beschreibung des Formats die [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-Syntax. Beispiel: `image/*` steht für Bilddateien. Mehrere Typen können durch englische Kommas getrennt werden, z. B.: `image/*,application/pdf` steht für die Zulassung von Bilddateien und PDF-Dateien.

### Speicher-Engine

Wählen Sie die Speicher-Engine aus, die zum Speichern hochgeladener Dateien verwendet werden soll. Wenn Sie keine Auswahl treffen, wird die standardmäßige Speicher-Engine des Systems verwendet.