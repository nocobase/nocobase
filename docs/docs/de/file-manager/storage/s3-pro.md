---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---

# Speicher-Engine: S3 (Pro)

## Einführung

Aufbauend auf dem Dateimanager-Plugin wird hier die Unterstützung für S3-Protokoll-kompatible Dateispeichertypen hinzugefügt. Jeder Objektspeicherdienst, der das S3-Protokoll unterstützt, lässt sich problemlos integrieren, wie zum Beispiel Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 und weitere. Dies erhöht die Kompatibilität und Flexibilität Ihrer Speicherdienste erheblich.

## Funktionen

1. **Client-seitiger Upload**: Der Dateiupload erfolgt nicht über den NocoBase-Server, sondern direkt über den Dateispeicherdienst. Dies ermöglicht ein effizienteres und schnelleres Upload-Erlebnis.
    
2. **Privater Zugriff**: Standardmäßig werden signierte URLs mit Ablaufzeit verwendet. Für öffentliche Buckets können auch nicht signierte URLs erzeugt werden.

## Anwendungsfälle

1. **Sammlungsverwaltung für Dateien**: Verwalten und speichern Sie alle hochgeladenen Dateien zentral. Es werden verschiedene Dateitypen und Speichermethoden unterstützt, was die Klassifizierung und das Auffinden von Dateien erleichtert.
    
2. **Speicherung von Anhangsfeldern**: Dient der Datenspeicherung von Anhängen, die in Formularen oder Datensätzen hochgeladen werden, und unterstützt die Verknüpfung mit spezifischen Datensätzen.
  

## Plugin-Konfiguration

1. Aktivieren Sie das Plugin `plugin-file-storage-s3-pro`.
    
2. Klicken Sie auf "Einstellungen -> Dateimanager", um die Einstellungen des Dateimanagers aufzurufen.

3. Klicken Sie auf die Schaltfläche "Neu hinzufügen" und wählen Sie "S3 Pro" aus.

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Nachdem das Pop-up-Fenster erscheint, sehen Sie ein Formular mit zahlreichen Feldern, die ausgefüllt werden müssen. Die relevanten Parameterinformationen für den jeweiligen Dateidienst finden Sie in der nachfolgenden Dokumentation. Bitte tragen Sie diese korrekt in das Formular ein.

![](https://static-docs.nocobase.com/20250413190828536.png)

## URL-Konfiguration

Zusätzlich zu den allgemeinen Optionen „NocoBase-URL“, „Ursprüngliche URL“ und „Öffentlichen Zugriff erlauben“ des Dateimanagers können Sie in S3 Pro die Formate für Upload- und Zugriffs-URLs getrennt konfigurieren und festlegen, ob signierte URLs verwendet werden. Die allgemeinen Optionen werden in der [Übersicht der Speicher-Engines](./index.md#datei-urls-und-zugriffskontrolle) erläutert.

Diese Optionen steuern unterschiedliche Schritte:

- „NocoBase-URL / Ursprüngliche URL“ bestimmt, welche Adresse der Dateidatensatz zurückgibt
- „Öffentlichen Zugriff erlauben“ bestimmt, ob beim Zugriff auf eine NocoBase-URL die Leseberechtigungen des Dateidatensatzes geprüft werden
- „Signierte URL nicht verwenden“ bestimmt, ob der Objektspeicher die URL-Signatur prüft

Die Einstellungen können unabhängig kombiniert werden. Empfohlen wird standardmäßig die NocoBase-URL, „Öffentlichen Zugriff erlauben“ deaktiviert und die Verwendung signierter URLs aktiviert.

![S3-Pro-URL-Konfiguration](https://static-docs.nocobase.com/20260723221441.png)

### Auswahlhilfe

| Anwendungsfall | Datei-URL | Öffentlichen Zugriff erlauben | Signierte URL nicht verwenden |
| --- | --- | --- | --- |
| Dateien müssen Rollen- und Datenberechtigungen folgen, während der Bucket privat bleibt | NocoBase-URL | Nicht aktiviert | Nicht aktiviert |
| Eine öffentliche NocoBase-Dateiadresse wird benötigt, während der Bucket privat bleibt | NocoBase-URL | Aktiviert | Nicht aktiviert |
| Ein externer Dienst benötigt vorübergehenden Zugriff auf die Speicheradresse | Ursprüngliche URL | Nicht anwendbar | Nicht aktiviert; Access URL expiration konfigurieren |
| Ein öffentlicher Bucket oder ein CDN benötigt eine nicht signierte ursprüngliche Adresse | Ursprüngliche URL | Nicht anwendbar | Aktiviert |

### Format der Upload-URL

„Format der Upload-URL“ steuert die S3-URL, die der Client beim Hochladen von Dateien verwendet. Wählen Sie das von Ihrem Speicherdienst unterstützte Format. Das Formular zeigt anhand von Endpoint, Bucket und Pfad ein aktuelles Beispiel:

- „Bucket as subdomain“: `https://bucket-name.s3.example.com/path/to/object`
- „Bucket as subpath“: `https://s3.example.com/bucket-name/path/to/object`
- „Ignore bucket“: `https://upload.example.com/path/to/object`

### Format der Zugriffs-URL

„Format der Zugriffs-URL“ steuert, ob der Bucket beim Erzeugen einer Dateizugriffsadresse in der Domain, im Pfad oder gar nicht in der URL erscheint. Es stehen dieselben drei Formate wie für die Upload-URL zur Verfügung, sie können jedoch getrennt konfiguriert werden—zum Beispiel kann der Upload einen S3-Endpoint verwenden, während der Zugriff über eine CDN-Domain ohne Bucket erfolgt.

Diese Option wirkt sich auf ursprüngliche URLs sowie auf die Speicheradresse aus, zu der eine NocoBase-URL schließlich weiterleitet. Das Format der NocoBase-URL selbst ändert sich nicht.

### Signierte URL nicht verwenden

S3 Pro verwendet standardmäßig signierte URLs. Eine erzeugte ursprüngliche URL enthält Signaturparameter, zum Beispiel:

```text
https://bucket-name.s3.example.com/path/to/object?X-Amz-Signature=xxxx
```

Die signierte URL bleibt für die unter „Access URL expiration“ konfigurierte Dauer gültig, und der Bucket kann privat bleiben. Bei Verwendung einer NocoBase-URL erzeugt NocoBase nach erfolgreicher Berechtigungsprüfung eine signierte Adresse oder leitet dorthin weiter.

Wenn „Signierte URL nicht verwenden“ aktiviert ist, erzeugt S3 Pro eine Adresse ohne Signaturparameter. Bucket und hochgeladene Objekte müssen dann öffentlich lesbar sein; „Access URL expiration“ ist nicht mehr wirksam.

„Signierte URL nicht verwenden“ steuert nur die Signaturprüfung des Speicherdienstes und ändert keine NocoBase-Berechtigungen. Wenn die NocoBase-URL ausgewählt und „Öffentlichen Zugriff erlauben“ nicht aktiviert ist, muss die Anfrage weiterhin zuerst die NocoBase-Berechtigungsprüfung bestehen.

## Konfiguration der Dienstanbieter

### Amazon S3

#### Bucket-Erstellung

1. Öffnen Sie https://ap-southeast-1.console.aws.amazon.com/s3/home, um die S3-Konsole aufzurufen.
    
2. Klicken Sie rechts auf die Schaltfläche "Bucket erstellen".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Geben Sie den Bucket-Namen ein. Andere Felder können Sie in den Standardeinstellungen belassen. Scrollen Sie zum unteren Ende der Seite und klicken Sie auf die Schaltfläche **"**Erstellen**"**, um den Vorgang abzuschließen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-Konfiguration

1. Gehen Sie zur Bucket-Liste, suchen Sie den soeben erstellten Bucket und klicken Sie darauf, um dessen Detailseite aufzurufen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klicken Sie auf den Tab "Berechtigungen" und scrollen Sie dann nach unten, um den Abschnitt für die CORS-Konfiguration zu finden.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Tragen Sie die folgende Konfiguration ein (Sie können diese bei Bedarf weiter anpassen) und speichern Sie sie.
    
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Abrufen von AccessKey und SecretAccessKey

1. Klicken Sie oben rechts auf der Seite auf die Schaltfläche "Sicherheitsanmeldeinformationen".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scrollen Sie nach unten zum Abschnitt "Zugriffsschlüssel" und klicken Sie auf die Schaltfläche "Zugriffsschlüssel erstellen".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klicken Sie auf "Zustimmen" (dies ist eine Demonstration mit dem Root-Konto; in einer Produktionsumgebung wird die Verwendung von IAM empfohlen).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Speichern Sie den auf der Seite angezeigten Zugriffsschlüssel (Access Key) und geheimen Zugriffsschlüssel (Secret Access Key).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Abrufen und Konfigurieren von Parametern

1. Die AccessKey ID und der AccessKey Secret sind die Werte, die Sie im vorherigen Schritt erhalten haben. Bitte tragen Sie diese genau ein.
    
2. Gehen Sie zum Eigenschaften-Panel der Bucket-Detailseite. Dort finden Sie den Bucket-Namen und die Region-Informationen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Nicht signierter öffentlicher Zugriff (optional)

Konfigurieren Sie dies nur, wenn nicht signierte URLs benötigt werden, da Bucket und hochgeladene Objekte öffentlich lesbar sein müssen. Wenn lediglich eine öffentliche NocoBase-URL geteilt werden soll, aktivieren Sie „Öffentlichen Zugriff erlauben“ und verwenden Sie weiterhin signierte URLs; der Bucket muss nicht öffentlich sein.

1. Gehen Sie zum Berechtigungen-Panel, scrollen Sie zu "Objektbesitz", klicken Sie auf "Bearbeiten" und aktivieren Sie ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scrollen Sie zu "Öffentlichen Zugriff blockieren", klicken Sie auf "Bearbeiten" und stellen Sie ein, dass ACLs die Kontrolle erlauben.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Aktivieren Sie „Signierte URL nicht verwenden“ in NocoBase.

#### Miniaturansicht-Konfiguration (Optional)

Diese Konfiguration ist optional und wird verwendet, um die Größe oder Qualität der Bildvorschau zu optimieren. **Bitte beachten Sie, dass diese Bereitstellungslösung zusätzliche Kosten verursachen kann. Spezifische Gebühren entnehmen Sie bitte den relevanten AWS-Bedingungen.**

1. Besuchen Sie [Dynamische Bildtransformation für Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klicken Sie unten auf der Seite auf die Schaltfläche `Launch in the AWS Console`, um die Bereitstellung der Lösung zu starten.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Folgen Sie den Anweisungen, um die Konfiguration abzuschließen. Achten Sie besonders auf die folgenden Optionen:
   1. Beim Erstellen des Stacks müssen Sie den Namen eines Amazon S3 Buckets angeben, der die Quellbilder enthält. Bitte geben Sie den Namen des zuvor von Ihnen erstellten Buckets ein.
   2. Wenn Sie sich für die Bereitstellung der Demo-Benutzeroberfläche entscheiden, können Sie die Bildverarbeitungsfunktionen nach der Bereitstellung über diese Schnittstelle testen. Wählen Sie in der AWS CloudFormation-Konsole Ihren Stack aus, wechseln Sie zum Tab "Ausgaben", suchen Sie den Wert, der dem Schlüssel "DemoUrl" entspricht, und klicken Sie auf den Link, um die Demo-Oberfläche zu öffnen.
   3. Diese Lösung verwendet die Node.js-Bibliothek `sharp` zur effizienten Bildverarbeitung. Sie können den Quellcode aus dem GitHub-Repository herunterladen und bei Bedarf anpassen.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Nach Abschluss der Konfiguration warten Sie, bis der Bereitstellungsstatus auf `CREATE_COMPLETE` wechselt.

5. Bei der NocoBase-Konfiguration sind folgende Punkte zu beachten:
   1. `Thumbnail rule`: Tragen Sie bildverarbeitungsbezogene Parameter ein, zum Beispiel `?width=100`. Details hierzu finden Sie in der [AWS-Dokumentation](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Tragen Sie den Wert von "Outputs -> ApiEndpoint" nach der Bereitstellung ein.
   3. „Format der Zugriffs-URL“: Wählen Sie „Ignore bucket“, da der Bucket-Name bereits in der Konfiguration enthalten ist und in der Zugriffs-URL nicht mehr benötigt wird.
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Bucket-Erstellung

1. Öffnen Sie die OSS-Konsole unter https://oss.console.aliyun.com/overview.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klicken Sie im linken Menü auf "Buckets" und dann auf die Schaltfläche "Bucket erstellen", um einen Bucket zu erstellen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Füllen Sie die relevanten Bucket-Informationen aus und klicken Sie abschließend auf die Schaltfläche "Erstellen".
    
    1. Der Bucket-Name sollte Ihren Geschäftsanforderungen entsprechen; der Name ist frei wählbar.
        
    2. Wählen Sie die Region, die Ihren Benutzern am nächsten liegt.
        
    3. Andere Einstellungen können Sie als Standard belassen oder nach Ihren Anforderungen konfigurieren.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS-Konfiguration

1. Gehen Sie zur Detailseite des im vorherigen Schritt erstellten Buckets.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klicken Sie im mittleren Menü auf "Inhaltssicherheit -> CORS".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klicken Sie auf die Schaltfläche "Regel erstellen", füllen Sie die relevanten Inhalte aus, scrollen Sie nach unten und klicken Sie auf "OK". Sie können sich am folgenden Screenshot orientieren oder detailliertere Einstellungen vornehmen.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Abrufen von AccessKey und SecretAccessKey

1. Klicken Sie oben rechts unter Ihrem Profilbild auf "AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Zur Veranschaulichung wird hier ein AccessKey mit dem Hauptkonto erstellt. In einer Produktionsumgebung wird jedoch empfohlen, RAM für die Erstellung zu verwenden. Weitere Informationen finden Sie unter https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair.
    
3. Klicken Sie auf die Schaltfläche "AccessKey erstellen".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Führen Sie die Kontoverifizierung durch.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Speichern Sie den auf der Seite angezeigten Zugriffsschlüssel (Access Key) und geheimen Zugriffsschlüssel (Secret Access Key).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Abrufen und Konfigurieren von Parametern

1. Die AccessKey ID und der AccessKey Secret sind die Werte, die Sie im vorherigen Schritt erhalten haben.
    
2. Gehen Sie zur Bucket-Detailseite, um den Bucket-Namen abzurufen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scrollen Sie nach unten, um die Region abzurufen (das nachgestellte ".aliyuncs.com" wird nicht benötigt).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Rufen Sie die Endpoint-Adresse ab. Beim Eintragen in NocoBase müssen Sie das Präfix `https://` hinzufügen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Miniaturansicht-Konfiguration (Optional)

Diese Konfiguration ist optional und sollte nur verwendet werden, wenn Sie die Größe oder Qualität der Bildvorschau optimieren müssen.

1. Tragen Sie die relevanten Parameter für die `Thumbnail rule` ein. Spezifische Parametereinstellungen finden Sie unter [Bildverarbeitungsparameter](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. „Format der Upload-URL“ und „Format der Zugriffs-URL“ können identisch eingestellt werden.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket-Erstellung

1. Klicken Sie im linken Menü auf "Buckets" -> klicken Sie auf "Bucket erstellen", um zur Erstellungsseite zu gelangen.
2. Geben Sie den Bucket-Namen ein und klicken Sie auf die Schaltfläche "Speichern".

#### Abrufen von AccessKey und SecretAccessKey

1. Gehen Sie zu "Zugriffsschlüssel" -> klicken Sie auf die Schaltfläche "Zugriffsschlüssel erstellen", um zur Erstellungsseite zu gelangen.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klicken Sie auf die Schaltfläche "Speichern".

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Speichern Sie den Access Key und Secret Key aus dem Pop-up-Fenster für die spätere Konfiguration.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterkonfiguration

1. Gehen Sie zur NocoBase -> Dateimanager-Seite.

2. Klicken Sie auf die Schaltfläche "Neu hinzufügen" und wählen Sie "S3 Pro" aus.

3. Füllen Sie das Formular aus:
   - **AccessKey ID** und **AccessKey Secret** sind die im vorherigen Schritt gespeicherten Werte.
   - **Region**: Ein selbst gehostetes MinIO hat kein Region-Konzept, daher kann es auf "auto" konfiguriert werden.
   - **Endpoint**: Geben Sie den Domainnamen oder die IP-Adresse Ihrer Bereitstellung ein.
   - Stellen Sie „Format der Zugriffs-URL“ auf „Bucket as subpath“ ein.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Sie können sich an der Konfiguration der oben genannten Dateidienste orientieren, da die Logik ähnlich ist.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Sie können sich an der Konfiguration der oben genannten Dateidienste orientieren, da die Logik ähnlich ist.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414154500264.png)
