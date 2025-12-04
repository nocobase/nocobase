---
pkg: '@nocobase/plugin-acl'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Použití v uživatelském rozhraní

## Oprávnění datových bloků

Viditelnost datových bloků v rámci **kolekce** je řízena oprávněními pro akci „zobrazit“. Individuální konfigurace mají přednost před globálním nastavením.

Příklad: V rámci globálních oprávnění má role „admin“ plný přístup, ale pro **kolekci** „Objednávky“ mohou být nakonfigurována individuální oprávnění, která ji učiní neviditelnou.

Globální konfigurace oprávnění:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Individuální konfigurace oprávnění pro **kolekci** „Objednávky“:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

V uživatelském rozhraní se pak nezobrazí žádné bloky **kolekce** „Objednávky“.

Kompletní proces konfigurace:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Oprávnění polí

**Zobrazit**: Určuje, zda jsou konkrétní pole viditelná na úrovni pole, což umožňuje řídit, která pole jsou viditelná pro určité role v rámci **kolekce** „Objednávky“.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

V uživatelském rozhraní se v bloku **kolekce** „Objednávky“ zobrazí pouze pole s nakonfigurovanými oprávněními. Systémová pole (Id, CreatedAt, LastUpdatedAt) si zachovávají oprávnění k zobrazení i bez specifické konfigurace.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Upravit**: Řídí, zda lze pole upravovat a ukládat (aktualizovat).

  Nakonfigurujte oprávnění k úpravám pro pole **kolekce** „Objednávky“ (pole „Množství“ a „Související položky“ mají oprávnění k úpravám):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  V uživatelském rozhraní se v bloku formuláře pro úpravu v rámci **kolekce** „Objednávky“ zobrazí pouze pole s oprávněním k úpravám.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Kompletní proces konfigurace:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Přidat**: Určuje, zda lze pole přidávat (vytvářet).

  Nakonfigurujte oprávnění k přidávání pro pole **kolekce** „Objednávky“ (pole „Číslo objednávky“, „Množství“, „Položky“ a „Zásilka“ mají oprávnění k přidávání):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  V uživatelském rozhraní se v bloku formuláře pro přidání v rámci **kolekce** „Objednávky“ zobrazí pouze pole s oprávněním k přidávání.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exportovat**: Řídí, zda lze pole exportovat.
- **Importovat**: Řídí, zda pole podporují import.

## Oprávnění akcí

Individuálně nakonfigurovaná oprávnění mají nejvyšší prioritu. Pokud jsou nakonfigurována specifická oprávnění, přepisují globální nastavení; jinak se použijí globální nastavení.

- **Přidat**: Řídí, zda je tlačítko akce „Přidat“ viditelné v rámci bloku.

  Nakonfigurujte individuální oprávnění akcí pro **kolekci** „Objednávky“ tak, aby bylo povoleno přidávání:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Pokud je akce „Přidat“ povolena, tlačítko „Přidat“ se zobrazí v oblasti akcí bloku **kolekce** „Objednávky“ v uživatelském rozhraní.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Zobrazit**: Určuje, zda je datový blok viditelný.

  Globální konfigurace oprávnění (bez oprávnění k zobrazení):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Individuální konfigurace oprávnění pro **kolekci** „Objednávky“:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  V uživatelském rozhraní zůstanou datové bloky pro všechny ostatní **kolekce** skryté, ale blok **kolekce** „Objednávky“ se zobrazí.

  Kompletní příklad procesu konfigurace:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Upravit**: Řídí, zda je tlačítko akce „Upravit“ zobrazeno v rámci bloku.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Oprávnění akcí lze dále upřesnit nastavením rozsahu dat.

  Příklad: Nastavení **kolekce** „Objednávky“ tak, aby uživatelé mohli upravovat pouze svá vlastní data:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Smazat**: Řídí, zda je tlačítko akce „Smazat“ viditelné v rámci bloku.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exportovat**: Řídí, zda je tlačítko akce „Exportovat“ viditelné v rámci bloku.

- **Importovat**: Řídí, zda je tlačítko akce „Importovat“ viditelné v rámci bloku.

## Oprávnění vztahů

### Jako pole

- Oprávnění pole vztahu jsou řízena oprávněními pole zdrojové **kolekce**. To řídí, zda se zobrazí celá komponenta pole vztahu.

  Příklad: V **kolekci** „Objednávky“ má pole vztahu „Zákazník“ pouze oprávnění k zobrazení, importu a exportu.

  ![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

  V uživatelském rozhraní to znamená, že pole vztahu „Zákazník“ se nezobrazí v blocích akcí „Přidat“ a „Upravit“ **kolekce** „Objednávky“.

  Kompletní příklad procesu konfigurace:

  ![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Oprávnění pro pole v rámci komponenty pole vztahu (například podtabulky nebo podformuláře) jsou určena oprávněními cílové **kolekce**.

  Když je komponenta pole vztahu podformulář:

  Jak je ukázáno níže, pole vztahu „Zákazník“ v **kolekci** „Objednávky“ má všechna oprávnění, zatímco **kolekce** „Zákazníci“ je nastavena pouze pro čtení.

  Individuální konfigurace oprávnění pro **kolekci** „Objednávky“, kde pole vztahu „Zákazník“ má všechna oprávnění pole:

  ![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

  Individuální konfigurace oprávnění pro **kolekci** „Zákazníci“, kde pole mají oprávnění pouze k zobrazení:

  ![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

  V uživatelském rozhraní je pole vztahu „Zákazník“ viditelné v bloku **kolekce** „Objednávky“. Nicméně, když se přepne na podformulář, pole v podformuláři jsou viditelná v detailním zobrazení, ale nezobrazují se v akcích „Přidat“ a „Upravit“.

  Kompletní příklad procesu konfigurace:

  ![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

  Pro další kontrolu oprávnění pro pole v rámci podformuláře můžete udělit oprávnění jednotlivým polím.

  Jak je ukázáno, **kolekce** „Zákazníci“ je nakonfigurována s individuálními oprávněními polí (pole „Jméno zákazníka“ není viditelné a nelze jej upravovat).

  ![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

  Kompletní příklad procesu konfigurace:

  ![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

  Když je komponenta pole vztahu podtabulka, situace je konzistentní s podformulářem:

  Jak je ukázáno, pole vztahu „Zásilka“ v **kolekci** „Objednávky“ má všechna oprávnění, zatímco **kolekce** „Zásilky“ je nastavena pouze pro čtení.

  V uživatelském rozhraní je toto pole vztahu viditelné. Nicméně, když se přepne na podtabulku, pole v podtabulce jsou viditelná v akci „Zobrazit“, ale ne v akcích „Přidat“ a „Upravit“.

  ![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

  Pro další kontrolu oprávnění pro pole v rámci podtabulky můžete udělit oprávnění jednotlivým polím:

  ![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Jako blok

- Viditelnost bloku vztahu je řízena oprávněními cílové **kolekce** odpovídajícího pole vztahu a je nezávislá na oprávněních pole vztahu.

  Příklad: Zda se zobrazí blok vztahu „Zákazník“, je řízeno oprávněními **kolekce** „Zákazníci“.

  ![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Pole v rámci bloku vztahu jsou řízena oprávněními polí v cílové **kolekci**.

  Jak je ukázáno, můžete nastavit oprávnění k zobrazení pro jednotlivá pole v **kolekci** „Zákazníci“.

  ![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)