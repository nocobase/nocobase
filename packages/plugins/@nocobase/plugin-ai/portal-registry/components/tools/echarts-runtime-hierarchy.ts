import {
  FunnelChart,
  GaugeChart,
  GraphChart,
  PieChart,
  RadarChart,
  SankeyChart,
  SunburstChart,
  TreeChart,
  TreemapChart,
} from "echarts/charts";
import { use as registerEChartsModules } from "echarts/core";

registerEChartsModules([
  FunnelChart,
  GaugeChart,
  GraphChart,
  PieChart,
  RadarChart,
  SankeyChart,
  SunburstChart,
  TreeChart,
  TreemapChart,
]);
