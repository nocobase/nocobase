---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Dateispeicher: S3 (Pro)

## Einführung

Aufbauend auf dem Dateiverwaltungs-Plugin wird in dieser Version die Unterstützung für Dateispeichertypen hinzugefügt, die mit dem S3-Protokoll kompatibel sind. Jeder Objektspeicherdienst, der das S3-Protokoll unterstützt, lässt sich nahtlos integrieren, wie z. B. Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 usw. Dies erhöht die Kompatibilität und Flexibilität der Speicherdienste erheblich.

## Funktionen

1. **Client-Upload:** Dateien werden direkt in den Speicherdienst hochgeladen, ohne den NocoBase-Server zu passieren. Dies ermöglicht ein effizienteres und schnelleres Hochladen.

2. **Privater Zugriff:** Alle Datei-URLs sind signierte, temporäre Autorisierungsadressen, die einen sicheren und zeitlich begrenzten Zugriff auf Dateien gewährleisten.

## Anwendungsfälle

1. **Dateitabellen-Verwaltung:** Zentrales Verwalten und Speichern aller hochgeladenen Dateien. Es werden verschiedene Dateitypen und Speichermethoden unterstützt, was die Klassifizierung und das Auffinden von Dateien erleichtert.

2. **Speicherung von Anhangsfeldern:** Dient der Datenspeicherung von Anhängen, die über Formulare oder Datensätze hochgeladen werden, und unterstützt die Verknüpfung mit spezifischen Datensätzen.

## Plugin-Konfiguration

1. Aktivieren Sie das Plugin `plugin-file-storage-s3-pro`.

2. Navigieren Sie zu "Einstellungen -> Dateimanager", um die Dateiverwaltungs-Einstellungen aufzurufen.

3. Klicken Sie auf die Schaltfläche "Neu hinzufügen" und wählen Sie "S3 Pro" aus.

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Im daraufhin erscheinenden Pop-up-Fenster sehen Sie ein detailliertes Formular, das ausgefüllt werden muss. Die relevanten Parameter für Ihren Dateidienst finden Sie in der folgenden Dokumentation. Tragen Sie diese dann korrekt in das Formular ein.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfiguration der Dienstanbieter

### Amazon S3

#### Bucket-Erstellung

1. Besuchen Sie die [Amazon S3 Konsole](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Klicken Sie auf die Schaltfläche "Bucket erstellen" auf der rechten Seite.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Geben Sie den `Bucket-Namen` ein, lassen Sie andere Felder auf den Standardeinstellungen, scrollen Sie zum Seitenende und klicken Sie auf die Schaltfläche **"Erstellen"**, um den Vorgang abzuschließen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-Konfiguration

1. Suchen und klicken Sie in der Bucket-Liste auf den soeben erstellten Bucket, um dessen Detailseite aufzurufen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Navigieren Sie zur Registerkarte "Berechtigungen" und scrollen Sie nach unten zum Abschnitt für die CORS-Konfiguration.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Geben Sie die folgende Konfiguration ein (passen Sie diese bei Bedarf an) und speichern Sie sie.

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

1. Klicken Sie auf die Schaltfläche "Sicherheitsanmeldeinformationen" in der oberen rechten Ecke.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scrollen Sie zum Abschnitt "Zugriffsschlüssel" und klicken Sie auf die Schaltfläche "Zugriffsschlüssel erstellen".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Stimmen Sie den Bedingungen zu (für Produktionsumgebungen wird die Verwendung von IAM empfohlen).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Speichern Sie den angezeigten Access Key und Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parameter abrufen und konfigurieren

1. Verwenden Sie die in den vorherigen Schritten abgerufenen Werte für `AccessKey ID` und `AccessKey Secret`. Bitte tragen Sie diese korrekt ein.

2. Rufen Sie das Eigenschaften-Panel des Buckets auf. Dort finden Sie den `Bucket-Namen` und die `Region` (Gebiet) Informationen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Öffentlicher Zugriff (Optional)

Dies ist eine optionale Konfiguration. Nehmen Sie diese vor, wenn Sie hochgeladene Dateien vollständig öffentlich zugänglich machen möchten.

1. Navigieren Sie im Berechtigungs-Panel zum Abschnitt "Objektbesitz", klicken Sie auf "Bearbeiten" und aktivieren Sie ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scrollen Sie zu "Öffentlichen Zugriff blockieren", klicken Sie auf "Bearbeiten" und stellen Sie die Option so ein, dass ACLs die Kontrolle erlauben.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Aktivieren Sie in NocoBase die Option "Öffentlicher Zugriff".

#### Miniaturansicht-Konfiguration (Optional)

Diese Konfiguration ist optional und wird verwendet, wenn Sie die Größe oder den Effekt der Bildvorschau optimieren möchten. **Bitte beachten Sie, dass diese Bereitstellung zusätzliche Kosten verursachen kann. Detaillierte Informationen zu den Kosten finden Sie in den entsprechenden AWS-Bedingungen.**

1. Besuchen Sie [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klicken Sie unten auf der Seite auf die Schaltfläche `Launch in the AWS Console`, um die Bereitstellung zu starten.

![](https://static-docs.nocobase.com/20250221164214117.png)

3. Folgen Sie den Anweisungen, um die Konfiguration abzuschließen. Die folgenden Optionen erfordern besondere Aufmerksamkeit:
   1. Beim Erstellen des Stacks müssen Sie den Namen eines Amazon S3 Buckets angeben, der die Quellbilder enthält. Bitte geben Sie den zuvor von Ihnen erstellten Bucket-Namen ein.
   2. Wenn Sie sich für die Bereitstellung der Demo-Benutzeroberfläche entschieden haben, können Sie nach der Bereitstellung die Bildverarbeitungsfunktionen über diese Oberfläche testen. Wählen Sie in der AWS CloudFormation-Konsole Ihren Stack aus, wechseln Sie zur Registerkarte "Ausgaben", suchen Sie den Wert, der dem Schlüssel `DemoUrl` entspricht, und klicken Sie auf den Link, um die Demo-Oberfläche zu öffnen.
   3. Diese Lösung verwendet die `sharp` Node.js-Bibliothek zur effizienten Bildverarbeitung. Sie können den Quellcode aus dem GitHub-Repository herunterladen und bei Bedarf anpassen.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4. Sobald die Konfiguration abgeschlossen ist, warten Sie, bis der Bereitstellungsstatus zu `CREATE_COMPLETE` wechselt.

5. Beachten Sie in der NocoBase-Konfiguration die folgenden Punkte:
   1. `Thumbnail rule`: Geben Sie die relevanten Bildverarbeitungsparameter ein, z. B. `?width=100`. Details finden Sie in der [AWS-Dokumentation](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Geben Sie den Wert aus Outputs -> ApiEndpoint nach der Bereitstellung ein.
   3. `Full access URL style`: Wählen Sie **Ignorieren** aus (da der Bucket-Name bereits in der Konfiguration angegeben wurde und beim Zugriff nicht mehr benötigt wird).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Bucket-Erstellung

1. Öffnen Sie die [OSS Konsole](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Wählen Sie im linken Menü "Buckets" aus und klicken Sie dann auf die Schaltfläche "Bucket erstellen", um einen Bucket zu erstellen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Füllen Sie die Bucket-Details aus und klicken Sie auf die Schaltfläche "Erstellen".

   1. `Bucket-Name`: Wählen Sie einen Namen, der Ihren Geschäftsanforderungen entspricht.
   2. `Region`: Wählen Sie die für Ihre Benutzer nächstgelegene Region aus.
   3. Andere Einstellungen können Standard bleiben oder bei Bedarf angepasst werden.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS-Konfiguration

1. Navigieren Sie zur Detailseite des soeben erstellten Buckets.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klicken Sie im mittleren Menü auf "Inhaltssicherheit -> CORS".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klicken Sie auf die Schaltfläche "Regel erstellen", füllen Sie die Felder aus, scrollen Sie nach unten und klicken Sie auf "OK". Sie können sich am folgenden Screenshot orientieren oder detailliertere Einstellungen vornehmen.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Abrufen von AccessKey und SecretAccessKey

1. Klicken Sie oben rechts unter Ihrem Konto-Avatar auf "AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Zu Demonstrationszwecken erstellen wir einen AccessKey mit dem Hauptkonto. In einer Produktionsumgebung wird jedoch empfohlen, RAM für die Erstellung des AccessKeys zu verwenden. Anweisungen dazu finden Sie in der [Alibaba Cloud-Dokumentation](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3. Klicken Sie auf die Schaltfläche "AccessKey erstellen".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Führen Sie die Kontoverifizierung durch.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Speichern Sie den angezeigten Access Key und Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Parameter abrufen und konfigurieren

1. Verwenden Sie die in den vorherigen Schritten erhaltenen Werte für `AccessKey ID` und `AccessKey Secret`.

2. Rufen Sie die Bucket-Detailseite auf, um den `Bucket-Namen` zu erhalten.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scrollen Sie nach unten, um die `Region` zu erhalten (das nachfolgende ".aliyuncs.com" ist nicht erforderlich).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Rufen Sie die Endpoint-Adresse ab und fügen Sie beim Eintragen in NocoBase das Präfix `https://` hinzu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Miniaturansicht-Konfiguration (Optional)

Diese Konfiguration ist optional und sollte nur verwendet werden, wenn die Größe oder der Effekt der Bildvorschau optimiert werden soll.

1. Geben Sie die relevanten Parameter für die `Thumbnail rule` ein. Spezifische Parametereinstellungen finden Sie in der Alibaba Cloud-Dokumentation zur [Bildverarbeitung](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing).

2. Die Einstellungen für `Full upload URL style` und `Full access URL style` sollten identisch sein.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket-Erstellung

1. Klicken Sie im linken Menü auf **Buckets** -> Klicken Sie auf **Bucket erstellen**, um die Erstellungsseite zu öffnen.
2. Geben Sie den Bucket-Namen ein und klicken Sie dann auf die Schaltfläche **Speichern**.

#### Abrufen von AccessKey und SecretAccessKey

1. Navigieren Sie zu **Zugriffsschlüssel** -> Klicken Sie auf die Schaltfläche **Zugriffsschlüssel erstellen**, um die Erstellungsseite zu öffnen.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klicken Sie auf die Schaltfläche **Speichern**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Speichern Sie den **Access Key** und den **Secret Key** aus dem Pop-up-Fenster für die spätere Konfiguration.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterkonfiguration

1. Gehen Sie in NocoBase zur Seite **Dateimanager**.

2. Klicken Sie auf die Schaltfläche **Neu hinzufügen** und wählen Sie **S3 Pro** aus.

3. Füllen Sie das Formular aus:
   - **AccessKey ID** und **AccessKey Secret**: Verwenden Sie die im vorherigen Schritt gespeicherten Werte.
   - **Region**: Ein privat bereitgestelltes MinIO hat kein Region-Konzept; Sie können es auf `"auto"` setzen.
   - **Endpoint**: Geben Sie den Domänennamen oder die IP-Adresse Ihres bereitgestellten Dienstes ein.
   - Stellen Sie den **Full access URL style** auf **Path-Style** ein.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Sie können sich an den Konfigurationen der oben genannten Dateidienste orientieren; die Logik ist ähnlich.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Sie können sich an den Konfigurationen der oben genannten Dateidienste orientieren; die Logik ist ähnlich.

#### Konfigurationsbeispiel

![](https://static-docs.nocobase.com/20250414154500264.png)

## Benutzerhandbuch

Beachten Sie die [Dokumentation des Dateimanager-Plugins](/data-sources/file-manager).