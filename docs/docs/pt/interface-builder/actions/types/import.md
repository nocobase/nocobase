---
pkg: "@nocobase/plugin-action-import"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Importar

## Introdução

Importe dados usando um modelo Excel. Você pode configurar quais campos importar, e o modelo será gerado automaticamente.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Instruções de Importação

### Campos do Tipo Número

Suporta números e porcentagens. Textos como `N/A` ou `-` serão filtrados.

| Número1 | Porcentagem | Número2 | Número3 |
| ------- | ----------- | ------- | ------- |
| 123     | 25%         | N/A     | -       |

Após a conversão para JSON:

```ts
{
  "Número1": 123,
  "Porcentagem": 0.25,
  "Número2": null,
  "Número3": null,
}
```

### Campos do Tipo Booleano

Textos de entrada suportados (o inglês não diferencia maiúsculas de minúsculas):

- `Yes`, `Y`, `True`, `1`, `Sim`
- `No`, `N`, `False`, `0`, `Não`

| Campo1 | Campo2 | Campo3 | Campo4 | Campo5 |
| ------ | ------ | ------ | ------ | ------ |
| Não    | Sim    | Y      | true   | 0      |

Após a conversão para JSON:

```ts
{
  "Campo1": false,
  "Campo2": true,
  "Campo3": true,
  "Campo4": true,
  "Campo5": false,
}
```

### Campos do Tipo Data

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Após a conversão para JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Campos do Tipo Seleção

Tanto os valores das opções quanto os rótulos das opções podem ser usados como texto de importação. Múltiplas opções são separadas por vírgulas (`,`, `，`) ou vírgulas enumerativas (`、`).

Por exemplo, as opções para o campo `Prioridade` incluem:

| Valor da Opção | Rótulo da Opção |
| -------------- | --------------- |
| low            | Baixa           |
| medium         | Média           |
| high           | Alta            |

Tanto os valores das opções quanto os rótulos das opções podem ser usados como texto de importação.

| Prioridade |
| ---------- |
| Alta       |
| low        |

Após a conversão para JSON:

```ts
[{ Prioridade: 'high' }, { Prioridade: 'low' }];
```

### Campos de Divisão Administrativa da China

| Região1             | Região2             |
| ------------------- | ------------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Após a conversão para JSON:

```ts
{
  "Região1": ["11","1101"],
  "Região2": ["12","1201"]
}
```

### Campos de Anexo

| Anexo                                    |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Após a conversão para JSON:

```ts
{
  "Anexo": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Campos do Tipo Relacionamento

Múltiplas entradas de dados são separadas por vírgulas (`,`, `，`) ou vírgulas enumerativas (`、`).

| Departamento/Nome | Categoria/Título |
| ----------------- | ---------------- |
| Equipe de Desenvolvimento | Categoria1, Categoria2 |

Após a conversão para JSON:

```ts
{
  "Departamento": [1], // 1 é o ID do registro para o departamento chamado "Equipe de Desenvolvimento"
  "Categoria": [1,2], // 1,2 são os IDs dos registros para as categorias intituladas "Categoria1" e "Categoria2"
}
```

### Campos do Tipo JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Após a conversão para JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Tipos de Geometria de Mapa

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Após a conversão para JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Formato de Importação Personalizado

Registre um `ValueParser` personalizado através do método `db.registerFieldValueParsers()`, por exemplo:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// Quando um campo do tipo=point é importado, os dados serão analisados por PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Exemplo de Importação

| Point |
| ----- |
| 1,2   |

Após a conversão para JSON:

```ts
{
  "Point": [1,2]
}
```

## Configurações da Ação

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Configure os campos importáveis

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Regras de Vinculação](/interface-builder/actions/action-settings/linkage-rule): Exiba/oculte o botão dinamicamente;
- [Editar Botão](/interface-builder/actions/action-settings/edit-button): Edite o título, tipo e ícone do botão;