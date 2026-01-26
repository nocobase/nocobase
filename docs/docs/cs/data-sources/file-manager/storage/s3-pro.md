---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Úložiště souborů: S3 (Pro)

## Úvod

Rozšířením pluginu pro správu souborů tato verze přidává podporu pro typy úložišť souborů kompatibilní s protokolem S3. Jakákoli služba objektového úložiště podporující protokol S3 může být snadno integrována, například Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 atd., čímž se dále zvyšuje kompatibilita a flexibilita úložných služeb.

## Funkce

1. **Nahrávání klientem:** Soubory se nahrávají přímo do úložné služby, aniž by procházely serverem NocoBase, což zajišťuje efektivnější a rychlejší nahrávání.

2. **Soukromý přístup:** Všechny URL adresy souborů jsou podepsané dočasné autorizační adresy, což zajišťuje bezpečný a časově omezený přístup k souborům.

## Případy použití

1. **Správa tabulek souborů:** Centrální správa a ukládání všech nahraných souborů, podpora různých typů souborů a metod ukládání pro snadnou klasifikaci a vyhledávání.

2. **Úložiště přílohových polí:** Ukládání příloh nahraných prostřednictvím formulářů nebo záznamů a jejich propojení s konkrétními datovými záznamy.

## Konfigurace pluginu

1. Povolte plugin `plugin-file-storage-s3-pro`.

2. Přejděte do "Nastavení -> Správce souborů" (FileManager) pro přístup k nastavení správy souborů.

3. Klikněte na tlačítko "Přidat nové" (Add new) a vyberte "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. V zobrazeném vyskakovacím okně uvidíte podrobný formulář k vyplnění. Pro získání relevantních parametrů pro vaši souborovou službu a jejich správné vyplnění do formuláře se podívejte do následující dokumentace.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfigurace poskytovatele služby

### Amazon S3

#### Vytvoření bucketu

1. Navštivte [konzoli Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Klikněte na tlačítko "Vytvořit bucket" (Create bucket) na pravé straně.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Vyplňte název bucketu (Bucket Name), ostatní pole ponechte ve výchozím nastavení, sjeďte dolů na konec stránky a kliknutím na tlačítko **"Vytvořit"** (Create) dokončete proces.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfigurace CORS

1. V seznamu bucketů najděte a klikněte na nově vytvořený bucket, abyste se dostali na jeho detailní stránku.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Přejděte na záložku "Oprávnění" (Permission) a sjeďte dolů k sekci konfigurace CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Zadejte následující konfiguraci (podle potřeby ji můžete upřesnit) a uložte ji.

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

1. Klikněte na tlačítko "Bezpečnostní pověření" (Security credentials) v pravém horním rohu stránky.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Sjeďte dolů k sekci "Přístupové klíče" (Access Keys) a klikněte na tlačítko "Vytvořit přístupový klíč" (Create Access Key).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Souhlaste s podmínkami (pro produkční prostředí se doporučuje používat IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Uložte zobrazený Access Key a Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Získání a konfigurace parametrů

1. Použijte AccessKey ID a Secret AccessKey, které jste získali v předchozím kroku. Vyplňte je prosím přesně.

2. Přejděte na panel vlastností detailní stránky bucketu, kde naleznete název bucketu a informace o regionu (oblasti).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Veřejný přístup (volitelné)

Toto je volitelná konfigurace. Nastavte ji, pokud potřebujete, aby nahrané soubory byly zcela veřejné.

1. Na panelu Oprávnění (Permissions) sjeďte k "Vlastnictví objektů" (Object Ownership), klikněte na "Upravit" (Edit) a povolte ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Sjeďte k "Blokovat veřejný přístup" (Block public access), klikněte na "Upravit" (Edit) a nastavte, aby bylo povoleno řízení pomocí ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. V NocoBase zaškrtněte "Veřejný přístup" (Public access).

#### Konfigurace náhledů (volitelné)

Tato konfigurace je volitelná a měla by být použita, pokud potřebujete optimalizovat velikost nebo efekt náhledu obrázku. **Upozorňujeme, že toto nasazení může vést k dodatečným nákladům. Pro více podrobností se podívejte na podmínky a ceny AWS.**

1. Navštivte [Dynamickou transformaci obrázků pro Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klikněte na tlačítko `Spustit v konzoli AWS` (Launch in the AWS Console) ve spodní části stránky pro zahájení nasazení.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Postupujte podle pokynů k dokončení konfigurace. Zvláštní pozornost věnujte následujícím možnostem:
   1. Při vytváření zásobníku (stacku) musíte zadat název bucketu Amazon S3, který obsahuje zdrojové obrázky. Zadejte prosím název bucketu, který jste vytvořili dříve.
   2. Pokud jste se rozhodli nasadit demo uživatelské rozhraní, po nasazení můžete toto rozhraní použít k testování funkcí zpracování obrázků. V konzoli AWS CloudFormation vyberte svůj zásobník, přejděte na záložku "Výstupy" (Outputs), najděte hodnotu odpovídající klíči `DemoUrl` a kliknutím na odkaz otevřete demo rozhraní.
   3. Toto řešení používá knihovnu `sharp` Node.js pro efektivní zpracování obrázků. Zdrojový kód si můžete stáhnout z repozitáře GitHub a přizpůsobit jej podle potřeby.
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Po dokončení konfigurace počkejte, dokud se stav nasazení nezmění na `CREATE_COMPLETE`.

5. V konfiguraci NocoBase si prosím všimněte následujících bodů:
   1. `Pravidlo náhledů` (Thumbnail rule): Vyplňte parametry pro zpracování obrázků, například `?width=100`. Podrobnosti naleznete v [dokumentaci AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Přístupový koncový bod` (Access endpoint): Zadejte hodnotu z Outputs -> ApiEndpoint po nasazení.
   3. `Styl URL pro plný přístup` (Full access URL style): Je třeba zaškrtnout **Ignorovat** (Ignore) (protože název bucketu byl již vyplněn v konfiguraci, při přístupu již není potřeba).
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Vytvoření bucketu

1. Otevřete [konzoli OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. V levém menu vyberte "Buckety" (Buckets) a poté klikněte na tlačítko "Vytvořit bucket" (Create Bucket) pro zahájení vytváření úložiště.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Vyplňte podrobnosti o bucketu a nakonec klikněte na tlačítko "Vytvořit" (Create).

    1. Název bucketu (Bucket Name): Zvolte podle vašich obchodních potřeb, název je libovolný.

    2. Region: Vyberte oblast, která je nejblíže vašim uživatelům.

    3. Ostatní nastavení můžete ponechat výchozí, nebo je podle potřeby upravit.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Konfigurace CORS

1. Přejděte na detailní stránku bucketu, který jste vytvořili v předchozím kroku.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. V prostředním menu klikněte na "Zabezpečení obsahu -> CORS" (Content Security -> CORS).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klikněte na tlačítko "Vytvořit pravidlo" (Create Rule), vyplňte příslušná pole, sjeďte dolů a klikněte na "OK". Můžete se řídit níže uvedeným snímkem obrazovky, nebo provést podrobnější nastavení.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Získání AccessKey a SecretAccessKey

1. Klikněte na "AccessKey" pod ikonou vašeho účtu v pravém horním rohu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Pro účely demonstrace použijeme k vytvoření AccessKey hlavní účet. V produkčním prostředí se doporučuje použít RAM. Pokyny naleznete v [dokumentaci Alibaba Cloud](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp).

3. Klikněte na tlačítko "Vytvořit AccessKey" (Create AccessKey).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Proveďte ověření účtu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Uložte zobrazený Access Key a Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Získání a konfigurace parametrů

1. AccessKey ID a Secret AccessKey jsou hodnoty získané v předchozím kroku.

2. Přejděte na detailní stránku bucketu a získejte název bucketu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Sjeďte dolů a získejte Region (přípona ".aliyuncs.com" není potřeba).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Získejte adresu koncového bodu (endpoint) a při zadávání do NocoBase je nutné přidat předponu `https://`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfigurace náhledů (volitelné)

Tato konfigurace je volitelná a měla by být použita pouze v případě, že potřebujete optimalizovat velikost nebo efekt náhledu obrázku.

1. Vyplňte relevantní parametry pro `Pravidlo náhledů` (Thumbnail rule). Konkrétní nastavení parametrů naleznete v [dokumentaci Alibaba Cloud o zpracování obrázků](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. Nastavení `Styl URL pro plné nahrávání` (Full upload URL style) a `Styl URL pro plný přístup` (Full access URL style) ponechte stejné.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Vytvoření bucketu

1. Klikněte na menu **Buckety** (Buckets) vlevo -> Klikněte na **Vytvořit bucket** (Create Bucket) pro otevření stránky pro vytvoření.
2. Zadejte název bucketu a poté klikněte na tlačítko **Uložit** (Save).

#### Získání AccessKey a SecretAccessKey

1. Přejděte na **Přístupové klíče** (Access Keys) -> Klikněte na tlačítko **Vytvořit přístupový klíč** (Create access key) pro otevření stránky pro vytvoření.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klikněte na tlačítko **Uložit** (Save).

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Uložte **Access Key** a **Secret Key** z vyskakovacího okna pro budoucí konfiguraci.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfigurace parametrů

1. Přejděte na stránku **Správce souborů** (File manager) v NocoBase.

2. Klikněte na tlačítko **Přidat nové** (Add new) a vyberte **S3 Pro**.

3. Vyplňte formulář:
   - **AccessKey ID** a **AccessKey Secret**: Použijte hodnoty uložené z předchozího kroku.
   - **Region**: MinIO nasazené v privátním prostředí nemá koncept regionu; můžete jej nastavit na `"auto"`.
   - **Endpoint**: Zadejte název domény nebo IP adresu vaší nasazené služby.
   - Je třeba nastavit **Styl URL pro plný přístup** (Full access URL style) na **Path-Style**.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Můžete se řídit konfiguracemi pro výše uvedené souborové služby. Logika je podobná.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Můžete se řídit konfiguracemi pro výše uvedené souborové služby. Logika je podobná.

#### Příklad konfigurace

![](https://static-docs.nocobase.com/20250414154500264.png)

## Uživatelská příručka

Podívejte se na [dokumentaci pluginu správce souborů](/data-sources/file-manager).