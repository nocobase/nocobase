:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Validace polí
Abychom zajistili přesnost, bezpečnost a konzistenci dat v **kolekcích**, NocoBase nabízí funkci validace polí. Tato funkce se skládá ze dvou hlavních částí: konfigurace pravidel a aplikace pravidel.

## Konfigurace pravidel
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Systémová pole NocoBase integrují pravidla [Joi](https://joi.dev/api/) a podporují následující:

### Typ řetězec
Typy řetězců Joi odpovídají následujícím typům polí NocoBase: Jednořádkový text, Víceřádkový text, Telefonní číslo, E-mail, URL, Heslo a UUID.
#### Běžná pravidla
- Minimální délka
- Maximální délka
- Délka
- Regulární výraz
- Povinné

#### E-mail
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Zobrazit více možností](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Zobrazit více možností](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Zobrazit více možností](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Typ číslo
Typy čísel Joi odpovídají následujícím typům polí NocoBase: Celé číslo, Číslo a Procenta.
#### Běžná pravidla
- Větší než
- Menší než
- Maximální hodnota
- Minimální hodnota
- Násobek

#### Celé číslo
Kromě běžných pravidel podporují celočíselná pole navíc [validaci celých čísel](https://joi.dev/api/?v=17.13.3#numberinteger) a [validaci nebezpečných celých čísel](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Číslo a procenta
Kromě běžných pravidel podporují pole typu číslo a procenta navíc [validaci přesnosti](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Typ datum
Typy dat Joi odpovídají následujícím typům polí NocoBase: Datum (s časovou zónou), Datum (bez časové zóny), Pouze datum a Unixový časový údaj.

Podporovaná pravidla validace:
- Větší než
- Menší než
- Maximální hodnota
- Minimální hodnota
- Validace formátu časového údaje
- Povinné

### Relační pole
Relační pole podporují pouze validaci povinnosti. Je důležité si uvědomit, že validace povinnosti pro relační pole není v současné době podporována ve scénářích podformulářů nebo podtabulek.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Aplikace validačních pravidel
Po konfiguraci pravidel pro pole se při přidávání nebo úpravě dat spustí odpovídající validační pravidla.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Validační pravidla platí také pro komponenty podtabulek a podformulářů:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Je důležité si uvědomit, že ve scénářích podformulářů nebo podtabulek validace povinnosti pro relační pole zatím nefunguje.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Rozdíly oproti klientské validaci polí
Klientská a serverová validace polí se používají v různých aplikačních scénářích. Mezi nimi existují významné rozdíly v implementaci a načasování spouštění pravidel, a proto je nutné je spravovat odděleně.

### Rozdíly v metodách konfigurace
- **Klientská validace**: Pravidla konfigurujete v editačních formulářích (jak je znázorněno na obrázku níže).
- **Serverová validace polí**: Pravidla pro pole nastavujete v **zdroj dat** → Konfigurace **kolekce**.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Rozdíly v načasování spouštění validace
- **Klientská validace**: Spouští validaci v reálném čase, jakmile uživatel vyplňuje pole, a okamžitě zobrazuje chybové zprávy.
- **Serverová validace polí**: Probíhá na straně serveru po odeslání dat, ještě před jejich uložením do databáze. Chybové zprávy se vracejí prostřednictvím odpovědi API.
- **Rozsah aplikace**: Serverová validace polí se uplatňuje nejen při odesílání formulářů, ale spouští se také ve všech scénářích zahrnujících přidávání nebo úpravu dat, jako jsou **pracovní postupy** a import dat.
- **Chybové zprávy**: Klientská validace podporuje vlastní chybové zprávy, zatímco serverová validace v současné době vlastní chybové zprávy nepodporuje.