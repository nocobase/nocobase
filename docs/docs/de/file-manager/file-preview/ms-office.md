---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/file-manager/file-preview/ms-office).
:::

# Office-Dateivorschau <Badge>v1.8.11+</Badge>

Das Plugin zur Office-Dateivorschau wird verwendet, um Dateien im Office-Format wie Word, Excel und PowerPoint in NocoBase-Anwendungen in der Vorschau anzuzeigen.  
Es basiert auf einem öffentlichen Online-Dienst von Microsoft, der es ermöglicht, über eine öffentliche URL zugängliche Dateien in eine Vorschau-Oberfläche einzubetten. So können Benutzer diese Dateien im Browser ansehen, ohne sie herunterzuladen oder Office-Anwendungen verwenden zu müssen.

## Benutzerhandbuch

Standardmäßig ist das Plugin **deaktiviert**. Es kann nach der Aktivierung im Plugin-Manager ohne zusätzliche Konfiguration verwendet werden.

![Plugin-Aktivierungsoberfläche](https://static-docs.nocobase.com/20250731140048.png)

Nachdem Sie eine Office-Datei (Word / Excel / PowerPoint) erfolgreich in ein Dateifeld einer Sammlung hochgeladen haben, klicken Sie auf das entsprechende Dateisymbol oder den Link, um den Dateiinhalt in der Popup- oder eingebetteten Vorschau-Oberfläche anzuzeigen.

![Beispiel für Vorschau-Bedienung](https://static-docs.nocobase.com/20250731143231.png)

## Funktionsprinzip

Die durch dieses Plugin eingebettete Vorschau basiert auf dem öffentlichen Online-Dienst von Microsoft (Office Web Viewer). Der Hauptprozess ist wie folgt:

- Das Frontend generiert eine öffentlich zugängliche URL für die vom Benutzer hochgeladene Datei (einschließlich signierter S3-URLs);
- Das Plugin lädt die Dateivorschau in einem Iframe unter Verwendung der folgenden Adresse:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<Öffentliche Datei-URL>
  ```

- Der Microsoft-Dienst fordert den Dateiinhalt von dieser URL an, rendert ihn und gibt eine anzeigbare Seite zurück.

## Hinweise

- Da dieses Plugin auf dem Online-Dienst von Microsoft basiert, stellen Sie bitte sicher, dass die Netzwerkverbindung stabil ist und auf die entsprechenden Microsoft-Dienste zugegriffen werden kann.
- Microsoft greift auf die von Ihnen bereitgestellte Datei-URL zu, und der Dateiinhalt wird zur Darstellung der Vorschauseite kurzzeitig auf deren Servern zwischengespeichert. Daher besteht ein gewisses Datenschutzrisiko. Wenn Sie diesbezüglich Bedenken haben, wird empfohlen, die Vorschaufunktion dieses Plugins nicht zu verwenden[^1].
- Die in der Vorschau anzuzeigende Datei muss über eine öffentlich zugängliche URL verfügen. Normalerweise generieren in NocoBase hochgeladene Dateien automatisch zugängliche öffentliche Links (einschließlich signierter URLs, die vom S3-Pro-Plugin generiert werden). Wenn jedoch Zugriffsberechtigungen für die Datei festgelegt sind oder diese in einer internen Netzwerkumgebung gespeichert ist, ist keine Vorschau möglich[^2].
- Der Dienst unterstützt keine Login-Authentifizierung oder Ressourcen in privatem Speicher. Beispielsweise können Dateien, die nur innerhalb eines internen Netzwerks zugänglich sind oder eine Anmeldung erfordern, diese Vorschaufunktion nicht nutzen.
- Nachdem der Dateiinhalt vom Microsoft-Dienst erfasst wurde, kann er für kurze Zeit zwischengespeichert werden. Selbst wenn die Quelldatei gelöscht wird, kann der Vorschauinhalt möglicherweise noch einige Zeit lang zugänglich sein.
- Es gibt empfohlene Grenzwerte für die Dateigröße: Word- und PowerPoint-Dateien sollten 10 MB nicht überschreiten, und Excel-Dateien sollten 5 MB nicht überschreiten, um die Stabilität der Vorschau zu gewährleisten[^3].
- Derzeit gibt es keine offizielle, eindeutige Beschreibung der kommerziellen Nutzungslizenz für diesen Dienst. Bitte bewerten Sie die Risiken bei der Nutzung selbst[^4].

## Unterstützte Dateiformate

Das Plugin unterstützt die Vorschau nur für die folgenden Office-Dateiformate, basierend auf dem MIME-Typ oder der Dateierweiterung:

- Word-Dokumente:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) oder `application/msword` (`.doc`)
- Excel-Tabellen:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) oder `application/vnd.ms-excel` (`.xls`)
- PowerPoint-Präsentationen:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) oder `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument-Text: `application/vnd.oasis.opendocument.text` (`.odt`)

Andere Dateiformate aktivieren die Vorschaufunktion dieses Plugins nicht.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)