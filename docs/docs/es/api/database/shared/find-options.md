:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Estado vacío



# Estado vacío

El componente de estado vacío (Empty) se utiliza para mostrar un marcador de posición cuando no hay datos.

## Cuándo usarlo

- Para dar una indicación explícita al usuario cuando no hay datos disponibles.
- Para guiar el proceso de creación en escenarios de inicialización.

## Uso básico

<div style="width: 600px; border: 1px solid #f0f0f0; padding: 20px">
  <ClientOnly>
    <empty-basic-usage />
  </ClientOnly>
</div>

```yaml
- type: empty
  name: empty
  title: Estado vacío
```

## Imagen personalizada

Puede personalizar la imagen a través de la propiedad `image`.

<div style="width: 600px; border: 1px solid #f0f0f0; padding: 20px">
  <ClientOnly>
    <empty-customize-image />
  </ClientOnly>
</div>

```yaml
- type: empty
  name: empty
  title: Estado vacío
  image: https://www.nocobase.com/images/logo.png
```

## Descripción personalizada

Puede personalizar la descripción a través de la propiedad `description`.

<div style="width: 600px; border: 1px solid #f0f0f0; padding: 20px">
  <ClientOnly>
    <empty-customize-description />
  </ClientOnly>
</div>

```yaml
- type: empty
  name: empty
  title: Estado vacío
  description: Descripción personalizada
```

## Contenido personalizado

Puede personalizar el contenido a través de la propiedad `children`.

<div style="width: 600px; border: 1px solid #f0f0f0; padding: 20px">
  <ClientOnly>
    <empty-customize-children />
  </ClientOnly>
</div>

```yaml
- type: empty
  name: empty
  title: Estado vacío
  children:
    - type: button
      name: button
      title: Crear
```

## API

### Empty
| Propiedad | Descripción | Tipo | Valor por defecto |
| --- | --- | --- | --- |
| `image` | Imagen personalizada | `string` | - |
| `description` | Descripción personalizada | `string` | - |
| `children` | Contenido personalizado | `Schema` | - |