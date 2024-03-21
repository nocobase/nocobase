# Charts

## UI Schema

### 图表区块

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-component": "CardItem",
  "x-component-props": {
    "name": "charts"
  },
  "x-designer": "ChartV2BlockDesigner",
  "properties": {
    "u8841bjm65y": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "Grid",
      "x-decorator": "ChartV2Block",
      "x-initializer": "ChartInitializers",
      "x-uid": "j4hzcpzcc3g",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "ldc2aokaop2",
  "x-async": false,
  "x-index": 1
}
```

### 内嵌区块

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-component": "CardItem",
  "x-component-props": {
    "name": "charts"
  },
  "x-designer": "ChartV2BlockDesigner",
  "properties": {
    "g3jq3vkx9fv": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "Grid",
      "x-decorator": "ChartV2Block",
      "x-initializer": "ChartInitializers",
      "properties": {
        "ue7lfigjgm1": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid.Row",
          "properties": {
            "43ztg8gu03v": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Grid.Col",
              "properties": {
                "n47fsb4i2lm": {
                  "_isJSONSchemaObject": true,
                  "version": "2.0",
                  "type": "void",
                  "x-decorator": "ChartRendererProvider",
                  "x-decorator-props": {
                    "query": {
                      "measures": [
                        {
                          "field": ["id"]
                        }
                      ],
                      "dimensions": [],
                      "filter": {
                        "$and": []
                      },
                      "orders": [],
                      "cache": {}
                    },
                    "config": {
                      "chartType": "Built-in.line",
                      "general": {
                        "xField": "id",
                        "yField": "id",
                        "smooth": false,
                        "isStack": false
                      }
                    },
                    "collection": "a",
                    "mode": "builder"
                  },
                  "x-acl-action": "a:list",
                  "x-designer": "ChartRenderer.Designer",
                  "x-component": "CardItem",
                  "x-component-props": {
                    "size": "small"
                  },
                  "x-initializer": "ChartInitializers",
                  "properties": {
                    "y25sgh5pukl": {
                      "_isJSONSchemaObject": true,
                      "version": "2.0",
                      "type": "void",
                      "x-component": "ChartRenderer",
                      "x-component-props": {},
                      "x-uid": "ma0s07k753t",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "k6naqcx59ow",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "o8ktlccovml",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "mvn9ai9rhx8",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "mcbyby93j6n",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "sn0lczwtkgm",
  "x-async": false,
  "x-index": 1
}
```