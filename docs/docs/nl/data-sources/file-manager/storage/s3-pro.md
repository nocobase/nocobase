---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: "@nocobase/plugin-file-storage-s3-pro"
---
# Bestandsopslag: S3 (Pro)

## Introductie

Voortbouwend op de plugin voor bestandsbeheer, voegt deze versie ondersteuning toe voor bestandstypen die compatibel zijn met het S3-protocol. Elke objectopslagservice die het S3-protocol ondersteunt, zoals Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, enz., kan naadloos worden geïntegreerd, wat de compatibiliteit en flexibiliteit van opslagservices verder verbetert.

## Functies

1. **Client-upload:** Bestanden worden rechtstreeks naar de opslagservice geüpload zonder via de NocoBase-server te gaan, wat zorgt voor een efficiëntere en snellere uploadervaring.

2. **Private toegang:** Alle URL's voor bestanden zijn ondertekende, tijdelijke autorisatieadressen, wat veilige en tijdgebonden toegang tot bestanden garandeert.

## Gebruiksscenario's

1. **Bestandstabelbeheer:** Centraal beheer en opslag van alle geüploade bestanden, met ondersteuning voor diverse bestandstypen en opslagmethoden voor eenvoudige classificatie en retrieval.

2. **Opslag van bijlagevelden:** Opslag van bijlagen die via formulieren of records zijn geüpload, met ondersteuning voor koppeling aan specifieke gegevensrecords.

## Pluginconfiguratie

1. Schakel de `plugin-file-storage-s3-pro` plugin in.

2. Navigeer naar "Setting -> FileManager" om de instellingen voor bestandsbeheer te openen.

3. Klik op de knop "Add new" en selecteer "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. In het pop-upvenster ziet u een gedetailleerd formulier dat u moet invullen. Raadpleeg de volgende documentatie om de relevante parameters voor uw bestandsservice te verkrijgen en vul deze correct in het formulier in.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuratie van serviceprovider

### Amazon S3

#### Bucket aanmaken

1. Bezoek de [Amazon S3 Console](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Klik op de knop "Create bucket" aan de rechterkant.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Vul de `Bucket Name` in, laat andere velden op de standaardinstellingen staan, scroll naar beneden en klik op de knop **"Create"** om het proces te voltooien.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-configuratie

1. Zoek in de bucketlijst de zojuist aangemaakte bucket en klik erop om de details te openen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Navigeer naar het tabblad "Permission" en scroll naar beneden naar het gedeelte voor CORS-configuratie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Voer de volgende configuratie in (pas deze indien nodig aan) en sla op.

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

#### AccessKey en SecretAccessKey ophalen

1. Klik op de knop "Security credentials" in de rechterbovenhoek.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scroll naar het gedeelte "Access Keys" en klik op "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Ga akkoord met de voorwaarden (het gebruik van IAM wordt aanbevolen voor productieomgevingen).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Sla de weergegeven Access Key en Secret Access Key op.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parameters ophalen en configureren

1. Gebruik de opgehaalde `AccessKey ID` en `AccessKey Secret`.

2. Bezoek het eigenschappenpaneel van de bucket om de `Bucket Name` en `Region` te vinden.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Openbare toegang (optioneel)

Dit is een optionele configuratie. Configureer deze wanneer u geüploade bestanden volledig openbaar wilt maken.

1. Scroll in het Permissions-paneel naar "Object Ownership", klik op "Edit" en schakel ACL's in.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scroll naar "Block public access", klik op "Edit" en stel in dat ACL-controle is toegestaan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Vink "Public access" aan in NocoBase.

#### Configuratie van miniaturen (optioneel)

Deze configuratie is optioneel en moet worden gebruikt wanneer u de grootte of het effect van de afbeeldingspreview wilt optimaliseren. **Houd er rekening mee dat deze implementatie extra kosten met zich mee kan brengen. Raadpleeg de voorwaarden en prijzen van AWS voor meer details.**

1. Bezoek [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klik op de knop `Launch in the AWS Console` onderaan de pagina om de implementatie te starten.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Volg de aanwijzingen om de configuratie te voltooien. De volgende opties verdienen speciale aandacht:
   1. Bij het aanmaken van de stack moet u de naam van de Amazon S3-bucket opgeven die de bronafbeeldingen bevat. Voer de naam in van de bucket die u eerder hebt aangemaakt.
   2. Als u ervoor hebt gekozen om de demo-UI te implementeren, kunt u na de implementatie de UI gebruiken om de afbeeldingsverwerkingsfunctionaliteit te testen. Selecteer in de AWS CloudFormation-console uw stack, ga naar het tabblad "Outputs", zoek de waarde die overeenkomt met de `DemoUrl`-sleutel en klik op de link om de demo-interface te openen.
   3. Deze oplossing maakt gebruik van de `sharp` Node.js-bibliotheek voor efficiënte afbeeldingsverwerking. U kunt de broncode downloaden van de GitHub-repository en deze naar behoefte aanpassen.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Zodra de configuratie is voltooid, wacht u tot de implementatiestatus verandert in `CREATE_COMPLETE`.

5. In de NocoBase-configuratie dient u rekening te houden met het volgende:
   1. `Thumbnail rule`: Vul de parameters voor afbeeldingsverwerking in, zoals `?width=100`. Raadpleeg de [AWS-documentatie](https://docs.aws.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) voor details.
   2. `Access endpoint`: Voer de waarde in van Outputs -> ApiEndpoint na implementatie.
   3. `Full access URL style`: Selecteer **Ignore** (aangezien de bucketnaam al is ingevuld in de configuratie, is deze niet nodig voor toegang).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Bucket aanmaken

1. Open de [OSS Console](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Selecteer "Buckets" in het linkermenu en klik op "Create Bucket".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Vul de bucketdetails in en klik op "Create".
    1. `Bucket Name`: Kies op basis van uw bedrijfsbehoeften.
    2. `Region`: Selecteer de dichtstbijzijnde regio voor uw gebruikers.
    3. Andere instellingen kunnen standaard blijven of naar behoefte worden aangepast.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS-configuratie

1. Navigeer naar de detailpagina van de bucket die u zojuist hebt aangemaakt.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klik op "Content Security -> CORS" in het middenmenu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klik op de knop "Create Rule", vul de velden in, scroll naar beneden en klik op "OK". U kunt de onderstaande schermafbeelding raadplegen of meer gedetailleerde instellingen configureren.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey en SecretAccessKey ophalen

1. Klik op "AccessKey" onder uw accountavatar in de rechterbovenhoek.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Voor demonstratiedoeleinden zullen we een AccessKey aanmaken met het hoofdaccount. In een productieomgeving wordt aanbevolen om RAM te gebruiken om de AccessKey aan te maken. Raadpleeg de [Alibaba Cloud-documentatie](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair) voor instructies.
    
3. Klik op de knop "Create AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Voltooi de accountverificatie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Sla de weergegeven Access Key en Secret Access Key op.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Parameters ophalen en configureren

1. Gebruik de `AccessKey ID` en `AccessKey Secret` die u in de vorige stap hebt verkregen.
    
2. Ga naar de detailpagina van de bucket om de `Bucket`-naam te verkrijgen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scroll naar beneden om de `Region` te verkrijgen (het achtervoegsel ".aliyuncs.com" is niet nodig).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Verkrijg het endpoint-adres en voeg het `https://`-voorvoegsel toe wanneer u het in NocoBase invoert.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuratie van miniaturen (optioneel)

Deze configuratie is optioneel en mag alleen worden gebruikt bij het optimaliseren van de grootte of het effect van de afbeeldingspreview.

1. Vul de relevante parameters in voor `Thumbnail rule`. Raadpleeg de Alibaba Cloud-documentatie over [Afbeeldingsverwerking](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) voor specifieke parameterinstellingen.

2. Houd de instellingen voor `Full upload URL style` en `Full access URL style` hetzelfde.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket aanmaken

1. Klik op het menu **Buckets** aan de linkerkant -> Klik op **Create Bucket** om de aanmaakpagina te openen.
2. Voer de Bucketnaam in en klik vervolgens op de knop **Opslaan**.

#### AccessKey en SecretAccessKey ophalen

1. Navigeer naar **Access Keys** -> Klik op de knop **Create access key** om de aanmaakpagina te openen.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klik op de knop **Opslaan**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Sla de **Access Key** en **Secret Key** uit het pop-upvenster op voor toekomstige configuratie.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterconfiguratie

1. Ga naar de **File manager**-pagina in NocoBase.

2. Klik op de knop **Add new** en selecteer **S3 Pro**.

3. Vul het formulier in:
   - **AccessKey ID** en **AccessKey Secret**: Gebruik de waarden die u in de vorige stap hebt opgeslagen.
   - **Region**: Privaat geïmplementeerde MinIO heeft geen concept van een regio; u kunt deze instellen op `"auto"`.
   - **Endpoint**: Voer de domeinnaam of het IP-adres van uw geïmplementeerde service in.
   - Stel **Full access URL style** in op **Path-Style**.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Raadpleeg de configuraties voor de bovengenoemde bestandsservices. De logica is vergelijkbaar.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Raadpleeg de configuraties voor de bovengenoemde bestandsservices. De logica is vergelijkbaar.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414154500264.png)

## Gebruikershandleiding

Raadpleeg de [documentatie van de file-manager plugin](/data-sources/file-manager).