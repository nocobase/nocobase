import {
  CustomChart,
  HeatmapChart,
  LinesChart,
  MapChart,
  ParallelChart,
  ThemeRiverChart,
} from "echarts/charts";
import { use as registerEChartsModules } from "echarts/core";

registerEChartsModules([
  CustomChart,
  HeatmapChart,
  LinesChart,
  MapChart,
  ParallelChart,
  ThemeRiverChart,
]);
