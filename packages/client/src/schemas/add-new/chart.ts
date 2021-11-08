export const columnChartConfig = {
  'zh-CN': {
    data: [
      {
        type: '家具家电',
        sales: 38,
      },
      {
        type: '粮油副食',
        sales: 52,
      },
      {
        type: '生鲜水果',
        sales: 61,
      },
      {
        type: '美容洗护',
        sales: 145,
      },
      {
        type: '母婴用品',
        sales: 48,
      },
      {
        type: '进口食品',
        sales: 38,
      },
      {
        type: '食品饮料',
        sales: 38,
      },
      {
        type: '家庭清洁',
        sales: 38,
      },
    ],
    xField: 'type',
    yField: 'sales',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      type: { alias: '类别' },
      sales: { alias: '销售额' },
    },
  },
  'en-US': {
    data: [
      {
        type: 'Furniture & Appliances',
        sales: 38,
      },
      {
        type: 'Food, oil and food',
        sales: 52,
      },
      {
        type: 'Fresh fruit',
        sales: 61,
      },
      {
        type: 'Beauty care',
        sales: 145,
      },
      {
        type: 'Mother & Baby',
        sales: 48,
      },
      {
        type: 'Imported food',
        sales: 38,
      },
      {
        type: 'Food & Beverage',
        sales: 38,
      },
      {
        type: 'Household cleaning',
        sales: 38,
      },
    ],
    xField: 'type',
    yField: 'sales',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      type: { alias: 'Category' },
      sales: { alias: 'Sales' },
    },
  },
};

export const barChartConfig = {
  'zh-CN': {
    data: [
      {
        type: '家具家电',
        sales: 38,
      },
      {
        type: '粮油副食',
        sales: 52,
      },
      {
        type: '生鲜水果',
        sales: 61,
      },
      {
        type: '美容洗护',
        sales: 145,
      },
      {
        type: '母婴用品',
        sales: 48,
      },
      {
        type: '进口食品',
        sales: 38,
      },
      {
        type: '食品饮料',
        sales: 38,
      },
      {
        type: '家庭清洁',
        sales: 38,
      },
    ],
    xField: 'sales',
    yField: 'type',
    legend: { position: 'top-left' },
    barBackground: { style: { fill: 'rgba(0,0,0,0.1)' } },
    interactions: [
      {
        type: 'active-region',
        enable: false,
      },
    ],
  },
  'en-US': {
    data: [
      {
        type: 'Furniture & Appliances',
        sales: 38,
      },
      {
        type: 'Food, oil and food',
        sales: 52,
      },
      {
        type: 'Fresh fruit',
        sales: 61,
      },
      {
        type: 'Beauty care',
        sales: 145,
      },
      {
        type: 'Mother & Baby',
        sales: 48,
      },
      {
        type: 'Imported food',
        sales: 38,
      },
      {
        type: 'Food & Beverage',
        sales: 38,
      },
      {
        type: 'Household cleaning',
        sales: 38,
      },
    ],
    xField: 'sales',
    yField: 'type',
    legend: { position: 'top-left' },
    barBackground: { style: { fill: 'rgba(0,0,0,0.1)' } },
    interactions: [
      {
        type: 'active-region',
        enable: false,
      },
    ],
  },
};
