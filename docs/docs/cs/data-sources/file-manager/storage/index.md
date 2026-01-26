:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

## Vestavěné enginy

NocoBase aktuálně podporuje následující typy vestavěných enginů:

- [Lokální úložiště](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Při instalaci systému se automaticky přidá lokální úložný engine, který můžete ihned začít používat. Můžete také přidávat nové enginy nebo upravovat parametry těch stávajících.

## Společné parametry enginu

Kromě specifických parametrů pro jednotlivé typy enginů jsou níže uvedeny společné parametry (jako příklad je použito lokální úložiště):

![Příklad konfigurace úložného enginu](https://static-docs.nocobase.com/20240529115151.png)

### Název

Název úložného enginu, sloužící k jeho snadné identifikaci.

### Systémový název

Systémový název úložného enginu, sloužící k jeho identifikaci systémem. Musí být v rámci systému unikátní. Pokud jej nevyplníte, systém jej automaticky vygeneruje.

### Základní URL pro přístup

Předpona URL adresy, přes kterou je soubor externě přístupný. Může jít o základní URL CDN, například: „`https://cdn.nocobase.com/app`“ (bez koncového „`/`“).

### Cesta

Relativní cesta použitá při ukládání souborů. Tato část bude při přístupu automaticky připojena k finální URL adrese. Například: „`user/avatar`“ (bez úvodního nebo koncového „`/`“).

### Limit velikosti souboru

Limit velikosti souborů nahrávaných do tohoto úložného enginu. Soubory přesahující tuto nastavenou velikost nebude možné nahrát. Výchozí systémový limit je 20 MB a maximální nastavitelný limit je 1 GB.

### Typ souboru

Můžete omezit typy nahrávaných souborů pomocí formátu popisu syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Například `image/*` představuje soubory obrázků. Více typů lze oddělit čárkami, například `image/*, application/pdf` povoluje soubory typu obrázek a PDF.

### Výchozí úložný engine

Po zaškrtnutí se tento engine nastaví jako výchozí úložný engine systému. Pokud pole přílohy nebo **kolekce** souborů nespecifikuje úložný engine, budou všechny nahrané soubory uloženy do výchozího úložného enginu. Výchozí úložný engine nelze smazat.

### Ponechat soubory při mazání záznamů

Po zaškrtnutí zůstanou nahrané soubory v úložném enginu zachovány, i když jsou datové záznamy v tabulce příloh nebo **kolekci** souborů smazány. Ve výchozím nastavení není tato možnost zaškrtnuta, což znamená, že při smazání záznamů budou soubory v úložném enginu také smazány.

:::info{title=Tip}
Po nahrání souboru se finální přístupová cesta skládá z několika částí:

```
<Základní URL pro přístup>/<Cesta>/<Název souboru><Přípona>
```

Například: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::