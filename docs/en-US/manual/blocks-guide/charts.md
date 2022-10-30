# Charts

Currently, chart blocks in NocoBase need to be implemented via a configuration file or by writing code. The chart library uses [g2plot](https://g2plot.antv.vision/en/examples/gallery), which theoretically supports all charts on [https://g2plot.antv.vision/en/examples/gallery](https://g2plot.antv.vision/en/examples/gallery). The currently configurable charts include

- Column charts
- Bar charts
- Line charts
- Pie charts
- Area charts

## Add and edit charts

![chart-edit.gif](./charts/chart-edit.gif)

## Chart Configuration

The initial chart configuration is static JSON data

```json
{
  "data": [
    {
      "type": "furniture & appliances",
      "sales": 38
    },
    {
      "type": "食品油副食",
      "sales": 52
    },
    {
      "type": "Fresh Fruit",
      "sales": 61
    },
    {
      "type": "美容洗护",
      "sales": 145
    },
    {
      "type": "Maternity & Baby Products",
      "sales": 48
    },
    {
      "type": "Imported Food",
      "sales": 38
    },
    {
      "type": "Food & Beverage",
      "sales": 38
    },
    {
      "type": "Home Cleaning",
      "sales": 38
    }
  ],
  "xField": "type",
  "yField": "sales",
  "label": {
    "position": "middle",
    "style": {
      "fill": "#FFFFFF",
      "opacity": 0.6
    }
  },
  "xAxis": {
    "label": {
      "autoHide": true,
      "autoRotate": false
    }
  },
  "meta": {
    "type": {
      "alias": "category"
    },
    "sales": {
      "alias": "sales"
    }
  }
}

```

Data supports expression, NocoBase has a built-in `requestChartData(config)` function for custom chart data requests. Parameters are described in: [https://github.com/axios/axios#request-config](https://github.com/axios/axios#request-config)

Example.

```json
{
  "data": "{{requestChartData({ url: 'collectionName:getColumnChartData' })}}",
  "xField": "type",
  "yField": "sales",
  "label": {
    "position": "middle",
    "style": {
      "fill": "#FFFFFF",
      "opacity": 0.6
    }
  },
  "xAxis": {
    "label": {
      "autoHide": true,
      "autoRotate": false
    }
  },
  "meta": {
    "type": {
      "alias": "category"
    },
    "sales": {
      "alias": "sales"
    }
  }
}

```

HTTP API example.

```bash
GET /api/collectionName:getColumnChartData

Response Body
{
    "data": [
    {
      "type": "furniture & appliances",
      "sales": 38
    },
    {
      "type": "食品油副食",
      "sales": 52
    },
    {
      "type": "Fresh Fruit",
      "sales": 61
    },
    {
      "type": "美容洗护",
      "sales": 145
    },
    {
      "type": "Maternity & Baby Products",
      "sales": 48
    },
    {
      "type": "Imported Food",
      "sales": 38
    },
    {
      "type": "Food & Beverage",
      "sales": 38
    },
    {
      "type": "Home Cleaning",
      "sales": 38
    }
  ]
}

```

## Server-side implementation

Add a custom getColumnChartData method to the data table named collectionName.

```js
app.resourcer.registerActionHandlers({
  'collectionName:getColumnChartData': (ctx, next) => {
    // The data to be output
    ctx.body = [];
    await next();
  },
});

```

## Video

### Static data
https://user-images.githubusercontent.com/1267426/198877269-1c56562b-167a-4808-ada3-578f0872bce1.mp4

### Dynamic data
https://user-images.githubusercontent.com/1267426/198877336-6bd85f0b-17c5-40a5-9442-8045717cc7b0.mp4

### More charts

Theoretically supports all charts on [https://g2plot.antv.vision/en/examples/gallery](https://g2plot.antv.vision/en/examples/gallery)

https://user-images.githubusercontent.com/1267426/198877347-7fc2544c-b938-4e34-8a83-721b3f62525e.mp4

## JS Expressions

Syntax

```js
{
  "key1": "{{ js expression }}"
}
```

https://user-images.githubusercontent.com/1267426/198877361-808a51cc-6c91-429f-8cfc-8ad7f747645a.mp4

