import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import {
  AIChatFloatingTrigger,
  NocoBaseAIRootProvider,
  useAIPageElementPicker,
  type AIChatComposerAction,
} from "./components";
import { AIChatWindow } from "./components/chat/chat-window";
import { ChatSurface } from "./components/surfaces/chat-surface";
import { ChatSurfaceActions } from "./components/surfaces/chat-surface-actions";
import {
  AIChatProvider,
  type AIToolInvokerMap,
  useAI,
  useAIChatBase,
  useAIChatControllerState,
  useGlobalAIChatController,
} from "./providers";
import { nocobaseAIService } from "./services";
import { Globe2, MousePointer2 } from "lucide-react";

const DEFAULT_SIDE_PANEL_WIDTH = 450;
export function NocoBaseAIExtensionProvider({
  children,
  toolInvokers,
}: PropsWithChildren<{ toolInvokers?: AIToolInvokerMap }>) {
  return (
    <NocoBaseAIRootProvider
      service={nocobaseAIService}
      toolInvokers={toolInvokers}
    >
      <NocoBaseAIGlobalEntry>{children}</NocoBaseAIGlobalEntry>
    </NocoBaseAIRootProvider>
  );
}

function NocoBaseAIGlobalEntry({ children }: PropsWithChildren) {
  const ai = useAI();
  const controller = useGlobalAIChatController();
  const { open } = useAIChatControllerState(controller);
  const [webSearch, setWebSearch] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ready =
    ai.configurationStatus === "ready" &&
    ai.employees.length > 0;

  return (
    <div
      data-open={ready && open && !expanded}
      data-side="right"
      className="chat-side-panel-layout @container min-h-svh min-w-0"
      style={
        {
          "--chat-side-panel-width": `${DEFAULT_SIDE_PANEL_WIDTH}px`,
        } as CSSProperties
      }
    >
      <div className="min-w-0">{children}</div>
      {ready ? (
        <AIChatProvider
          id="starter-global-ai"
          controller={controller}
          webSearch={webSearch}
        >
          <StarterGlobalAIChat
            open={open}
            onOpenChange={controller.setOpen}
            webSearch={webSearch}
            setWebSearch={setWebSearch}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </AIChatProvider>
      ) : null}
    </div>
  );
}

function StarterGlobalAIChat({
  open,
  onOpenChange,
  webSearch,
  setWebSearch,
  expanded,
  setExpanded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webSearch: boolean;
  setWebSearch: Dispatch<SetStateAction<boolean>>;
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    id: chatId,
    conversations,
    currentModel,
    addWorkContext,
    focusComposer,
  } = useAIChatBase();
  const { registeredCount, startPicking } = useAIPageElementPicker();
  const supportsWebSearch = currentModel.supportWebSearch === true;
  const unreadCount = conversations.filter(
    (conversation) => conversation.unread
  ).length;

  useEffect(() => {
    if (!supportsWebSearch && webSearch) setWebSearch(false);
  }, [setWebSearch, supportsWebSearch, webSearch]);

  const composerActions = useMemo<AIChatComposerAction[]>(
    () => [
      {
        key: "pick-page-element",
        label: "Pick page element",
        icon: <MousePointer2 />,
        disabled: registeredCount === 0,
        onClick: () => {
          if (expanded) setExpanded(false);
          startPicking({
            chatId,
            onSelect: (item) => {
              addWorkContext(item);
              focusComposer();
            },
          });
        },
      },
      {
        key: "web-search",
        label: supportsWebSearch
          ? webSearch
            ? "Disable web search"
            : "Enable web search"
          : "Web search is not supported by this model",
        icon: <Globe2 />,
        active: webSearch,
        disabled: !supportsWebSearch,
        onClick: () => setWebSearch((active) => !active),
      },
    ],
    [
      addWorkContext,
      chatId,
      expanded,
      focusComposer,
      registeredCount,
      setExpanded,
      setWebSearch,
      startPicking,
      supportsWebSearch,
      webSearch,
    ]
  );
  const closeChat = () => {
    setExpanded(false);
    onOpenChange(false);
  };
  const handleSurfaceOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setExpanded(false);
    onOpenChange(nextOpen);
  };

  return (
    <>
      <ChatSurface
        open={open}
        variant={expanded ? "dialog" : "side-panel"}
        onOpenChange={handleSurfaceOpenChange}
        width={DEFAULT_SIDE_PANEL_WIDTH}
        showCloseHandle={false}
      >
        <AIChatWindow
          headerActions={
            <ChatSurfaceActions
              expanded={expanded}
              onExpandedChange={setExpanded}
              onClose={closeChat}
            />
          }
          composerActions={composerActions}
          enableAttachments
          attachmentActionIndex={1}
        />
      </ChatSurface>
      <AIChatFloatingTrigger unreadCount={unreadCount} />
    </>
  );
}
