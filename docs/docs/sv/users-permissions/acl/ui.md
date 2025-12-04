---
pkg: '@nocobase/plugin-acl'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Tillämpning i användargränssnittet

## Behörigheter för datablock

Synligheten för datablock i en **samling** styrs av behörigheter för 'visa'-åtgärden. Individuella konfigurationer har högre prioritet än globala inställningar.

Som exempel: Under globala behörigheter har rollen "admin" full åtkomst, men **samlingen** "Ordrar" kan ha individuella behörigheter konfigurerade som gör den osynlig.

Global behörighetskonfiguration:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

**Samlingen** "Ordrar" individuell behörighetskonfiguration:

![](https://static-docs.nocobase.com/a88caba1cad47001c16010bf402a4a2c1.png)

I användargränssnittet visas inga block från **samlingen** "Ordrar".

Så här ser den fullständiga konfigurationsprocessen ut:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Fältbehörigheter

**Visa**: Bestämmer om specifika fält är synliga på fältnivå. Detta gör att ni kan styra vilka fält som är synliga för vissa roller inom **samlingen** "Ordrar".

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

I användargränssnittet visas endast fält med konfigurerade behörigheter inom blocket för **samlingen** "Ordrar". Systemfält (Id, Skapad den, Senast uppdaterad) behåller visningsbehörigheter även utan specifik konfiguration.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Redigera**: Styr om fält kan redigeras och sparas (uppdateras).

  Som visas, konfigurera redigeringsbehörigheter för fält i **samlingen** "Ordrar" (kvantitet och associerade varor har redigeringsbehörighet):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  I användargränssnittet visas endast fält med redigeringsbehörighet i redigeringsformulärblocket inom **samlingen** "Ordrar".

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Så här ser den fullständiga konfigurationsprocessen ut:

  ![](https://static-docs.nocobase.com/1dbe559a97c2e052e194e50edc74a7.gif)

- **Lägg till**: Bestämmer om fält kan läggas till (skapas).

  Som visas, konfigurera behörigheter för att lägga till fält i **samlingen** "Ordrar" (ordernummer, kvantitet, varor och försändelse har behörighet att läggas till):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  I användargränssnittet visas endast fält med behörighet att läggas till i formulärblocket för 'lägg till'-åtgärden inom **samlingen** "Ordrar".

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exportera**: Styr om fält kan exporteras.
- **Importera**: Styr om fält stöder import.

## Åtgärdsbehörigheter

Individuellt konfigurerade behörigheter har högst prioritet. Om specifika behörigheter är konfigurerade åsidosätter de globala inställningar; annars tillämpas de globala inställningarna.

- **Lägg till**: Styr om knappen för 'lägg till'-åtgärden är synlig inom ett block.

  Som visas, konfigurera individuella åtgärdsbehörigheter för **samlingen** "Ordrar" för att tillåta att lägga till:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  När 'lägg till'-åtgärden är tillåten, visas knappen för att lägga till i åtgärdsområdet för **samlingen** "Ordrar" i användargränssnittet.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Visa**: Styr om datablocket visas.

  Global behörighetskonfiguration (ingen visningsbehörighet):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  **Samlingen** "Ordrar" individuell behörighetskonfiguration:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  I användargränssnittet förblir datablock för alla andra **samlingar** dolda, men blocket för **samlingen** "Ordrar" visas.

  Så här ser den fullständiga exempelkonfigurationsprocessen ut:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Redigera**: Styr om knappen för 'redigera'-åtgärden visas inom ett block.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Åtgärdsbehörigheter kan förfinas ytterligare genom att ställa in dataskopet.

  Som exempel, ställ in **samlingen** "Ordrar" så att användare endast kan redigera sina egna data:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Ta bort**: Styr visningen av knappen för 'ta bort'-åtgärden i blocket.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exportera**: Styr visningen av knappen för 'exportera'-åtgärden i blocket.

- **Importera**: Styr visningen av knappen för 'importera'-åtgärden i blocket.

## Relationsbehörigheter

### Som ett fält

- Behörigheterna för ett relationsfält styrs av fältbehörigheterna i käll**samlingen**. Detta styr om hela relationsfältkomponenten visas.

Som exempel, i **samlingen** "Ordrar" har relationsfältet "Kund" endast behörigheter för att visa, importera och exportera.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

I användargränssnittet innebär detta att relationsfältet "Kund" inte kommer att visas i blocken för 'lägg till'- och 'redigera'-åtgärder i **samlingen** "Ordrar".

Så här ser den fullständiga exempelkonfigurationsprocessen ut:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Behörigheterna för fält inom relationsfältkomponenten (som en under-tabell eller underformulär) bestäms av behörigheterna för mål**samlingen**.

När relationsfältkomponenten är ett underformulär:

Som visas nedan, har relationsfältet "Kund" i **samlingen** "Ordrar" alla behörigheter, medan **samlingen** "Kunder" i sig är inställd på skrivskyddad.

Individuell behörighetskonfiguration för **samlingen** "Ordrar", där relationsfältet "Kund" har alla fältbehörigheter:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Individuell behörighetskonfiguration för **samlingen** "Kunder", där fält endast har visningsbehörigheter:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

I användargränssnittet är relationsfältet "Kund" synligt i blocket för **samlingen** "Ordrar". Men när det växlas till ett underformulär, är fälten inom underformuläret synliga i detaljvyn men visas inte vid 'lägg till'- och 'redigera'-åtgärderna.

Så här ser den fullständiga exempelkonfigurationsprocessen ut:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

För att ytterligare kontrollera behörigheter för fält inom underformuläret kan ni ge behörigheter till enskilda fält.

Som visas, är **samlingen** "Kunder" konfigurerad med individuella fältbehörigheter (Kundnamn är inte synligt och inte redigerbart).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Så här ser den fullständiga exempelkonfigurationsprocessen ut:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

När relationsfältkomponenten är en under-tabell är situationen densamma som för ett underformulär:

Som visas, har relationsfältet "Försändelse" i **samlingen** "Ordrar" alla behörigheter, medan **samlingen** "Försändelser" är inställd på skrivskyddad.

I användargränssnittet är detta relationsfält synligt. Men när det växlas till en under-tabell, är fälten inom under-tabellen synliga i 'visa'-åtgärden men inte i 'lägg till'- och 'redigera'-åtgärderna.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

För att ytterligare kontrollera behörigheter för fält inom under-tabellen kan ni ge behörigheter till enskilda fält:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Som ett block

- Synligheten för ett relationsblock styrs av behörigheterna för mål**samlingen** för det motsvarande relationsfältet, och är oberoende av relationsfältets egna behörigheter.

Som exempel, om relationsblocket "Kund" visas styrs av behörigheterna för **samlingen** "Kunder".

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Fälten inom ett relationsblock styrs av fältbehörigheterna i mål**samlingen**.

Som visas, kan ni ställa in visningsbehörigheter för enskilda fält i **samlingen** "Kunder".

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)