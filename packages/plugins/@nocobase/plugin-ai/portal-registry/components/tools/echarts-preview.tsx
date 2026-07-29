import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/app-shell/loading-state";
import echarts, {
  getEChartsRuntimeSignature,
  prepareEChartsRuntime,
} from "./echarts-runtime";

export default function EChartsPreview({
  options,
}: {
  options: Record<string, unknown>;
}) {
  const { resolvedTheme } = useTheme();
  const signature = getEChartsRuntimeSignature(options);
  const [preparedSignature, setPreparedSignature] = useState<string>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let active = true;
    setError(undefined);
    void prepareEChartsRuntime(options)
      .then(() => {
        if (active) setPreparedSignature(signature);
      })
      .catch((runtimeError: unknown) => {
        if (active) setError(runtimeError);
      });
    return () => {
      active = false;
    };
  }, [options, signature]);

  if (error) throw error;
  if (preparedSignature !== signature) {
    return <LoadingState className="h-[280px]" />;
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={{
        ...options,
        animation: false,
        backgroundColor: options.backgroundColor ?? "transparent",
        toolbox: {
          show: true,
          feature: {
            saveAsImage: { title: "Save as image" },
          },
        },
      }}
      theme={resolvedTheme === "dark" ? "nocobase-dark" : undefined}
      notMerge
      style={{ height: 280, width: "100%" }}
    />
  );
}
