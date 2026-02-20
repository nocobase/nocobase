:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Recursos Avançados

### Paginação

#### 1. Atualização de Número de Página

##### Sintaxe
Basta inserir no seu software Office.

##### Exemplo
No Microsoft Word:
- Use a função "Inserir → Número de Página"
No LibreOffice:
- Use a função "Inserir → Campo → Número de Página"

##### Resultado
No relatório gerado, os números de página serão atualizados automaticamente em cada página.

#### 2. Geração de Sumário

##### Sintaxe
Basta inserir no seu software Office.

##### Exemplo
No Microsoft Word:
- Use a função "Inserir → Índice e Sumário → Sumário"
No LibreOffice:
- Use a função "Inserir → Sumário e Índice → Sumário, Índice ou Bibliografia"

##### Resultado
O sumário do relatório será atualizado automaticamente com base no conteúdo do documento.

#### 3. Repetição de Cabeçalhos de Tabela

##### Sintaxe
Basta inserir no seu software Office.

##### Exemplo
No Microsoft Word:
- Clique com o botão direito no cabeçalho da tabela → Propriedades da Tabela → Marque "Repetir como linha de cabeçalho no topo de cada página"
No LibreOffice:
- Clique com o botão direito no cabeçalho da tabela → Propriedades da Tabela → Aba Fluxo de Texto → Marque "Repetir cabeçalho"

##### Resultado
Quando uma tabela se estende por várias páginas, o cabeçalho será repetido automaticamente no topo de cada página.

### Internacionalização (i18n)

#### 1. Tradução de Texto Estático

##### Sintaxe
Use a tag `{t(texto)}` para internacionalizar textos estáticos:
```
{t(meeting)}
```

##### Exemplo
No template:
```
{t(meeting)} {t(apples)}
```
Dados JSON ou um dicionário de localização externo (por exemplo, para "fr-fr") fornecem as traduções correspondentes (por exemplo, "meeting" → "rendez-vous" e "apples" → "Pommes").

##### Resultado
Ao gerar o relatório, o texto será substituído pela tradução correspondente com base no idioma de destino.

#### 2. Tradução de Texto Dinâmico

##### Sintaxe
Para conteúdo de dados, use o formatador `:t`, por exemplo:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Exemplo
No template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Os dados JSON e o dicionário de localização fornecem as traduções apropriadas.

##### Resultado
Com base na condição, a saída será "lundi" ou "mardi" (usando o idioma de destino como exemplo).

### Mapeamento Chave-Valor

#### 1. Conversão de Enumeração (:convEnum)

##### Sintaxe
```
{data:convEnum(enumName)}
```
Por exemplo:
```
0:convEnum('ORDER_STATUS')
```

##### Exemplo
Em um exemplo de opções de API, o seguinte é fornecido:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
No template:
```
0:convEnum('ORDER_STATUS')
```

##### Resultado
Retorna "pending"; se o índice exceder o intervalo da enumeração, o valor original é retornado.

### Imagens Dinâmicas
:::info
Atualmente, suporta arquivos dos tipos XLSX e DOCX
:::
Você pode inserir "imagens dinâmicas" em templates de documentos, o que significa que imagens de placeholder no template serão automaticamente substituídas por imagens reais durante a renderização, com base nos dados. Este processo é muito simples e requer apenas:

1. Inserir uma imagem temporária como placeholder.

2. Editar o "Texto Alternativo" (Alt Text) dessa imagem para definir o rótulo do campo.

3. Renderizar o documento, e o sistema a substituirá automaticamente pela imagem real.

Abaixo, explicaremos os métodos de operação para DOCX e XLSX através de exemplos específicos.

#### Inserindo Imagens Dinâmicas em Arquivos DOCX
##### Substituição de Imagem Única

1. Abra seu template DOCX e insira uma imagem temporária (pode ser qualquer imagem de placeholder, como uma [imagem azul sólida](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Instruções de Formato de Imagem**

- Atualmente, as imagens de placeholder suportam apenas o formato PNG. Recomendamos usar nossa [imagem azul sólida](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png) de exemplo.
- As imagens de destino renderizadas suportam apenas os formatos PNG, JPG e JPEG. Outros tipos de imagem podem falhar na renderização.

**Instruções de Tamanho da Imagem**

Seja para DOCX ou XLSX, o tamanho final da imagem renderizada seguirá as dimensões da imagem temporária no template. Ou seja, a imagem de substituição real será automaticamente redimensionada para corresponder ao tamanho da imagem de placeholder que você inseriu. Se você deseja que a imagem renderizada tenha 150×150, use uma imagem temporária no template e ajuste-a para esse tamanho.
:::

2. Clique com o botão direito nesta imagem, edite seu "Texto Alternativo" (Alt Text) e preencha o rótulo do campo da imagem que você deseja inserir, por exemplo `{d.imageUrl}`:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Use os seguintes dados de exemplo para renderização:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
}
```

4. No resultado renderizado, a imagem temporária será substituída pela imagem real:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Substituição de Múltiplas Imagens em Loop

Se você quiser inserir um grupo de imagens no template, como uma lista de produtos, também pode implementar isso através de loops. Os passos específicos são os seguintes:
1. Suponha que seus dados sejam os seguintes:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg"
    }
  ]
}
```

2. Configure uma área de loop no template DOCX e insira imagens temporárias em cada item do loop com o Texto Alternativo (Alt Text) definido como `{d.products[i].imageUrl}`, conforme mostrado abaixo:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Após a renderização, todas as imagens temporárias serão substituídas pelas suas respectivas imagens de dados:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Inserindo Imagens Dinâmicas em Arquivos XLSX

O método de operação em templates do Excel (XLSX) é basicamente o mesmo, apenas observe os seguintes pontos:

1. Após inserir uma imagem, certifique-se de selecionar "imagem dentro da célula" em vez de ter a imagem flutuando acima da célula.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Após selecionar a célula, clique para visualizar o "Texto Alternativo" (Alt Text) e preencha o rótulo do campo, como `{d.imageUrl}`.

### Código de Barras
:::info
Atualmente, suporta arquivos dos tipos XLSX e DOCX
:::

#### Gerando Códigos de Barras (como QR codes)

A geração de códigos de barras funciona da mesma forma que as Imagens Dinâmicas, exigindo apenas três passos:

1. Insira uma imagem temporária no template para marcar a posição do código de barras.

2. Edite o "Texto Alternativo" (Alt Text) da imagem e insira o rótulo do campo no formato do código de barras, por exemplo `{d.code:barcode(qrcode)}`, onde `qrcode` é o tipo de código de barras (veja a lista de suportados abaixo).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Após a renderização, a imagem de placeholder será automaticamente substituída pela imagem do código de barras correspondente:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Tipos de Código de Barras Suportados

| Nome do Código de Barras | Tipo   |
| ------------------------ | ------ |
| QR Code                  | qrcode |