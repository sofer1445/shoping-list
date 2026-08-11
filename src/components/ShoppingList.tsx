import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BottomNav, type TabKey } from "./BottomNav";
import { ListsHome } from "./lists/ListsHome";
import { ShoppingMode } from "./shopping/ShoppingMode";
import { HistoryTimeline } from "./history/HistoryTimeline";
import { InsightsScreen } from "./insights/InsightsScreen";
import { cn } from "@/lib/utils";

export const ShoppingList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("lists");
  const [activeListId, setActiveListId] = useState<string | null>(null);
  // Tabs stay mounted after the first visit so switching is instant (no refetch)
  const [visited, setVisited] = useState<Record<string, boolean>>({ lists: true });

  useEffect(() => {
    setVisited((v) => (v[activeTab] ? v : { ...v, [activeTab]: true }));
  }, [activeTab]);

  // Deep-link: /?list=xxx opens Shopping mode on that list
  useEffect(() => {
    const listId = searchParams.get("list");
    if (listId) {
      setActiveListId(listId);
      setActiveTab("shopping");
    }
  }, [searchParams]);

  const openList = (id: string) => {
    setActiveListId(id);
    setActiveTab("shopping");
  };

  const backToLists = () => {
    setActiveTab("lists");
    // keep activeListId so returning to shopping tab resumes
    if (searchParams.get("list")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("list");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const pane = (key: TabKey, node: React.ReactNode) =>
    visited[key] ? (
      <div
        key={key}
        className={cn(activeTab === key ? "animate-fadeIn" : "hidden")}
        aria-hidden={activeTab !== key}
      >
        {node}
      </div>
    ) : null;

  const shoppingView = useMemo(
    () => (
      <ShoppingMode
        listId={activeListId}
        onSetListId={setActiveListId}
        onBackToLists={backToLists}
        onFinished={() => setActiveTab("history")}
      />
    ),
    [activeListId]
  );

  return (
    <div className="app-shell pb-[calc(var(--nav-height)+16px)]">
      <div className="pt-3">
        {pane("lists", <ListsHome onOpenList={openList} />)}
        {pane("shopping", shoppingView)}
        {pane("history", <HistoryTimeline onOpenList={openList} />)}
        {pane("insights", <InsightsScreen />)}
      </div>

      <BottomNav value={activeTab} onChange={setActiveTab} />
    </div>
  );
};

