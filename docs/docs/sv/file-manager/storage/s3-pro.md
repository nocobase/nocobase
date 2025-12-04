---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Lagringsmotor: S3 (Pro)

## Introduktion

Bygger på filhanterings-pluginet och lägger till stöd för filagringstyper som är kompatibla med S3-protokollet. Alla objektlagringstjänster som stöder S3-protokollet kan enkelt integreras, till exempel Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 med flera, vilket ytterligare förbättrar lagringstjänsternas kompatibilitet och flexibilitet.

## Funktioner

1. Klientuppladdning: Filuppladdningsprocessen går inte via NocoBase-servern, utan ansluter direkt till filagringstjänsten, vilket ger en effektivare och snabbare uppladdningsupplevelse.
    
2. Privat åtkomst: När filer nås är alla URL:er signerade tillfälliga auktoriserade adresser, vilket säkerställer säkerheten och aktualiteten för filåtkomsten.


## Användningsområden

1. **Filhantering i samlingar**: Centraliserad hantering och lagring av alla uppladdade filer, med stöd för olika filtyper och lagringsmetoder för enkel klassificering och hämtning.
    
2. **Lagring av bilagefält**: Används för datalagring av bilagor som laddas upp i formulär eller poster, med stöd för koppling till specifika dataposter.
  

## Plugin-konfiguration

1. Aktivera pluginet `plugin-file-storage-s3-pro`.
    
2. Klicka på "Inställningar -> Filhanterare" för att komma till filhanterarens inställningar.

3. Klicka på knappen "Lägg till ny" och välj "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. När popup-fönstret visas ser ni ett formulär med många fält att fylla i. Ni kan hänvisa till den efterföljande dokumentationen för att få relevant parameterinformation för den aktuella filtjänsten och fylla i den korrekt i formuläret.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Konfiguration av tjänsteleverantör

### Amazon S3

#### Skapa Bucket

1. Öppna https://ap-southeast-1.console.aws.amazon.com/s3/home för att komma till S3-konsolen.
    
2. Klicka på knappen "Skapa bucket" till höger.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Fyll i Bucket-namnet. Andra fält kan lämnas med standardinställningarna. Skrolla ner till sidans nederkant och klicka på knappen **"**Skapa**"** för att slutföra skapandet.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-konfiguration

1. Gå till bucket-listan, hitta och klicka på den bucket ni just skapade för att komma till dess detaljsida.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klicka på fliken "Behörigheter" (Permission) och skrolla sedan ner för att hitta avsnittet för CORS-konfiguration.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Ange följande konfiguration (ni kan anpassa den ytterligare) och spara.
    
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

#### Hämta AccessKey och SecretAccessKey

1. Klicka på knappen "Säkerhetsuppgifter" (Security credentials) i sidans övre högra hörn.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Skrolla ner till avsnittet "Access Keys" och klicka på knappen "Skapa Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klicka för att godkänna (detta är en demonstration med rotkontot; det rekommenderas att använda IAM i en produktionsmiljö).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Spara Access key och Secret access key som visas på sidan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Hämta och konfigurera parametrar

1. AccessKey ID och AccessKey Secret är de värden ni fick i föregående steg. Fyll i dem noggrant.
    
2. Gå till egenskapspanelen på bucketens detaljsida, där ni kan hämta Bucket-namnet och Region-informationen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Offentlig åtkomst (valfritt)

Detta är en valfri konfiguration. Konfigurera den när ni behöver göra uppladdade filer helt offentliga.

1. Gå till panelen för behörigheter (Permissions), skrolla ner till Objektägarskap (Object Ownership), klicka på redigera och aktivera ACL:er.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Skrolla till Blockera offentlig åtkomst (Block public access), klicka på redigera och ställ in den för att tillåta ACL-kontroll.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Markera Offentlig åtkomst (Public access) i NocoBase.


#### Miniatyrbildskonfiguration (valfritt)

Denna konfiguration är valfri och används för att optimera bildförhandsgranskningens storlek eller effekter. **Observera att denna distributionslösning kan medföra extra kostnader. För specifika avgifter, se relevanta AWS-villkor.**

1. Besök [Dynamisk bildtransformation för Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klicka på knappen `Starta i AWS-konsolen` (Launch in the AWS Console) längst ner på sidan för att påbörja distributionen av lösningen.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Följ anvisningarna för att slutföra konfigurationen. Var särskilt uppmärksam på följande alternativ:
   1. När ni skapar stacken måste ni ange namnet på en Amazon S3-bucket som innehåller källbilderna. Ange namnet på den bucket ni skapade tidigare.
   2. Om ni väljer att distribuera demo-gränssnittet kan ni testa bildbehandlingsfunktionerna via detta gränssnitt efter distributionen. I AWS CloudFormation-konsolen väljer ni er stack, går till fliken "Utdata" (Outputs), hittar värdet som motsvarar DemoUrl-nyckeln och klickar på länken för att öppna demo-gränssnittet.
   3. Denna lösning använder `sharp` Node.js-biblioteket för effektiv bildbehandling. Ni kan ladda ner källkoden från GitHub-arkivet och anpassa den efter behov.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. När konfigurationen är klar, vänta tills distributionsstatusen ändras till `CREATE_COMPLETE`.

5. I NocoBase-konfigurationen finns det flera punkter att notera:
   1. `Miniatyrbildsregel` (Thumbnail rule): Fyll i bildbehandlingsrelaterade parametrar, till exempel `?width=100`. För detaljer, se [AWS-dokumentationen](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Åtkomstslutpunkt` (Access endpoint): Fyll i värdet för Utdata (Outputs) -> ApiEndpoint efter distributionen.
   3. `Fullständig åtkomst-URL-stil` (Full access URL style): Ni måste markera **Ignorera** (eftersom bucket-namnet redan fylldes i under konfigurationen behövs det inte längre för åtkomst).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Skapa Bucket

1. Öppna OSS-konsolen https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klicka på "Buckets" i vänstermenyn och klicka sedan på knappen "Skapa Bucket" för att påbörja skapandet av en bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Fyll i den bucket-relaterade informationen och klicka slutligen på knappen Skapa.
    
    1. Bucket-namnet bör passa era affärsbehov; namnet kan vara godtyckligt.
        
    2. Välj den Region som är närmast era användare.
        
    3. Andra inställningar kan lämnas som standard eller konfigureras baserat på era krav.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### CORS-konfiguration

1. Gå till detaljsidan för den bucket som skapades i föregående steg.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klicka på "Innehållssäkerhet -> CORS" (Content Security -> CORS) i mittenmenyn.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klicka på knappen "Skapa regel" (Create Rule), fyll i relevant innehåll, skrolla ner och klicka på "OK". Ni kan hänvisa till skärmbilden nedan eller konfigurera mer detaljerade inställningar.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Hämta AccessKey och SecretAccessKey

1. Klicka på "AccessKey" under er profilbild i det övre högra hörnet.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. För demonstrationsändamål skapar vi en AccessKey med huvudkontot. I en produktionsmiljö rekommenderas det att använda RAM för att skapa den. Ni kan hänvisa till https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. Klicka på knappen "Skapa AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Utför kontoverifiering.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Spara Access key och Secret access key som visas på sidan.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Hämta och konfigurera parametrar

1. AccessKey ID och AccessKey Secret är de värden som erhölls i föregående steg.
    
2. Gå till bucketens detaljsida för att hämta Bucket-namnet.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Skrolla ner för att hämta Region (det avslutande ".aliyuncs.com" behövs inte).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Hämta slutpunktsadressen och lägg till prefixet `https://` när ni fyller i den i NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Miniatyrbildskonfiguration (valfritt)

Denna konfiguration är valfri och bör endast användas när ni behöver optimera bildförhandsgranskningens storlek eller effekter.

1. Fyll i de `Miniatyrbildsregel`-relaterade parametrarna. För specifika parameterinställningar, se [Bildbehandlingsparametrar](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Fullständig uppladdnings-URL-stil` och `Fullständig åtkomst-URL-stil` kan hållas desamma.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Skapa Bucket

1. Klicka på menyn Buckets till vänster -> klicka på Skapa Bucket för att komma till skapandesidan.
2. Fyll i Bucket-namnet och klicka på spara-knappen.
#### Hämta AccessKey och SecretAccessKey

1. Gå till Access Keys -> klicka på knappen Skapa access key för att komma till skapandesidan.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klicka på spara-knappen.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Spara Access Key och Secret Key från popup-fönstret för senare konfiguration.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterkonfiguration

1. Gå till NocoBase -> Filhanterare-sidan.

2. Klicka på knappen Lägg till ny och välj S3 Pro.

3. Fyll i formuläret:
   - **AccessKey ID** och **AccessKey Secret** är de värden som sparades i föregående steg.
   - **Region**: En självhostad MinIO har inget Region-koncept, så den kan konfigureras som "auto".
   - **Endpoint**: Fyll i domännamnet eller IP-adressen för er distribution.
   - `Fullständig åtkomst-URL-stil` måste ställas in på Path-Style.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Ni kan hänvisa till konfigurationen av de filtjänster som nämns ovan, då logiken är liknande.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Ni kan hänvisa till konfigurationen av de filtjänster som nämns ovan, då logiken är liknande.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414154500264.png)