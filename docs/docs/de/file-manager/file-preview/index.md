---
pkg: '@nocobase/plugin-file-manager'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datei-Vorschau

In Oberflächen mit Dateifeldern, einschließlich Anhangsfeldern, können Sie Dateien anzeigen, indem Sie auf die Miniaturansicht oder das Symbol der Datei klicken. Die integrierte Vorschaufunktion unterstützt verschiedene Dateitypen, darunter Bilder, PDFs und die meisten Dateitypen, die Browser nativ unterstützen.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Für Dateitypen ohne native Vorschau können Sie entsprechende Datei-Vorschau-Plugins installieren oder erweitern. Nach der Installation des Office-Datei-Vorschau-Plugins können Sie beispielsweise Word-, Excel- und PowerPoint-Dateien anzeigen.

Derzeit stellt NocoBase die folgenden Datei-Vorschau-Plugins bereit:

* Office-Datei-Vorschau-Plugin

## PDF-Vorschau mit externem Speicher

Die PDF-Vorschau verwendet PDF.js, um Dateien im Browser zu rendern. Der Browser muss zuerst den Inhalt der PDF-Datei lesen und ihn anschließend an PDF.js zum Rendern übergeben. Wenn Dateien daher in externem Speicher wie OSS, S3, COS oder einem CDN gespeichert sind und die Zugriffsdomäne der Datei von der NocoBase-Site-Domäne abweicht, muss der externe Speicher der NocoBase-Site das domänenübergreifende Lesen von Dateien erlauben.

Wenn CORS nicht konfiguriert ist, kann der PDF-Download weiterhin normal funktionieren, die Vorschau kann jedoch mit einem Fehler beim Laden der Datei fehlschlagen.

Die CORS-Konfiguration für externen Speicher oder CDN sollte Folgendes enthalten:

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin` sollte auf die tatsächliche Domäne gesetzt werden, über die NocoBase aufgerufen wird. Vermeiden Sie bei nicht öffentlichen Dateien langfristig die Verwendung von `*`, da dies den Kreis der Websites erweitert, die die Dateien lesen können.
