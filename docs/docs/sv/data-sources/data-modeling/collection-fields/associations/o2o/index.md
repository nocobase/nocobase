:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# En-till-en

I relationen mellan anställda och personliga profiler kan varje anställd endast ha en personlig profilpost, och varje personlig profilpost kan endast motsvara en anställd. I det här fallet är relationen mellan den anställde och den personliga profilen en en-till-en-relation.

Den främmande nyckeln i en en-till-en-relation kan placeras i antingen källsamlingen eller målsamlingen. Om den representerar "har en" är det mer lämpligt att placera den främmande nyckeln i målsamlingen. Om den representerar "tillhör" är det bättre att placera den främmande nyckeln i källsamlingen.

Till exempel, i det nämnda fallet där en anställd endast har en personlig profil och den personliga profilen tillhör den anställde, är det lämpligt att placera den främmande nyckeln i samlingen för personliga profiler.

## En-till-en (Har en)

Detta indikerar att en anställd har en personlig profil.

ER-relation

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Fältkonfiguration

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb0c9426a108f87105.png)

## En-till-en (Tillhör)

Detta indikerar att en personlig profil tillhör en specifik anställd.

ER-relation

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Fältkonfiguration

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a34982da43c187c.png)

## Parameterbeskrivningar

### Källsamling

Källsamlingen, det vill säga den samling där det aktuella fältet finns.

### Målsamling

Målsamlingen, den samling som kopplas till.

### Främmande nyckel

Används för att upprätta en relation mellan två samlingar. I en en-till-en-relation kan den främmande nyckeln placeras i antingen källsamlingen eller målsamlingen. Om den representerar "har en" är det mer lämpligt att placera den främmande nyckeln i målsamlingen; om den representerar "tillhör" är det bättre att placera den främmande nyckeln i källsamlingen.

### Källnyckel <- Främmande nyckel (Främmande nyckel i målsamlingen)

Fältet som refereras av den främmande nyckelns begränsning måste vara unikt. När den främmande nyckeln placeras i målsamlingen indikerar det "har en".

### Målnyckel <- Främmande nyckel (Främmande nyckel i källsamlingen)

Fältet som refereras av den främmande nyckelns begränsning måste vara unikt. När den främmande nyckeln placeras i källsamlingen indikerar det "tillhör".

### ON DELETE

ON DELETE avser åtgärdsreglerna för den främmande nyckelreferensen i den relaterade barnsamlingen när poster tas bort från föräldrasamlingen. Det är ett alternativ som definieras när en främmande nyckelbegränsning upprättas. Vanliga ON DELETE-alternativ inkluderar:

- CASCADE: När en post i föräldrasamlingen tas bort, raderas automatiskt alla relaterade poster i barnsamlingen.
- SET NULL: När en post i föräldrasamlingen tas bort, sätts den främmande nyckelns värde i den relaterade barnsamlingen till NULL.
- RESTRICT: Standardalternativet, där borttagning av en post i föräldrasamlingen nekas om det finns relaterade poster i barnsamlingen.
- NO ACTION: Liknar RESTRICT; borttagning av en post i föräldrasamlingen nekas om det finns relaterade poster i barnsamlingen.