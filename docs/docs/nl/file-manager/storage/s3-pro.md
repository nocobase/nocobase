---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Opslagengine: S3 (Pro)

## Introductie

Voortbouwend op de bestandsbeheer-plugin, voegen we ondersteuning toe voor bestandopslagtypes die compatibel zijn met het S3-protocol. Elke objectopslagdienst die het S3-protocol ondersteunt, kunt u eenvoudig integreren, zoals Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, enz. Dit verbetert de compatibiliteit en flexibiliteit van opslagdiensten verder.

## Functies

1. Client-side upload: Het uploadproces van bestanden verloopt niet via de NocoBase-server, maar maakt direct verbinding met de bestandopslagdienst, wat zorgt voor een efficiëntere en snellere uploadervaring.
    
2. Privétoegang: Bij het openen van bestanden zijn alle URL's ondertekende, tijdelijk geautoriseerde adressen, wat de veiligheid en tijdigheid van bestandstoegang garandeert.

## Gebruiksscenario's

1. **Bestands collectiebeheer**: Centraal alle geüploade bestanden beheren en opslaan, met ondersteuning voor diverse bestandstypen en opslagmethoden, voor eenvoudige classificatie en opvraging.
    
2. **Opslag voor bijlagevelden**: Gebruikt voor de gegevensopslag van bijlagen die in formulieren of records zijn geüpload, met ondersteuning voor koppeling aan specifieke gegevensrecords.
  

## Pluginconfiguratie

1. Schakel de `plugin-file-storage-s3-pro` plugin in.
    
2. Klik op "Setting -> FileManager" om de instellingen voor bestandsbeheer te openen.

3. Klik op de knop "Add new" en selecteer "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Nadat het pop-upvenster verschijnt, ziet u een formulier met veel velden die u moet invullen. U kunt de verdere documentatie raadplegen om de relevante parameterinformatie voor de betreffende bestandsservice te verkrijgen en deze correct in het formulier in te vullen.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuratie van serviceproviders

### Amazon S3

#### Bucket aanmaken

1. Open https://ap-southeast-1.console.aws.amazon.com/s3/home om de S3-console te openen.
    
2. Klik aan de rechterkant op de knop "Create bucket".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Vul de Bucket Name (naam van de opslagbucket) in. Andere velden kunt u op de standaardinstellingen laten. Scroll naar de onderkant van de pagina en klik op de knop **"**Create**"** om het aanmaken te voltooien.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-configuratie

1. Ga naar de lijst met buckets, zoek en klik op de bucket die u zojuist hebt aangemaakt om de detailpagina te openen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klik op het tabblad "Permission", en scroll vervolgens naar beneden om de CORS-configuratiesectie te vinden.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Voer de volgende configuratie in (u kunt deze verder aanpassen) en sla op.
    
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

#### AccessKey en SecretAccessKey verkrijgen

1. Klik op de knop "Security credentials" in de rechterbovenhoek van de pagina.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scroll naar beneden naar de sectie "Access Keys" en klik op de knop "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klik om akkoord te gaan (dit is een demonstratie met het hoofdaccount; het wordt aanbevolen om IAM te gebruiken in een productieomgeving).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Sla de Access key en Secret access key op die op de pagina worden weergegeven.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parameters verkrijgen en configureren

1. De AccessKey ID en AccessKey Secret zijn de waarden die u in de vorige stap hebt verkregen. Vul deze nauwkeurig in.
    
2. Ga naar het eigenschappenpaneel van de bucketdetailpagina, waar u de Bucketnaam en Region (regio) informatie kunt vinden.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Openbare toegang (optioneel)

Dit is een optionele configuratie. Configureer dit wanneer u geüploade bestanden volledig openbaar wilt maken.

1. Ga naar het Permissions-paneel, scroll naar beneden naar Object Ownership, klik op bewerken en schakel ACL's in.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scroll naar Block public access, klik op bewerken en stel in dat ACL's de controle mogen uitoefenen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Vink Public access aan in NocoBase.

#### Configuratie van miniaturen (optioneel)

Deze configuratie is optioneel en wordt gebruikt om de grootte of effecten van afbeeldingsvoorbeelden te optimaliseren. **Houd er rekening mee dat deze implementatieoplossing extra kosten met zich mee kan brengen. Voor specifieke kosten verwijzen wij u naar de relevante AWS-voorwaarden.**

1. Bezoek [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klik onderaan de pagina op de knop `Launch in the AWS Console` om de implementatie van de oplossing te starten.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Volg de aanwijzingen om de configuratie te voltooien. Let vooral op de volgende opties:
   1. Bij het aanmaken van de stack moet u de naam opgeven van een Amazon S3-bucket die de bronafbeeldingen bevat. Vul de naam in van de bucket die u eerder hebt aangemaakt.
   2. Als u ervoor kiest om de demo-UI te implementeren, kunt u na de implementatie de functies voor afbeeldingsverwerking testen via deze interface. Selecteer in de AWS CloudFormation-console uw stack, ga naar het tabblad "Outputs", zoek de waarde die overeenkomt met de DemoUrl-sleutel en klik op de link om de demo-interface te openen.
   3. Deze oplossing maakt gebruik van de `sharp` Node.js-bibliotheek voor efficiënte afbeeldingsverwerking. U kunt de broncode downloaden van de GitHub-repository en deze naar behoefte aanpassen.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Nadat de configuratie is voltooid, wacht u tot de implementatiestatus verandert in `CREATE_COMPLETE`.

5. In de NocoBase-configuratie zijn er enkele aandachtspunten:
   1. `Thumbnail rule`: Vul afbeeldingsverwerkingsgerelateerde parameters in, bijvoorbeeld `?width=100`. Raadpleeg de [AWS-documentatie](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) voor details.
   2. `Access endpoint`: Vul de waarde van Outputs -> ApiEndpoint in na implementatie.
   3. `Full access URL style`: U moet **Ignore** aanvinken (omdat de bucketnaam al tijdens de configuratie is ingevuld, is deze niet langer nodig voor toegang).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Bucket aanmaken

1. Open de OSS-console https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klik op "Buckets" in het linkermenu en klik vervolgens op de knop "Create Bucket" om een bucket aan te maken.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Vul de bucket-gerelateerde informatie in en klik tot slot op de knop Create.
    
    1. De Bucket Name moet passen bij uw bedrijfsbehoeften; de naam mag willekeurig zijn.
        
    2. Kies de Region die het dichtst bij uw gebruikers ligt.
        
    3. Andere instellingen kunt u standaard laten of naar behoefte configureren.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS-configuratie

1. Ga naar de detailpagina van de bucket die in de vorige stap is aangemaakt.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klik in het middenmenu op "Content Security -> CORS".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klik op de knop "Create Rule", vul de relevante inhoud in, scroll naar beneden en klik op "OK". U kunt de onderstaande schermafbeelding raadplegen of gedetailleerdere instellingen configureren.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey en SecretAccessKey verkrijgen

1. Klik op "AccessKey" onder uw profielfoto in de rechterbovenhoek.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Voor demonstratiedoeleinden maken we een AccessKey aan met het hoofdaccount. In een productieomgeving wordt het aanbevolen om RAM te gebruiken voor het aanmaken. U kunt hiervoor https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair raadplegen.
    
3. Klik op de knop "Create AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Voer accountverificatie uit.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Sla de Access key en Secret access key op die op de pagina worden weergegeven.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Parameters verkrijgen en configureren

1. De AccessKey ID en AccessKey Secret zijn de waarden die in de vorige stap zijn verkregen.
    
2. Ga naar de detailpagina van de bucket om de Bucketnaam te verkrijgen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scroll naar beneden om de Region te verkrijgen (het achtervoegsel ".aliyuncs.com" is niet nodig).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Verkrijg het endpoint-adres en voeg het voorvoegsel https:// toe wanneer u dit in NocoBase invult.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuratie van miniaturen (optioneel)

Deze configuratie is optioneel en mag alleen worden gebruikt wanneer u de grootte of effecten van afbeeldingsvoorbeelden moet optimaliseren.

1. Vul de `Thumbnail rule`-gerelateerde parameters in. Voor specifieke parameterinstellingen raadpleegt u [Image Processing Parameters](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Full upload URL style` en `Full access URL style` kunnen hetzelfde blijven.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket aanmaken

1. Klik in het linkermenu op Buckets -> klik op Create Bucket om naar de aanmaakpagina te gaan.
2. Vul de Bucketnaam in en klik op de opslaan-knop.
#### AccessKey en SecretAccessKey verkrijgen

1. Ga naar Access Keys -> klik op de knop Create access key om naar de aanmaakpagina te gaan.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klik op de opslaan-knop.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Sla de Access Key en Secret Key uit het pop-upvenster op voor latere configuratie.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterconfiguratie

1. Ga naar de NocoBase -> File manager pagina.

2. Klik op de knop Add new en selecteer S3 Pro.

3. Vul het formulier in:
   - **AccessKey ID** en **AccessKey Secret** zijn de waarden die in de vorige stap zijn opgeslagen.
   - **Region**: Een zelf-gehoste MinIO heeft geen concept van een Region, dus deze kan worden geconfigureerd als "auto".
   - **Endpoint**: Vul de domeinnaam of het IP-adres van uw implementatie in.
   - De Full access URL style moet worden ingesteld op Path-Style.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

U kunt de configuratie van de hierboven genoemde bestandsservices raadplegen, aangezien de logica vergelijkbaar is.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

U kunt de configuratie van de hierboven genoemde bestandsservices raadplegen, aangezien de logica vergelijkbaar is.

#### Configuratievoorbeeld

![](https://static-docs.nocobase.com/20250414154500264.png)