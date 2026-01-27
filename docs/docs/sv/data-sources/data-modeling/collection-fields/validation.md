:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Fältvalidering
För att säkerställa att data i era samlingar är korrekt, säker och konsekvent, erbjuder NocoBase en funktion för fältvalidering. Denna funktion består huvudsakligen av två delar: konfiguration av regler och tillämpning av regler.

## Konfiguration av regler

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

NocoBase systemfält integrerar [Joi](https://joi.dev/api/)-regler, med stöd för följande:

### Strängtyp
Joi-strängtyper motsvarar följande NocoBase-fälttyper: Enkelradstext, Flerradstext, Telefonnummer, E-post, URL, Lösenord och UUID.
#### Gemensamma regler
- Minsta längd
- Maximala längd
- Längd
- Mönster (Reguljärt uttryck)
- Obligatorisk

#### E-post

![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)

[Visa fler alternativ](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL

![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)

[Visa fler alternativ](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID

![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)

[Visa fler alternativ](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Taltyp
Joi-taltyper motsvarar följande NocoBase-fälttyper: Heltal, Tal och Procent.
#### Gemensamma regler
- Större än
- Mindre än
- Maxvärde
- Minvärde
- Multipel

#### Heltal
Utöver de gemensamma reglerna stöder heltal-fält även [heltalsvalidering](https://joi.dev/api/?v=17.13.3#numberinteger) och [osäker heltalsvalidering](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).

![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Tal och Procent
Utöver de gemensamma reglerna stöder tal- och procentfält även [precisionsvalidering](https://joi.dev/api/?v=17.13.3#numberinteger).

![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Datumtyp
Joi-datumtyper motsvarar följande NocoBase-fälttyper: Datum (med tidszon), Datum (utan tidszon), Endast datum och Unix-tidsstämpel.

Regler som stöds för validering:
- Större än
- Mindre än
- Maxvärde
- Minvärde
- Tidsstämpelformatvalidering
- Obligatorisk

### Relationsfält
Relationsfält stöder endast validering för obligatoriska fält. Observera att validering av obligatoriska relationsfält för närvarande inte stöds i scenarier med underformulär eller undertabeller.

![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Tillämpning av valideringsregler
När ni har konfigurerat fältreglerna kommer motsvarande valideringsregler att utlösas när ni lägger till eller ändrar data.

![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Valideringsregler gäller även för undertabell- och underformulärkomponenter:

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Observera att i scenarier med underformulär eller undertabeller träder validering av obligatoriska relationsfält för närvarande inte i kraft.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Skillnader mot klientbaserad fältvalidering
Klientbaserad och serverbaserad fältvalidering används i olika applikationsscenarier. De skiljer sig markant åt i implementering och när reglerna utlöses, och behöver därför hanteras separat.

### Skillnader i konfigurationsmetod
- **Klientbaserad validering**: Konfigurera regler i redigeringsformulär (som visas i bilden nedan)
- **Serverbaserad fältvalidering**: Ställ in fältregler i datakälla → samlingskonfiguration

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Skillnader i när validering utlöses
- **Klientbaserad validering**: Utlöser validering i realtid när användare fyller i fält och visar felmeddelanden omedelbart.
- **Serverbaserad fältvalidering**: Validerar på serversidan innan data lagras, efter att data har skickats in. Felmeddelanden returneras via API-svar.
- **Tillämpningsområde**: Serverbaserad fältvalidering träder i kraft inte bara vid formulärinlämning utan utlöses även i alla scenarier som involverar tillägg eller ändring av data, såsom arbetsflöden och dataimport.
- **Felmeddelanden**: Klientbaserad validering stöder anpassade felmeddelanden, medan serverbaserad validering för närvarande inte stöder anpassade felmeddelanden.