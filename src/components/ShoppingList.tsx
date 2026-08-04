import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BottomNav, type TabKey } from "./BottomNav";
import { ListsHome } from "./lists/ListsHome";
import { ShoppingMode } from "./shopping/ShoppingMode";
import { HistoryTimeline } from "./history/HistoryTimeline";
import { InsightsScreen } from "./insights/InsightsScreen";

export const ShoppingList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("lists");
  const [activeListId, setActiveListId] = useState<string | null>(null);

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
      searchParams.delete("list");
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div className="app-shell pb-[calc(var(--nav-height)+16px)]">
      <div className="pt-3 animate-fadeIn">
        {activeTab === "lists" && <ListsHome onOpenList={openList} />}
        {activeTab === "shopping" && (
          <ShoppingMode
            listId={activeListId}
            onSetListId={setActiveListId}
            onBackToLists={backToLists}
            onFinished={() => setActiveTab("history")}
          />
        )}
        {activeTab === "history" && <HistoryTimeline onOpenList={openList} />}
        {activeTab === "insights" && <InsightsScreen />}
      </div>

      <BottomNav value={activeTab} onChange={setActiveTab} />
    </div>
  );
};
