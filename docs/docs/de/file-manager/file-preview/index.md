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

* [Office-Datei-Vorschau-Plugin](../file-preview/ms-office.md)

## PDF-Vorschau mit externem Speicher

NocoBase zeigt PDFs über ein Browser-iframe an. Einige Browser oder PDF-Reader können Skripte, Formulare oder andere interaktive Inhalte in PDF-Dateien unterstützen. Wenn die Vorschau eine Datei aus einer nicht vertrauenswürdigen Quelle öffnet, solltest du auf die Sicherheitsgrenze für die Skriptausführung achten.

Wir empfehlen, die Dateizugriffsdomäne von der NocoBase-Site- und API-Domäne zu isolieren. Zum Beispiel können Dateien aus OSS, S3, COS oder einem CDN über eine eigene Domäne bereitgestellt werden, statt denselben Origin wie das NocoBase-Frontend oder die API zu verwenden.

Wenn sich die Dateidomäne von der API-Domäne unterscheidet und die API keinen CORS-Zugriff für die Dateidomäne aktiviert, werden Skripte in der PDF-Vorschau normalerweise durch die Same-Origin-Policy des Browsers eingeschränkt. Sie können die NocoBase-Seite, den Browser-Speicher oder API-Antworten nicht direkt lesen.
