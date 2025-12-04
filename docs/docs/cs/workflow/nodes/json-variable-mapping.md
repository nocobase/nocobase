---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Mapování JSON proměnných

> v1.6.0

## Úvod

Tento uzel slouží k mapování složitých JSON struktur z výsledků upstreamových uzlů na proměnné, které pak můžete použít v následných uzlech. Například po namapování výsledků uzlů SQL akce a HTTP požadavku můžete jejich hodnoty vlastností využít v dalších krocích pracovního postupu.

:::info{title=Tip}
Na rozdíl od uzlu pro výpočet JSON nepodporuje uzel pro mapování JSON proměnných vlastní výrazy a není založen na externím enginu. Slouží pouze k mapování hodnot vlastností v JSON struktuře, ale jeho použití je jednodušší.
:::

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku, abyste přidali uzel „Mapování JSON proměnných“:

![Vytvoření uzlu](https://static-docs.nocobase.com/20250113173635.png)

## Konfigurace uzlu

### Zdroj dat

Zdroj dat může být výsledek upstreamového uzlu nebo datový objekt v kontextu procesu. Obvykle se jedná o nestrukturovaný datový objekt, například výsledek uzlu SQL nebo uzlu HTTP požadavku.

![Zdroj dat](https://static-docs.nocobase.com/20250113173720.png)

### Vstupní ukázková data

Vložením ukázkových dat a kliknutím na tlačítko pro analýzu se automaticky vygeneruje seznam proměnných:

![Vstupní ukázková data](https://static-docs.nocobase.com/20250113182327.png)

Pokud jsou v automaticky vygenerovaném seznamu proměnné, které nepotřebujete, můžete je odstranit kliknutím na tlačítko pro smazání.

:::info{title=Tip}
Ukázková data nejsou konečným výsledkem spuštění; slouží pouze k usnadnění generování seznamu proměnných.
:::

### Cesta zahrnuje index pole

Pokud není tato volba zaškrtnuta, obsah pole bude mapován podle výchozího způsobu zpracování proměnných v pracovních postupech NocoBase. Například zadejte následující ukázku:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Ve vygenerovaných proměnných bude `b.c` reprezentovat pole `[2, 3]`.

Pokud je tato volba zaškrtnuta, cesta proměnné bude zahrnovat index pole, například `b.0.c` a `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Pokud zahrnujete indexy pole, musíte zajistit, aby indexy pole ve vstupních datech byly konzistentní; jinak dojde k chybě při analýze.

## Použití v následných uzlech

V konfiguraci následných uzlů můžete použít proměnné vygenerované uzlem pro mapování JSON proměnných:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Ačkoli JSON struktura může být složitá, po namapování stačí vybrat proměnnou pro odpovídající cestu.