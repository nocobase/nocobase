---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# CC <Badge>v1.8.2+</Badge>

## Úvod

Uzel CC slouží k odesílání určitého kontextového obsahu z průběhu spouštění pracovního postupu určeným uživatelům pro jejich informaci a nahlédnutí. Například v rámci schvalovacího nebo jiného procesu můžete relevantní informace zaslat dalším účastníkům, aby byli včas informováni o průběhu práce.

V pracovním postupu můžete nastavit více uzlů CC tak, aby se při dosažení tohoto uzlu v pracovním postupu odeslaly relevantní informace určeným příjemcům.

Obsah zaslaný jako CC se zobrazí v menu „CC pro mě“ v Centru úkolů, kde si uživatelé mohou prohlédnout veškerý obsah, který jim byl zaslán jako CC. Systém je také upozorní na nepřečtený obsah CC na základě stavu přečtení a po prohlédnutí si jej uživatelé mohou ručně označit jako přečtený.

## Vytvoření uzlu

V konfiguračním rozhraní pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „CC“:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Konfigurace uzlu

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

V konfiguračním rozhraní uzlu můžete nastavit následující parametry:

### Příjemci

Příjemci jsou skupina cílových uživatelů pro CC, může jít o jednoho nebo více uživatelů. Zdroj výběru může být statická hodnota vybraná ze seznamu uživatelů, dynamická hodnota určená proměnnou, nebo výsledek dotazu na kolekci uživatelů.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Uživatelské rozhraní

Příjemci si musí prohlédnout obsah CC v menu „CC pro mě“ v Centru úkolů. Můžete nakonfigurovat výsledky spouštěče a libovolného uzlu v kontextu pracovního postupu jako obsahové bloky.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Název úkolu

Název úkolu je titulek zobrazený v Centru úkolů. K dynamickému generování názvu můžete použít proměnné z kontextu pracovního postupu.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Centrum úkolů

Uživatelé si mohou v Centru úkolů prohlížet a spravovat veškerý obsah, který jim byl zaslán jako CC, a filtrovat a prohlížet jej na základě stavu přečtení.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Po prohlédnutí jej můžete označit jako přečtený a počet nepřečtených položek se odpovídajícím způsobem sníží.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)