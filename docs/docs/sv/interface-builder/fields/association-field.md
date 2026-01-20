:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Relationsfältskomponenter

## Introduktion

NocoBase:s relationsfältskomponenter är utformade för att hjälpa er att bättre visa och hantera relaterad data. Oavsett relationstyp är dessa komponenter flexibla och mångsidiga, vilket gör att ni kan välja och konfigurera dem efter era specifika behov.

### Rullgardinsmeny

För alla relationsfält, förutom när målsamlingen är en filsamling, är standardkomponenten i redigeringsläge en rullgardinsmeny. Alternativen i rullgardinsmenyn visar värdet från rubrikfältet, vilket gör den lämplig för scenarier där relaterad data snabbt kan väljas genom att visa viktig fältinformation.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Mer information finns i [Rullgardinsmeny](/interface-builder/fields/specific/select)

### Väljare

Väljaren presenterar data i ett popup-fönster. Ni kan konfigurera vilka fält som ska visas i väljaren (inklusive fält från kapslade relationer), vilket möjliggör ett mer precist urval av relaterad data.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Mer information finns i [Väljare](/interface-builder/fields/specific/picker)

### Underformulär

När ni hanterar mer komplex relationsdata kan det vara obekvämt att använda en rullgardinsmeny eller väljare. I sådana fall behöver ni ofta öppna popup-fönster. För dessa scenarier kan underformuläret användas. Det gör att ni direkt kan hantera fälten i den associerade samlingen på den aktuella sidan eller i det aktuella popup-blocket utan att upprepade gånger öppna nya popup-fönster, vilket gör arbetsflödet smidigare. Relationer på flera nivåer visas som kapslade formulär.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Mer information finns i [Underformulär](/interface-builder/fields/specific/sub-form)

### Undertabell

Undertabellen visar en-till-många- eller många-till-många-relationsposter i tabellformat. Den erbjuder ett tydligt, strukturerat sätt att visa och hantera relaterad data, och stöder masskapande av ny data eller val av befintlig data att associera.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Mer information finns i [Undertabell](/interface-builder/fields/specific/sub-table)

### Underdetalj

Underdetaljen är den motsvarande komponenten till underformuläret i läsläge. Den stöder visning av data med kapslade relationer på flera nivåer.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Mer information finns i [Underdetalj](/interface-builder/fields/specific/sub-detail)

### Filhanterare

Filhanteraren är en relationsfältskomponent som specifikt används när relationens målsamling är en filsamling.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Mer information finns i [Filhanterare](/interface-builder/fields/specific/file-manager)

### Rubrik

Rubrikfältskomponenten är en relationsfältskomponent som används i läsläge. Genom att konfigurera rubrikfältet kan ni konfigurera den motsvarande fältkomponenten.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Mer information finns i [Rubrik](/interface-builder/fields/specific/title)