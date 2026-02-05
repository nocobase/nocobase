:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozdělení služeb <Badge>v1.9.0+</Badge>

## Úvod

Obvykle běží všechny služby aplikace NocoBase v jedné instanci Node.js. Jak se funkcionalita v aplikaci s růstem byznysu postupně stává složitější, některé časově náročné služby mohou ovlivnit celkový výkon.

Pro zlepšení výkonu aplikace NocoBase podporuje v klastrovém režimu rozdělení služeb aplikace tak, aby běžely na různých uzlech. Tím se zabrání tomu, aby problémy s výkonem jedné služby ovlivnily celou aplikaci a znemožnily tak normální reakci na uživatelské požadavky.

Na druhou stranu to také umožňuje cílené horizontální škálování konkrétních služeb, čímž se zvyšuje využití zdrojů klastru.

Při nasazení NocoBase v klastru lze různé služby rozdělit a nasadit tak, aby běžely na různých uzlech. Následující diagram znázorňuje strukturu rozdělení:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Které služby lze rozdělit

### Asynchronní pracovní postup

**KLÍČ služby**: `workflow:process`

Pracovní postupy v asynchronním režimu budou po spuštění zařazeny do fronty k provedení. Tyto pracovní postupy lze považovat za úlohy na pozadí a uživatelé obvykle nemusí čekat na vrácení výsledků. Zejména u složitých a časově náročných procesů s vysokým objemem spuštění se doporučuje je rozdělit a spustit na nezávislých uzlech.

### Další asynchronní úlohy na uživatelské úrovni

**KLÍČ služby**: `async-task:process`

To zahrnuje úlohy vytvořené uživatelskými akcemi, jako je asynchronní import a export. V případě velkých objemů dat nebo vysoké souběžnosti se doporučuje je rozdělit a spustit na nezávislých uzlech.

## Jak rozdělit služby

Rozdělení různých služeb na různé uzly se provádí konfigurací proměnné prostředí `WORKER_MODE`. Tuto proměnnou prostředí lze konfigurovat podle následujících pravidel:

- `WORKER_MODE=<prázdné>`: Pokud není nakonfigurováno nebo je nastaveno jako prázdné, režim workeru je stejný jako u aktuální samostatné instance, přijímá všechny požadavky a zpracovává všechny úlohy. To je kompatibilní s aplikacemi, které dříve nebyly konfigurovány.
- `WORKER_MODE=!`: Režim workeru je pouze pro zpracování požadavků, nezpracovává žádné úlohy.
- `WORKER_MODE=workflow:process,async-task:process`: Konfigurováno s jedním nebo více identifikátory služeb (oddělenými čárkami), režim workeru je pouze pro zpracování úloh pro tyto identifikátory, nezpracovává požadavky.
- `WORKER_MODE=*`: Režim workeru je pro zpracování všech úloh na pozadí, bez ohledu na modul, ale nezpracovává požadavky.
- `WORKER_MODE=!,workflow:process`: Režim workeru je pro zpracování požadavků a současně zpracovává úlohy pro konkrétní identifikátor.
- `WORKER_MODE=-`: Režim workeru nezpracovává žádné požadavky ani úlohy (tento režim je vyžadován v rámci worker procesu).

Například v prostředí K8S mohou uzly se stejnou funkcionalitou rozdělení používat stejnou konfiguraci proměnné prostředí, což usnadňuje horizontální škálování konkrétního typu služby.

## Příklady konfigurace

### Více uzlů s odděleným zpracováním

Předpokládejme, že existují tři uzly: `node1`, `node2` a `node3`. Lze je konfigurovat následovně:

- `node1`: Zpracovává pouze uživatelské UI požadavky, konfigurujte `WORKER_MODE=!`.
- `node2`: Zpracovává pouze úlohy pracovních postupů, konfigurujte `WORKER_MODE=workflow:process`.
- `node3`: Zpracovává pouze asynchronní úlohy, konfigurujte `WORKER_MODE=async-task:process`.

### Více uzlů se smíšeným zpracováním

Předpokládejme, že existují čtyři uzly: `node1`, `node2`, `node3` a `node4`. Lze je konfigurovat následovně:

- `node1` a `node2`: Zpracovávají všechny běžné požadavky, konfigurujte `WORKER_MODE=!`, a zátěžový balancér automaticky distribuuje požadavky na tyto dva uzly.
- `node3` a `node4`: Zpracovávají všechny ostatní úlohy na pozadí, konfigurujte `WORKER_MODE=*`.

## Reference pro vývojáře

Při vývoji byznys pluginů můžete rozdělit služby, které spotřebovávají značné zdroje, na základě požadavků scénáře. Toho lze dosáhnout následujícími způsoby:

1. Definujte nový identifikátor služby, například `my-plugin:process`, pro konfiguraci proměnné prostředí a poskytněte k němu dokumentaci.
2. V byznys logice na straně serveru pluginu použijte rozhraní `app.serving()` k ověření prostředí a určení, zda má aktuální uzel poskytovat konkrétní službu na základě proměnné prostředí.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// V kódu pluginu na straně serveru
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Zpracujte byznys logiku pro tuto službu
} else {
  // Nezpracovávejte byznys logiku pro tuto službu
}
```