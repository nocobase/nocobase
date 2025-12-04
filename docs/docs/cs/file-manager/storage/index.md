:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

## Úvod

Úložné enginy slouží k ukládání souborů do specifických služeb, jako je lokální úložiště (uložení na pevný disk serveru), cloudové úložiště a další.

Před nahráním jakýchkoli souborů je vždy nutné nejprve nakonfigurovat úložný engine. Během instalace systém automaticky přidá lokální úložný engine, který můžete ihned použít. Můžete také přidat nové enginy nebo upravit parametry stávajících.

## Typy úložných enginů

NocoBase v současné době nativně podporuje následující typy enginů:

- [Lokální úložiště](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Během instalace systém automaticky přidá lokální úložný engine, který můžete ihned použít. Můžete také přidat nové enginy nebo upravit parametry stávajících.

## Běžné parametry

Kromě specifických parametrů pro jednotlivé typy enginů jsou následující parametry společné (jako příklad je použito lokální úložiště):

![Příklad konfigurace úložného enginu souborů](https://static-docs.nocobase.com/20240529115151.png)

### Název

Název úložného enginu, sloužící pro snadnou identifikaci.

### Systémový název

Systémový název úložného enginu, používaný pro identifikaci systémem. Musí být v rámci systému unikátní. Pokud jej nevyplníte, systém jej automaticky vygeneruje.

### Předpona veřejné URL adresy

Část URL adresy, která tvoří předponu pro veřejně přístupný soubor. Může jít o základní URL adresu CDN, například: „`https://cdn.nocobase.com/app`“ (bez koncového „`/`“).

### Cesta

Relativní cesta použitá při ukládání souborů. Tato část bude při přístupu automaticky připojena k finální URL adrese. Například: „`user/avatar`“ (bez počátečního a koncového „`/`“).

### Limit velikosti souboru

Limit velikosti souborů nahrávaných do tohoto úložného enginu. Soubory překračující tuto velikost nebude možné nahrát. Výchozí systémový limit je 20 MB a lze jej nastavit až na maximálně 1 GB.

### Typy souborů

Můžete omezit typy souborů, které lze nahrát, a to pomocí [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntaxe. Například: `image/*` představuje obrazové soubory. Více typů lze oddělit čárkami, například: `image/*, application/pdf` povoluje obrazové soubory a soubory PDF.

### Výchozí úložný engine

Po zaškrtnutí se tento engine nastaví jako výchozí úložný engine systému. Pokud pole pro přílohy nebo **kolekce** souborů nespecifikuje úložný engine, nahrané soubory se uloží do výchozího úložného enginu. Výchozí úložný engine nelze odstranit.

### Zachovat soubor při smazání záznamu

Po zaškrtnutí se nahraný soubor v úložném enginu zachová i v případě, že je smazán datový záznam v tabulce příloh nebo **kolekci** souborů. Ve výchozím nastavení není tato možnost zaškrtnuta, což znamená, že soubor v úložném enginu bude smazán společně se záznamem.

:::info{title=Tip}
Po nahrání souboru se výsledná přístupová cesta skládá z několika částí:

```
<Předpona veřejné URL adresy>/<Cesta>/<Název souboru><Přípona>
```

Například: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::