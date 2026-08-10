---
title: "Dateispeicher: S3 (Pro)"
description: "S3-Pro-Speicher-Engine, Unternehmensspeicher kompatibel mit dem S3-Protokoll, mit Unterstützung für benutzerdefinierte Endpoints und erweiterte Konfigurationen."
keywords: "S3 Pro,Objektspeicher,Cloud-Speicher,S3-kompatibel,NocoBase"
---

# Dateispeicher: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Einführung

Auf Basis des Datei-Management-Plugins wird ein zusätzlicher Dateispeichertyp unterstützt, der mit dem S3-Protokoll kompatibel ist. Jeder Objektspeicherdienst, der das S3-Protokoll unterstützt, kann problemlos angebunden werden, darunter Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO und Cloudflare R2. Dadurch werden Kompatibilität und Flexibilität der Speicherdienste weiter verbessert.

## Funktionsmerkmale

1. Clientseitiger Upload: Der Datei-Upload muss nicht über den NocoBase-Server erfolgen, sondern wird direkt mit dem Dateispeicherdienst durchgeführt. Dadurch wird ein effizienteres und schnelleres Upload-Erlebnis ermöglicht.

2. Privater Zugriff: Beim Zugriff auf Dateien sind alle URLs signierte, temporär autorisierte Adressen, wodurch die Sicherheit und zeitliche Gültigkeit des Dateizugriffs gewährleistet werden.


## Anwendungsfälle

1. **Dateitabellenverwaltung**: Zentrale Verwaltung und Speicherung aller hochgeladenen Dateien, mit Unterstützung für verschiedene Dateitypen und Speicherarten zur einfachen Kategorisierung und Suche.

2. **Speicherung von Anhang-Feldern**: Speicherung von in Formularen oder Datensätzen hochgeladenen Anhängen mit Unterstützung der Verknüpfung zu den jeweiligen Datensätzen.


## Plugin-Konfiguration

1. Aktivieren Sie das Plugin plugin-file-storage-s3-pro

2. Klicken Sie auf "Setting-> FileManager", um die Einstellungen der Dateiverwaltung aufzurufen

3. Klicken Sie auf die Schaltfläche "Add new" und wählen Sie "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Nach dem Öffnen der Einblendung sehen Sie ein Formular mit zahlreichen auszufüllenden Feldern. In den folgenden Abschnitten finden Sie die entsprechenden Parameterinformationen für die jeweiligen Dateidienste, die Sie korrekt in das Formular eintragen können.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Konfiguration der Anbieter

### Amazon S3

#### Bucket erstellen

1. Öffnen Sie https://ap-southeast-1.console.aws.amazon.com/s3/home, um die S3-Konsole aufzurufen

2. Klicken Sie rechts auf die Schaltfläche "Create bucket"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Geben Sie den Bucket Name (Namen des Buckets) ein. Die übrigen Felder können auf den Standardeinstellungen belassen werden. Scrollen Sie zum unteren Seitenende und klicken Sie auf die Schaltfläche **"**Create**"**, um die Erstellung abzuschließen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-Konfiguration

1. Öffnen Sie die Liste der Buckets und klicken Sie auf den soeben erstellten Bucket, um dessen Detailseite aufzurufen

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klicken Sie auf die Registerkarte "Permission" und scrollen Sie nach unten zum Abschnitt für die CORS-Konfiguration

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Tragen Sie die folgende Konfiguration ein (Sie können die Konfiguration nach Bedarf detaillierter anpassen) und speichern Sie sie

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

#### AccessKey und SecretAccessKey abrufen

1. Klicken Sie oben rechts auf der Seite auf die Schaltfläche "Security credentials"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scrollen Sie nach unten zum Abschnitt "Access Keys" und klicken Sie auf die Schaltfläche "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klicken Sie auf „Zustimmen“ (hier wird zur Demonstration das Hauptkonto verwendet; für Produktionsumgebungen wird die Verwendung von IAM empfohlen).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Speichern Sie den auf der Seite angezeigten Access key und Secret access key

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parameter abrufen und konfigurieren

1. AccessKey ID und AccessKey Secret sind die im vorherigen Schritt abgerufenen Werte. Tragen Sie sie sorgfältig ein

2. Öffnen Sie im Detailbereich des Buckets das Bedienfeld properties. Dort finden Sie den Namen des Buckets und die Informationen zur Region.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Öffentlicher Zugriff (optional)

Diese Konfiguration ist nicht erforderlich. Sie wird vorgenommen, wenn die hochgeladenen Dateien vollständig öffentlich zugänglich sein sollen

1. Öffnen Sie das Bedienfeld Permissions, scrollen Sie zu Object Ownership, klicken Sie auf „Bearbeiten“ und aktivieren Sie ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scrollen Sie zu Block public access, klicken Sie auf „Bearbeiten“ und wählen Sie die Einstellung, mit der die Steuerung durch ACLs erlaubt wird

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Aktivieren Sie in NocoBase die Option Public access


#### Konfiguration von Vorschaubildern (optional)

Diese Konfiguration ist optional und wird verwendet, wenn die Größe oder Darstellung der Bildvorschau optimiert werden soll. **Bitte beachten Sie, dass bei dieser Bereitstellung zusätzliche Kosten entstehen können. Einzelheiten entnehmen Sie bitte den entsprechenden Bedingungen von AWS.**

1. Rufen Sie [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) auf.

2. Klicken Sie unten auf der Seite auf die Schaltfläche `Launch in the AWS Console`, um die Bereitstellung zu starten.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Führen Sie die Konfiguration gemäß den Anweisungen durch. Die folgenden Optionen erfordern besondere Aufmerksamkeit:
   1. Beim Erstellen des Stacks müssen Sie den Namen eines Amazon-S3-Buckets angeben, der die Quellbilder enthält. Geben Sie den Namen des zuvor erstellten Buckets ein.
   2. Wenn Sie die Bereitstellung der Demo-UI auswählen, können Sie nach Abschluss der Bereitstellung die Bildverarbeitungsfunktionen über diese Oberfläche testen. Wählen Sie in der AWS-CloudFormation-Konsole Ihren Stack aus, wechseln Sie zur Registerkarte „Outputs“, suchen Sie den Wert des Schlüssels DemoUrl und klicken Sie auf den Link, um die Demo-Oberfläche zu öffnen.
   3. Diese Lösung verwendet die `sharp`-Node.js-Bibliothek zur effizienten Bildverarbeitung. Sie können den Quellcode aus dem GitHub-Repository herunterladen und nach Bedarf anpassen.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Warten Sie nach Abschluss der Konfiguration, bis sich der Bereitstellungsstatus in `CREATE_COMPLETE` geändert hat.

5. Beachten Sie bei der Konfiguration in NocoBase die folgenden Punkte:
   1. `Thumbnail rule`: Geben Sie die Parameter für die Bildverarbeitung ein, z. B. `?width=100`. Weitere Informationen finden Sie in der [AWS-Dokumentation](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Geben Sie den Wert von Outputs -> ApiEndpoint nach der Bereitstellung ein.
   3. `Full access URL style`: **Ignore** muss aktiviert werden (da der Bucket-Name bereits bei der Konfiguration angegeben wurde und beim Zugriff nicht erneut benötigt wird).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Beispielkonfiguration

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Bucket erstellen

1. Öffnen Sie die OSS-Konsole unter https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Öffnen Sie im linken Menü "Buckets" und klicken Sie anschließend auf die Schaltfläche "Create Bucket", um mit der Erstellung des Buckets zu beginnen

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Geben Sie die Informationen zum Bucket ein und klicken Sie abschließend auf die Schaltfläche Create

    1. Bucket Name: Wählen Sie einen Namen passend zu Ihrem Geschäftsbereich; der Name ist frei wählbar

    2. Region: Wählen Sie die Region, die Ihrem Standort am nächsten liegt

    3. Die übrigen Optionen können auf den Standardeinstellungen belassen oder nach Bedarf konfiguriert werden

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### CORS-Konfiguration

1. Öffnen Sie die Detailseite des im vorherigen Schritt erstellten Buckets

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klicken Sie im mittleren Menü auf "Content Security -> CORS"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klicken Sie auf die Schaltfläche "Create Rule", geben Sie die entsprechenden Informationen ein, scrollen Sie nach unten und klicken Sie auf "OK". Sie können sich am folgenden Screenshot orientieren oder eine detailliertere Konfiguration vornehmen

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey und SecretAccessKey abrufen

1. Klicken Sie unterhalb Ihres Avatars oben rechts auf "AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Zur Vereinfachung der Demonstration wird hier das Hauptkonto zum Erstellen des AccessKey verwendet. Für den produktiven Einsatz wird empfohlen, RAM dafür zu verwenden. Weitere Informationen finden Sie unter https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Klicken Sie auf die Schaltfläche "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Führen Sie die Kontoverifizierung durch

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Speichern Sie den auf der Seite angezeigten Access key und Secret access key

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Parameter abrufen und konfigurieren

1. AccessKey ID und AccessKey Secret sind die im vorherigen Schritt abgerufenen Werte

2. Öffnen Sie die Detailseite des Buckets und rufen Sie den Bucket ab

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scrollen Sie nach unten, um die Region abzurufen (der nachfolgende Teil ".aliyuncs.com" wird nicht benötigt)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Rufen Sie die Endpoint-Adresse ab. Beim Eintragen in NocoBase muss das Präfix https:// hinzugefügt werden

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfiguration von Vorschaubildern (optional)

Diese Konfiguration ist optional und wird nur verwendet, wenn die Größe oder Darstellung der Bildvorschau optimiert werden soll.

1. Tragen Sie die entsprechenden Parameter für `Thumbnail rule` ein. Weitere Informationen zu den Parametern finden Sie unter [Bildverarbeitungsparameter](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` und `Full access URL style` können identisch eingestellt werden.

#### Beispielkonfiguration

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Bucket erstellen

1. Klicken Sie im linken Menü auf Buckets -> klicken Sie auf Create Bucket, um die Erstellungsseite aufzurufen
2. Geben Sie den Namen des Buckets ein und klicken Sie auf die Schaltfläche zum Speichern
#### AccessKey und SecretAccessKey abrufen

1. Öffnen Sie Access Keys -> klicken Sie auf die Schaltfläche Create access key, um die Erstellungsseite aufzurufen

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klicken Sie auf die Schaltfläche zum Speichern

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Speichern Sie den Access Key und Secret Key aus dem Dialogfenster für die spätere Konfiguration

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterkonfiguration

1. Öffnen Sie in NocoBase die Seite File manager

2. Klicken Sie auf die Schaltfläche Add new und wählen Sie S3 Pro

3. Füllen Sie das Formular aus
   - **AccessKey ID** und **AccessKey Secret** entsprechen den im vorherigen Schritt gespeicherten Werten
   - **Region**: Bei einem privat bereitgestellten MinIO gibt es kein Region-Konzept. Sie können "auto" konfigurieren
   - **Endpoint**: Geben Sie den Domainnamen oder die IP-Adresse des bereitgestellten Dienstes ein
   - Full access URL style muss auf Path-Style gesetzt werden

#### Beispielkonfiguration

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Sie können den oben beschriebenen Dateidiensten folgen. Die Vorgehensweise ist ähnlich

#### Beispielkonfiguration

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Sie können den oben beschriebenen Dateidiensten folgen. Die Vorgehensweise ist ähnlich

#### Beispielkonfiguration

![](https://static-docs.nocobase.com/20250414154500264.png)


## Verwendung durch Benutzer

Weitere Informationen finden Sie in der Dokumentation zur Verwendung des file-manager-Plugins: https://docs.nocobase.com/data-sources/file-manager/.