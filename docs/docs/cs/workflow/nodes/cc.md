---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/workflow/nodes/cc).
:::

# Kopie (CC) <Badge>v1.8.2+</Badge>

## Představení

Uzel Kopie (CC) slouží k odesílání určitého kontextového obsahu z procesu provádění pracovního postupu určeným uživatelům pro jejich informaci a nahlédnutí. Například ve schvalovacím nebo jiném procesu lze relevantní informace zaslat v kopii ostatním účastníkům, aby mohli včas sledovat postup prací.

V pracovním postupu lze nastavit více uzlů Kopie (CC), aby se při spuštění daného uzlu odeslaly relevantní informace určeným příjemcům.

Obsah kopie se zobrazí v nabídce „Kopie pro mě“ v Centru úkolů, kde si uživatelé mohou prohlédnout veškerý obsah, který jim byl zaslán v kopii. Systém také upozorní na nepřečtený obsah a uživatelé jej mohou po prohlédnutí ručně označit jako přečtený.

## Vytvoření uzlu

V rozhraní pro konfiguraci pracovního postupu klikněte na tlačítko plus („+“) v postupu a přidejte uzel „Kopie (CC)“:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Konfigurace uzlu

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

V rozhraní pro konfiguraci uzlu můžete nastavit následující parametry:

### Příjemci

Příjemci jsou kolekce cílových uživatelů pro kopii, což může být jeden nebo více uživatelů. Zdroj může být statická hodnota vybraná ze seznamu uživatelů, dynamická hodnota určená proměnnou nebo výsledek dotazu v kolekci uživatelů.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Uživatelské rozhraní

Příjemci si prohlížejí obsah kopie v nabídce „Kopie pro mě“ v Centru úkolů. Jako bloky obsahu můžete nakonfigurovat výsledky spouštěče a libovolného uzlu v kontextu pracovního postupu.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Karta úkolu <Badge>2.0+</Badge>

Lze použít ke konfiguraci karet úkolů v seznamu „Kopie pro mě“ v Centru úkolů.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Na kartě lze libovolně konfigurovat obchodní pole, která chcete zobrazit (s výjimkou polí relací).

Po vytvoření úkolu kopie v pracovním postupu bude v seznamu Centra úkolů viditelná přizpůsobená karta úkolu:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Název úkolu

Název úkolu je titulek zobrazený v Centru úkolů. K dynamickému generování názvu můžete použít proměnné z kontextu pracovního postupu.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Centrum úkolů

Uživatelé mohou v Centru úkolů prohlížet a spravovat veškerý obsah, který jim byl zaslán v kopii, a filtrovat jej podle stavu přečtení.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Po prohlédnutí jej lze označit jako přečtený, čímž se sníží počet nepřečtených položek.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)