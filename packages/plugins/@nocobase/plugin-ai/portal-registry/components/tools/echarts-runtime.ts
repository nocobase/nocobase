import {
  AriaComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  AriaComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
  CanvasRenderer,
]);

echarts.registerTheme("nocobase-dark", {
  darkMode: true,
  backgroundColor: "transparent",
  textStyle: { color: "#d4d4d8" },
  title: { textStyle: { color: "#f4f4f5" } },
  legend: { textStyle: { color: "#d4d4d8" } },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#52525b" } },
    axisLabel: { color: "#a1a1aa" },
    splitLine: { lineStyle: { color: "#27272a" } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#52525b" } },
    axisLabel: { color: "#a1a1aa" },
    splitLine: { lineStyle: { color: "#27272a" } },
  },
});

const commonChartTypes = new Set([
  "bar",
  "boxplot",
  "candlestick",
  "effectScatter",
  "line",
  "pictorialBar",
  "scatter",
]);
const hierarchyChartTypes = new Set([
  "funnel",
  "gauge",
  "graph",
  "pie",
  "radar",
  "sankey",
  "sunburst",
  "tree",
  "treemap",
]);
const advancedChartTypes = new Set([
  "custom",
  "heatmap",
  "lines",
  "map",
  "parallel",
  "themeRiver",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getSeries = (options: Record<string, unknown>) => {
  const value = options.series;
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
};

const getRequiredGroups = (options: Record<string, unknown>) => {
  const groups = new Set<string>();
  const series = getSeries(options);
  for (const item of series) {
    const type = typeof item.type === "string" ? item.type : "line";
    if (commonChartTypes.has(type)) groups.add("common");
    else if (hierarchyChartTypes.has(type)) groups.add("hierarchy");
    else if (advancedChartTypes.has(type)) groups.add("advanced");
  }
  const needsOptionalComponents =
    [
      "brush",
      "calendar",
      "dataZoom",
      "geo",
      "graphic",
      "parallel",
      "polar",
      "radar",
      "singleAxis",
      "timeline",
      "visualMap",
    ].some((key) => options[key] !== undefined) ||
    series.some(
      (item) =>
        ["lines", "map", "parallel", "radar"].includes(
          typeof item.type === "string" ? item.type : ""
        ) ||
        item.markArea !== undefined ||
        item.markLine !== undefined ||
        item.markPoint !== undefined
    );
  if (needsOptionalComponents) groups.add("components");
  return [...groups].sort();
};

const groupLoaders: Record<string, () => Promise<unknown>> = {
  common: () => import("./echarts-runtime-common"),
  hierarchy: () => import("./echarts-runtime-hierarchy"),
  advanced: () => import("./echarts-runtime-advanced"),
  components: () => import("./echarts-runtime-components"),
};

export const getEChartsRuntimeSignature = (
  options: Record<string, unknown>
) => getRequiredGroups(options).join(":");

export async function prepareEChartsRuntime(
  options: Record<string, unknown>
) {
  await Promise.all(
    getRequiredGroups(options).map((group) => groupLoaders[group]())
  );
  return echarts;
}

export default echarts;
