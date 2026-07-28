import { NocoBaseAIExtensionProvider } from "./global-ai-chat";
import type { AppExtension } from "@/app/extensions";
import { LoadingState } from "@/components/app-shell/loading-state";
import {
  Bot,
  MessageSquare,
  MousePointer2,
  PanelRight,
  Sparkles,
  Wrench,
} from "lucide-react";
import { lazy, Suspense, type ReactNode } from "react";
import { Outlet, Route } from "react-router";

const AIChatPage = lazy(() =>
  import("./demo").then((module) => ({ default: module.AIChatPage }))
);
const FloatingChatPage = lazy(() =>
  import("./demo/floating").then((module) => ({
    default: module.FloatingChatPage,
  }))
);
const ShortcutPage = lazy(() =>
  import("./demo/shortcut").then((module) => ({
    default: module.ShortcutPage,
  }))
);
const PageContextPage = lazy(() =>
  import("./demo/page-context").then((module) => ({
    default: module.PageContextPage,
  }))
);
const ToolCardsPage = lazy(() =>
  import("./demo/tool-cards").then((module) => ({
    default: module.ToolCardsPage,
  }))
);

function LazyDemoRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState className="min-h-[320px]" />}>
      {children}
    </Suspense>
  );
}

const nocobaseAIExtension: AppExtension = {
  id: "nocobase-ai",
  Provider: NocoBaseAIExtensionProvider,
  resources: [
    {
      name: "ai-components",
      meta: {
        label: "AI Components",
        icon: <Bot />,
        acl: { type: "authenticated" },
      },
    },
    {
      name: "ai-chat-window",
      list: "/ai-chat",
      meta: {
        parent: "ai-components",
        label: "Chat window",
        icon: <MessageSquare />,
        description:
          "Build freely with AI while NocoBase keeps the application reliable.",
        acl: { type: "authenticated" },
      },
    },
    {
      name: "ai-floating-chat",
      list: "/ai-chat/floating",
      meta: {
        parent: "ai-components",
        label: "Floating chat",
        icon: <PanelRight />,
        acl: { type: "authenticated" },
      },
    },
    {
      name: "ai-employee-tasks",
      list: "/ai-chat/shortcut",
      meta: {
        parent: "ai-components",
        label: "Employee tasks",
        icon: <Sparkles />,
        acl: { type: "authenticated" },
      },
    },
    {
      name: "ai-page-context",
      list: "/ai-chat/context",
      meta: {
        parent: "ai-components",
        label: "Page context",
        icon: <MousePointer2 />,
        acl: { type: "authenticated" },
      },
    },
    {
      name: "ai-tool-cards",
      list: "/ai-chat/tools",
      meta: {
        parent: "ai-components",
        label: "Tool cards",
        icon: <Wrench />,
        acl: { type: "authenticated" },
      },
    },
  ],
  routes: (
    <Route key="nocobase-ai" path="/ai-chat" element={<Outlet />}>
      <Route
        index
        element={
          <LazyDemoRoute>
            <AIChatPage />
          </LazyDemoRoute>
        }
      />
      <Route
        path="floating"
        element={
          <LazyDemoRoute>
            <FloatingChatPage />
          </LazyDemoRoute>
        }
      />
      <Route
        path="shortcut"
        element={
          <LazyDemoRoute>
            <ShortcutPage />
          </LazyDemoRoute>
        }
      />
      <Route
        path="context"
        element={
          <LazyDemoRoute>
            <PageContextPage />
          </LazyDemoRoute>
        }
      />
      <Route
        path="tools"
        element={
          <LazyDemoRoute>
            <ToolCardsPage />
          </LazyDemoRoute>
        }
      />
    </Route>
  ),
};

export default nocobaseAIExtension;
