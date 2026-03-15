---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/file-manager/file-preview/ms-office).
:::

# Náhled souborů Office <Badge>v1.8.11+</Badge>

Plugin Náhled souborů Office slouží k prohlížení souborů ve formátech Office, jako jsou Word, Excel, PowerPoint atd., přímo v aplikacích NocoBase.  
Je založen na veřejné online službě poskytované společností Microsoft, která umožňuje vložit soubory přístupné přes veřejnou URL adresu do rozhraní pro náhled. Uživatelé si tak mohou tyto soubory prohlížet v prohlížeči bez nutnosti stahování nebo používání aplikací Office.

## Uživatelská příručka

Ve výchozím nastavení je tento plugin ve stavu **vypnuto**. Po aktivaci ve správci pluginů jej lze ihned používat bez nutnosti další konfigurace.

![Rozhraní pro aktivaci pluginu](https://static-docs.nocobase.com/20250731140048.png)

Po úspěšném nahrání souboru Office (Word / Excel / PowerPoint) do pole typu soubor v kolekci klikněte na příslušnou ikonu souboru nebo odkaz. Obsah souboru se zobrazí ve vyskakovacím nebo vloženém okně náhledu.

![Příklad operace náhledu](https://static-docs.nocobase.com/20250731143231.png)

## Princip implementace

Náhled vložený tímto pluginem závisí na veřejné online službě Microsoftu (Office Web Viewer). Hlavní proces je následující:

- Frontend vygeneruje veřejně přístupnou URL adresu pro soubor nahraný uživatelem (včetně podepsaných URL z S3);
- Plugin načte náhled souboru v prvku iframe pomocí následující adresy:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<Veřejná URL souboru>
  ```

- Služba Microsoftu požádá o obsah souboru z této URL, vykreslí jej a vrátí stránku k zobrazení.

## Poznámky

- Vzhledem k tomu, že tento plugin závisí na online službě Microsoftu, ujistěte se, že je síťové připojení v pořádku a že jsou související služby Microsoftu dostupné.
- Microsoft bude přistupovat k poskytnuté URL adrese souboru a obsah souboru bude krátkodobě uložen v mezipaměti (cache) jejich serveru pro účely vykreslení náhledu. To představuje určité riziko pro soukromí. Pokud máte v tomto ohledu obavy, doporučujeme funkci náhledu poskytovanou tímto pluginem nepoužívat[^1].
- Soubor určený k náhledu musí mít veřejně přístupnou URL adresu. Za běžných okolností soubory nahrané do NocoBase automaticky generují přístupné veřejné odkazy (včetně podepsaných URL generovaných pluginem S3-Pro), ale pokud má soubor nastavená přístupová oprávnění nebo je uložen v interní síti, náhled nebude fungovat[^2].
- Služba nepodporuje ověřování přihlášením ani zdroje v soukromém úložišti. Například soubory přístupné pouze v rámci interní sítě nebo vyžadující přihlášení nelze pomocí této funkce zobrazit.
- Po načtení obsahu souboru službou Microsoftu může být tento obsah na krátkou dobu uložen v mezipaměti. I když je zdrojový soubor smazán, náhled může být po určitou dobu stále přístupný.
- Existují doporučená omezení velikosti souborů: u souborů Word a PowerPoint se doporučuje nepřekračovat 10 MB, u souborů Excel 5 MB, aby byla zajištěna stabilita náhledu[^3].
- Pro tuto službu v současné době neexistuje jasný oficiální popis licence pro komerční využití. Při používání prosím sami vyhodnoťte rizika[^4].

## Podporované formáty souborů

Plugin podporuje náhledy pouze pro následující formáty souborů Office na základě MIME typu nebo přípony souboru:

- Dokumenty Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) nebo `application/msword` (`.doc`)
- Tabulky Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) nebo `application/vnd.ms-excel` (`.xls`)
- Prezentace PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) nebo `application/vnd.ms-powerpoint` (`.ppt`)
- Text OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Pro soubory v jiných formátech nebude funkce náhledu tohoto pluginu aktivována.

[^1]: [Jaký je stav služby view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Přístup odepřen nebo neveřejné soubory nelze zobrazit](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - Limity velikosti souborů pro Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Komerční využití Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)