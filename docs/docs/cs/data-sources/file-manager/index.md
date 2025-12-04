---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Správce souborů

## Úvod

Plugin Správce souborů poskytuje kolekci souborů, pole příloh a enginy pro ukládání souborů pro efektivní správu souborů. Soubory jsou záznamy ve speciálním typu kolekce, známé jako kolekce souborů, která ukládá metadata souborů a lze ji spravovat prostřednictvím Správce souborů. Pole příloh jsou specifická asociační pole spojená s kolekcí souborů. Plugin podporuje více metod ukládání, včetně lokálního úložiště, Alibaba Cloud OSS, Amazon S3 a Tencent Cloud COS.

## Uživatelská příručka

### Kolekce souborů

Vestavěná je kolekce `attachments` pro ukládání všech souborů spojených s poli příloh. Kromě toho můžete vytvářet nové kolekce souborů pro ukládání specifických souborů.

[Více se dozvíte v dokumentaci ke Kolekci souborů](/data-sources/file-manager/file-collection)

### Pole příloh

Pole příloh jsou specifická asociační pole související s kolekcí souborů, která lze vytvořit pomocí typu pole „Příloha“ nebo nakonfigurovat prostřednictvím pole „Relace“.

[Více se dozvíte v dokumentaci k Poli příloh](/data-sources/file-manager/field-attachment)

### Engine pro ukládání souborů

Engine pro ukládání souborů se používá k ukládání souborů do specifických služeb, včetně lokálního úložiště (ukládání na pevný disk serveru), cloudového úložiště atd.

[Více se dozvíte v dokumentaci k Enginu pro ukládání souborů](./storage/index.md)

### HTTP API

Nahrávání souborů lze zpracovat prostřednictvím HTTP API, viz [HTTP API](./http-api.md).

## Vývoj

*