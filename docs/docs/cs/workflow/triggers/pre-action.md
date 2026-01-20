---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---

:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Událost před akcí

## Úvod

Plugin Událost před akcí poskytuje mechanismus pro zachycení (intercepci) akcí. Spouští se po odeslání požadavku na vytvoření, aktualizaci nebo odstranění záznamu, ale ještě před jeho zpracováním.

Pokud se ve spuštěném pracovním postupu provede uzel „Ukončit pracovní postup“, nebo pokud selže provedení jiného uzlu (například kvůli chybě nebo jinému nedokončení), bude akce formuláře zachycena. V opačném případě se zamýšlená akce provede normálně.

Ve spojení s uzlem „Zpráva odpovědi“ můžete pro tento pracovní postup nakonfigurovat zprávu, která se vrátí klientovi, a poskytnout mu tak příslušné informace. Události před akcí lze využít pro obchodní validaci nebo logické kontroly, které buď schválí, nebo zachytí požadavky klienta na vytvoření, aktualizaci a odstranění záznamů.

## Konfigurace spouštěče

### Vytvoření spouštěče

Při vytváření pracovního postupu zvolte typ „Událost před akcí“:

![Vytvoření události před akcí](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Výběr kolekce

Ve spouštěči zachycujícího pracovního postupu je nejprve nutné nakonfigurovat kolekci, ke které se akce vztahuje:

![Konfigurace zachycující události_Kolekce](https://static-docs.nocobase.com/8f7122caca59d334cf776f838d53d6.png)

Poté vyberte režim zachycení. Můžete zvolit, zda se má zachytit pouze tlačítko akce vázané na tento pracovní postup, nebo zda se mají zachytit všechny vybrané akce pro tuto kolekci (bez ohledu na to, z jakého formuláře pocházejí a bez nutnosti vázat odpovídající pracovní postup):

### Režim zachycení

![Konfigurace zachycující události_Režim zachycení](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

V současné době jsou podporovány typy akcí „Vytvořit“, „Aktualizovat“ a „Odstranit“. Lze vybrat více typů akcí současně.

## Konfigurace akce

Pokud jste v konfiguraci spouštěče vybrali režim „Spustit zachycení pouze při odeslání formuláře vázaného na tento pracovní postup“, musíte se také vrátit do rozhraní formuláře a navázat tento pracovní postup na příslušné tlačítko akce:

![Přidat objednávku_Navázat pracovní postup](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

V konfiguraci navázání pracovního postupu vyberte odpovídající pracovní postup. Obvykle postačí výchozí kontext pro spouštění dat, „Celá data formuláře“:

![Vybrat pracovní postup k navázání](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Tip}
Tlačítka, která lze navázat na Událost před akcí, v současné době podporují pouze tlačítka „Odeslat“ (nebo „Uložit“), „Aktualizovat data“ a „Odstranit“ ve formulářích pro vytvoření nebo aktualizaci. Tlačítko „Spustit pracovní postup“ není podporováno (lze jej navázat pouze na „Událost po akci“).
:::

## Podmínky pro zachycení

V „Události před akcí“ existují dvě podmínky, které způsobí zachycení odpovídající akce:

1. Pracovní postup se provede až k libovolnému uzlu „Ukončit pracovní postup“. Podobně jako v předchozích pokynech, pokud data, která spustila pracovní postup, nesplňují přednastavené podmínky v uzlu „Podmínka“, vstoupí se do větve „Ne“ a provede se uzel „Ukončit pracovní postup“. V tomto okamžiku se pracovní postup ukončí a požadovaná akce bude zachycena.
2. Selže provedení libovolného uzlu v pracovním postupu, včetně chyb při provádění uzlů nebo jiných výjimečných situací. V takovém případě se pracovní postup ukončí s odpovídajícím stavem a požadovaná akce bude rovněž zachycena. Například pokud pracovní postup volá externí data prostřednictvím „HTTP požadavku“ a požadavek selže, pracovní postup se ukončí se stavem selhání a zároveň zachytí odpovídající požadavek na akci.

Po splnění podmínek pro zachycení se odpovídající akce již neprovede. Například pokud je odeslání objednávky zachyceno, nebudou vytvořena odpovídající data objednávky.

## Související parametry pro odpovídající akci

V pracovním postupu typu „Událost před akcí“ jsou pro různé akce ve spouštěči k dispozici různá data, která lze použít jako proměnné v rámci postupu:

| Typ akce \ Proměnná | „Operátor“ | „Identifikátor role operátora“ | Parametr akce: „ID“ | Parametr akce: „Odeslaný datový objekt“ |
| ------------------ | -------- | ---------------- | -------------- | -------------------------- |
| Vytvořit záznam | ✓ | ✓ | - | ✓ |
| Aktualizovat záznam | ✓ | ✓ | ✓ | ✓ |
| Odstranit jeden nebo více záznamů | ✓ | ✓ | ✓ | - |

:::info{title=Tip}
Proměnná „Data spouštěče / Parametry akce / Odeslaný datový objekt“ v Události před akcí nejsou skutečná data z databáze, ale spíše parametry odeslané s akcí. Pokud potřebujete skutečná data z databáze, musíte je v pracovním postupu dotázat pomocí uzlu „Dotaz na data“.

Dále, pro akci odstranění je „ID“ v parametrech akce jednoduchá hodnota, pokud se týká jednoho záznamu, ale je to pole, pokud se týká více záznamů.
:::

## Výstup zprávy odpovědi

Po nakonfigurování spouštěče můžete v pracovním postupu přizpůsobit relevantní logiku rozhodování. Obvykle použijete režim větvení uzlu „Podmínka“, abyste na základě výsledků konkrétních obchodních podmínek rozhodli, zda „Ukončit pracovní postup“, a vrátili přednastavenou „Zprávu odpovědi“:

![Konfigurace zachycujícího pracovního postupu](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Tímto je konfigurace odpovídajícího pracovního postupu dokončena. Nyní můžete zkusit odeslat data, která nesplňují podmínky nakonfigurované v uzlu podmínky pracovního postupu, abyste spustili logiku zachycení. Poté uvidíte vrácenou zprávu odpovědi:

![Zpráva odpovědi s chybou](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Stav zprávy odpovědi

Pokud je uzel „Ukončit pracovní postup“ nakonfigurován tak, aby se ukončil se stavem „Úspěch“, a při provedení tohoto uzlu „Ukončit pracovní postup“ bude požadavek na akci stále zachycen, ale vrácená zpráva odpovědi se zobrazí se stavem „Úspěch“ (namísto „Chyba“):

![Zpráva odpovědi se stavem úspěch](https://static-docs.nocobase.com/9559bbf559451294b18c790e.png)

## Příklad

Kombinací výše uvedených základních pokynů si vezměme jako příklad scénář „Odeslání objednávky“. Předpokládejme, že při odeslání objednávky uživatelem potřebujeme zkontrolovat skladové zásoby všech vybraných produktů. Pokud je zásoba kteréhokoli vybraného produktu nedostatečná, odeslání objednávky se zachytí a vrátí se odpovídající zpráva. Pracovní postup bude procházet a kontrolovat každý produkt, dokud nebudou zásoby všech produktů dostatečné, v takovém případě bude pokračovat a vytvoří data objednávky pro uživatele.

Ostatní kroky jsou stejné jako v pokynech. Jelikož však jedna objednávka zahrnuje více produktů, je kromě přidání vztahu mnoho k mnoha „Objednávka“ <-- M:1 -- „Položka objednávky“ -- 1:M --> „Produkt“ v datovém modelu, nutné také přidat uzel „Cyklus“ do pracovního postupu „Událost před akcí“, který se použije k iterativní kontrole, zda je zásoba každého produktu dostatečná:

![Příklad_Pracovní postup cyklické kontroly](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Objekt pro cyklus je vybrán jako pole „Položka objednávky“ z odeslaných dat objednávky:

![Příklad_Konfigurace objektu cyklu](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Uzel podmínky v rámci cyklu se používá k určení, zda je zásoba aktuálního objektu produktu v cyklu dostatečná:

![Příklad_Podmínka v cyklu](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Ostatní konfigurace jsou stejné jako v základním použití. Když je objednávka nakonec odeslána, pokud má kterýkoli produkt nedostatečné zásoby, odeslání objednávky bude zachyceno a vrátí se odpovídající zpráva. Během testování zkuste odeslat objednávku s více produkty, kde jeden má nedostatečné zásoby a druhý dostatečné. Můžete vidět vrácenou zprávu odpovědi:

![Příklad_Zpráva odpovědi po odeslání](https://static-docs.nocobase.com/dd9e8108a237bda0241d399ac19270.png)

Jak můžete vidět, zpráva odpovědi neuvádí, že první produkt „iPhone 15 pro“ je vyprodán, ale pouze to, že druhý produkt „iPhone 14 pro“ má nedostatečné zásoby. Je to proto, že v cyklu má první produkt dostatečné zásoby, takže nebyl zachycen, zatímco druhý produkt měl nedostatečné zásoby, což zachytilo odeslání objednávky.

## Externí volání

Událost před akcí je sama o sobě vložena do fáze zpracování požadavku, takže podporuje i spouštění prostřednictvím volání HTTP API.

Pro pracovní postupy, které jsou lokálně navázány na tlačítko akce, je můžete volat takto (například tlačítko pro vytvoření v kolekci `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
Parametr URL `triggerWorkflows` je klíč pracovního postupu; více klíčů pracovních postupů je odděleno čárkami. Tento klíč lze získat najetím myši na název pracovního postupu v horní části plátna pracovního postupu:

![Pracovní postup_Klíč_Způsob zobrazení](https://static-docs.nocobase.com/20240426135108.png)

Po provedení výše uvedeného volání se spustí Událost před akcí pro odpovídající kolekci `posts`. Po synchronním zpracování odpovídajícího pracovního postupu se data normálně vytvoří a vrátí.

Pokud nakonfigurovaný pracovní postup dosáhne „Uzlu ukončení“, logika je stejná jako u akce rozhraní: požadavek bude zachycen a nebudou vytvořena žádná data. Pokud je stav uzlu ukončení nakonfigurován jako selhání, vrácený stavový kód odpovědi bude `400`; v případě úspěchu to bude `200`.

Pokud je před uzlem ukončení nakonfigurován také uzel „Zpráva odpovědi“, vygenerovaná zpráva se vrátí také ve výsledku odpovědi. Struktura pro chybu je:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Struktura zprávy, když je „Uzel ukončení“ nakonfigurován pro úspěch, je:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Tip}
Jelikož lze v pracovním postupu přidat více uzlů „Zpráva odpovědi“, datová struktura vrácené zprávy je pole.
:::

Pokud je Událost před akcí nakonfigurována v globálním režimu, nemusíte při volání HTTP API používat parametr URL `triggerWorkflows` k určení odpovídajícího pracovního postupu. Spustí se jednoduše voláním odpovídající akce kolekce.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Tip"}
Při spouštění události před akcí prostřednictvím volání HTTP API je také třeba věnovat pozornost stavu povolení pracovního postupu a tomu, zda konfigurace kolekce odpovídá, jinak se volání nemusí podařit nebo může dojít k chybě.
:::
```