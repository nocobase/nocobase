---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Úložiště: S3 (Pro)

## Úvod

Tento plugin rozšiřuje možnosti správy souborů o podporu úložišť kompatibilních s protokolem S3. Snadno tak integrujete jakoukoli službu objektového úložiště podporující S3, jako je Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 a další. Tím se výrazně zvyšuje kompatibilita a flexibilita vašich úložných řešení.

## Klíčové vlastnosti

1. **Nahrávání na straně klienta**: Soubory se nahrávají přímo do úložné služby, aniž by procházely serverem NocoBase. To zajišťuje efektivnější a rychlejší nahrávání.
    
2. **Soukromý přístup**: Při přístupu k souborům jsou všechny URL adresy dočasné, podepsané a autorizované, což zaručuje bezpečnost a časovou omezenost přístupu k souborům.

## Případy použití

1. **Správa kolekcí souborů**: Centralizované ukládání a správa všech nahraných souborů. Podporuje různé typy souborů a metody ukládání pro snadnou kategorizaci a vyhledávání.
    
2. **Ukládání příloh v polích**: Slouží k ukládání dat příloh nahraných ve formulářích nebo záznamech, s podporou propojení s konkrétními datovými záznamy.
  

## Konfigurace pluginu

1. Povolte plugin `plugin-file-storage-s3-pro`.
    
2. Klikněte na „Nastavení -> Správce souborů“ (Setting -> FileManager) pro vstup do nastavení správy souborů.

3. Klikněte na tlačítko „Přidat nové“ (Add new) a vyberte „S3 Pro“.

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Po zobrazení vyskakovacího okna uvidíte formulář s mnoha poli k vyplnění. Relevantní informace o parametrech pro danou souborovou službu naleznete v následující dokumentaci a správně je vyplňte do formuláře.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfigurace poskytovatele služby

### Amazon S3

#### Vytvoření bucketu

1. Otevřete https://ap-southeast-1.console.aws.amazon.com/s3/home pro vstup do konzole S3.
    
2. Klikněte na tlačítko „Vytvořit bucket“ (Create bucket) vpravo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Vyplňte název bucketu (Bucket Name). Ostatní pole můžete ponechat s výchozím nastavením. Přejděte na konec stránky a klikněte na tlačítko **„Vytvořit“** (Create) pro dokončení.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurace CORS

1. Přejděte do seznamu bucketů, najděte a klikněte na právě vytvořený bucket pro vstup na jeho stránku s podrobnostmi.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Klikněte na záložku „Oprávnění“ (Permission) a poté sjeďte dolů, abyste našli sekci konfigurace CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Zadejte následující konfiguraci (můžete ji dále přizpůsobit) a uložte ji.
    
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

#### Získání AccessKey a SecretAccessKey

1. Klikněte na tlačítko „Bezpečnostní pověření“ (Security credentials) v pravém horním rohu stránky.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Sjeďte dolů do sekce „Přístupové klíče“ (Access Keys) a klikněte na tlačítko „Vytvořit přístupový klíč“ (Create Access Key).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Klikněte na „Souhlasím“ (Agree). (Toto je ukázka s hlavním účtem; v produkčním prostředí se doporučuje používat IAM.)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Uložte zobrazený přístupový klíč (Access key) a tajný přístupový klíč (Secret access key).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Získání a konfigurace parametrů

1. AccessKey ID a Secret AccessKey jsou hodnoty, které jste získali v předchozím kroku. Vyplňte je prosím přesně.
    
2. Přejděte na panel vlastností (properties) stránky s podrobnostmi o bucketu, kde získáte název bucketu a informace o regionu (Region).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Veřejný přístup (volitelné)

Toto je volitelná konfigurace. Nastavte ji, pokud potřebujete, aby nahrané soubory byly zcela veřejné.

1. Přejděte na panel Oprávnění (Permissions), sjeďte dolů k Vlastnictví objektů (Object Ownership), klikněte na „Upravit“ (edit) a povolte ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Sjeďte k „Blokovat veřejný přístup“ (Block public access), klikněte na „Upravit“ (edit) a nastavte povolení kontroly pomocí ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. V NocoBase zaškrtněte „Veřejný přístup“ (Public access).

#### Konfigurace náhledů (volitelné)

Tato konfigurace je volitelná a používá se k optimalizaci velikosti nebo efektů náhledů obrázků. **Upozorňujeme, že toto řešení nasazení může generovat dodatečné náklady. Konkrétní poplatky naleznete v příslušných podmínkách AWS.**

1. Navštivte [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klikněte na tlačítko `Launch in the AWS Console` ve spodní části stránky pro zahájení nasazení řešení.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Dokončete konfiguraci podle pokynů. Zvláštní pozornost věnujte následujícím možnostem:
   1. Při vytváření stacku musíte zadat název Amazon S3 bucketu, který obsahuje zdrojové obrázky. Zadejte název bucketu, který jste vytvořili dříve.
   2. Pokud se rozhodnete nasadit demo uživatelské rozhraní, můžete po nasazení testovat funkce zpracování obrázků prostřednictvím tohoto rozhraní. V konzoli AWS CloudFormation vyberte svůj stack, přejděte na záložku „Výstupy“ (Outputs), najděte hodnotu odpovídající klíči `DemoUrl` a kliknutím na odkaz otevřete demo rozhraní.
   3. Toto řešení používá knihovnu `sharp` Node.js pro efektivní zpracování obrázků. Zdrojový kód si můžete stáhnout z repozitáře GitHub a podle potřeby jej přizpůsobit.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Po dokončení konfigurace počkejte, až se stav nasazení změní na `CREATE_COMPLETE`.

5. V konfiguraci NocoBase je třeba věnovat pozornost několika bodům:
   1. `Thumbnail rule`: Vyplňte parametry související se zpracováním obrázků, například `?width=100`. Podrobnosti naleznete v [dokumentaci AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Vyplňte hodnotu `Outputs -> ApiEndpoint` po nasazení.
   3. `Full access URL style`: Je třeba zaškrtnout **Ignorovat** (Ignore) (protože název bucketu byl již vyplněn během konfigurace a při přístupu již není potřeba).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Vytvoření bucketu

1. Otevřete konzoli OSS https://oss.console.aliyun.com/overview.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Klikněte na „Buckety“ (Buckets) v levém menu a poté na tlačítko „Vytvořit bucket“ (Create Bucket) pro zahájení vytváření bucketu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Vyplňte související informace o bucketu a nakonec klikněte na tlačítko „Vytvořit“ (Create).
    
    1. Název bucketu (Bucket Name) by měl odpovídat vašim obchodním potřebám; název může být libovolný.
        
    2. Vyberte region (Region), který je nejblíže vašim uživatelům.
        
    3. Ostatní nastavení můžete ponechat výchozí, nebo je nakonfigurovat podle svých požadavků.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Konfigurace CORS

1. Přejděte na stránku s podrobnostmi o bucketu vytvořeném v předchozím kroku.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klikněte na „Zabezpečení obsahu -> CORS“ (Content Security -> CORS) ve středním menu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klikněte na tlačítko „Vytvořit pravidlo“ (Create Rule), vyplňte relevantní obsah, sjeďte dolů a klikněte na „OK“. Můžete se řídit níže uvedeným snímkem obrazovky nebo provést podrobnější nastavení.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Získání AccessKey a SecretAccessKey

1. Klikněte na „AccessKey“ pod ikonou vašeho profilu v pravém horním rohu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Zde, pro účely demonstrace, vytváříme AccessKey pomocí hlavního účtu. V produkčním prostředí se doporučuje použít RAM pro vytvoření. Můžete se podívat na https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair.
    
3. Klikněte na tlačítko „Vytvořit AccessKey“ (Create AccessKey).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Proveďte ověření účtu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Uložte zobrazený přístupový klíč (Access key) a tajný přístupový klíč (Secret access key).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Získání a konfigurace parametrů

1. AccessKey ID a Secret AccessKey jsou hodnoty získané v předchozím kroku.
    
2. Přejděte na stránku s podrobnostmi o bucketu, abyste získali název bucketu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Sjeďte dolů, abyste získali region (Region) (koncovka „.aliyuncs.com“ není potřeba).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Získejte adresu koncového bodu (endpoint) a při vyplňování do NocoBase je nutné přidat předponu `https://`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurace náhledů (volitelné)

Tato konfigurace je volitelná a měla by být použita pouze v případě, že potřebujete optimalizovat velikost nebo efekty náhledů obrázků.

1. Vyplňte parametry související s `Thumbnail rule`. Konkrétní nastavení parametrů naleznete v [Parametrech zpracování obrázků](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Full upload URL style` a `Full access URL style` mohou zůstat stejné.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Vytvoření bucketu

1. Klikněte na menu „Buckety“ (Buckets) vlevo -> klikněte na „Vytvořit bucket“ (Create Bucket) pro vstup na stránku vytvoření.
2. Po vyplnění názvu bucketu klikněte na tlačítko „Uložit“ (save).

#### Získání AccessKey a SecretAccessKey

1. Přejděte na „Přístupové klíče“ (Access Keys) -> klikněte na tlačítko „Vytvořit přístupový klíč“ (Create access key) pro vstup na stránku vytvoření.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klikněte na tlačítko „Uložit“ (save).

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Uložte Access Key a Secret Key z vyskakovacího okna pro pozdější konfiguraci.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurace parametrů

1. Přejděte na stránku NocoBase -> Správce souborů (File manager).

2. Klikněte na tlačítko „Přidat nové“ (Add new) a vyberte „S3 Pro“.

3. Vyplňte formulář:
   - **AccessKey ID** a **AccessKey Secret** jsou texty uložené v předchozím kroku.
   - **Region**: Samostatně nasazené MinIO nemá koncept regionu, takže jej můžete nakonfigurovat jako „auto“.
   - **Endpoint**: Vyplňte název domény nebo IP adresu vaší nasazené služby.
   - `Full access URL style` musí být nastaven na „Path-Style“.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Můžete se řídit konfigurací výše uvedených souborových služeb, logika je podobná.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Můžete se řídit konfigurací výše uvedených souborových služeb, logika je podobná.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414154500264.png)