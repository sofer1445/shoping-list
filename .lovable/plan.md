
# UX Reasoning + Implementation Plan

## Information Architecture Audit

Current bottom nav: רשימה · משותפות · היסטוריה · תובנות.
Problems:
- "רשימה" implies one list only — but users manage many.
- "משותפות" is not a true destination; sharing is a *property* of a list. Splitting them forces users to remember where a list lives.
- No dedicated **shopping mode** — the most-used screen is buried inside "list".
- "היסטוריה" today is just an archive dump, no repeat-buy value.

### New top-level areas (bottom nav, 4 tabs, Hebrew labels)
| Tab | Label | Icon | Purpose |
|---|---|---|---|
| Lists | הרשימות | ListChecks | Home. All lists (own + shared unified). Create + quick-add. |
| Shopping | קניות | ShoppingCart | Focused in-store mode for the *active* list. Big rows, grouped by category. |
| History | היסטוריה | Clock | Completed/archived purchases as timeline with "קנה שוב". |
| Insights | תובנות | Sparkles | Compact KPIs + a couple of meaningful charts. |

Shared lists are **merged into Lists** with an "משותפת" badge + owner avatar — not a separate tab. Presence and activity cues appear *inline* on the list itself.

---

## Screen-by-screen

### 1) Lists Home (`הרשימות`)
- Sticky "רשימה חדשה" primary action + inline quick-add-common-items chips (based on top user products).
- Active lists section first (sorted by last-updated), then shared-with-me, then a small "בארכיון לאחרונה" strip linking to History.
- Each list card: name, item counts (X/Y), participants avatars, "עודכן לפני X דק׳", subtle live dot if someone is editing now.
- Empty state: illustrative, one clear CTA "צור את הרשימה הראשונה".

**Why:** users start their session deciding *which* list — not by looking at items. Ownership, freshness, and participants must be legible in one glance.

### 2) Shopping Mode (`קניות`)
- Opens directly on the *active* list (last-opened non-archived).
- Header: list name + progress ring (X מתוך Y).
- Default filter = **unpurchased only**. Toggle to reveal completed.
- Items **grouped by category** with collapsible section headers.
- Rows are **large** (min-h 60px), full-row tap to check off, haptic-style scale animation. Swipe/long-press for edit/delete (kept simple: tap the row → check; small edit icon).
- Sticky bottom action bar: "סיים קנייה" (archives list + moves to History) — one primary action per screen.
- No search bar by default (walking-in-store), pull-down reveals quick add.
- Minimal chrome: no recommendations, no analytics, no drag handles.

**Why:** in-store, cognitive load must be near zero. Grouping mirrors store aisles; category headers become physical landmarks. One primary action ("finish shopping") aligns intent with a clear end-state.

### 3) History (`היסטוריה`)
- Timeline grouped by month → then by list.
- Each completed-list card: date, count, top 3 items preview, and **two primary actions**: "קנה הכל שוב" (creates new active list from all items) + "בחר פריטים לקנייה חוזרת".
- Item-level "קנה שוב" chips on hover/tap.
- Top-of-page summary strip: "השבוע קנית 23 פריטים · 4 רשימות".

**Why:** history exists to accelerate the *next* trip, not to browse the past. "Buy again" is the primary verb.

### 4) Insights (`תובנות`)
- Compact, 1 screen, no scroll-fatigue:
  - 3 KPI tiles: פריטים החודש · רשימות שהושלמו · פריט נפוץ ביותר.
  - Category donut (existing, refined).
  - Top 5 repeat items bar (existing, refined).
  - "תבניות קנייה" strip: "אתה קונה חלב כל ~4 ימים".
  - Single "רענן ניתוח" button.
- Remove predictions block from default view — surface top prediction as a suggestion chip on Lists Home instead.

**Why:** dashboards fail when they're pretty but not actionable. Keep only signals that change behavior.

### 5) Shared activity (inline, not a tab)
- On list card: avatars of participants; small green dot = someone active in the last 60s (realtime presence via Supabase channel).
- Inside Shopping mode: recently checked items show "✓ הושלם על ידי דנה · לפני שנייה" for 5s then fade.
- Add-events broadcast via `postgres_changes` on `shopping_items` (already realtime-eligible).

**Why:** collaboration feels alive without a dedicated screen that users must remember to visit.

---

## States (across app)
- **Empty:** friendly Hebrew copy + one CTA; use soft illustration (emoji fallback ok).
- **Loading:** skeletons matching final layout, not spinners.
- **Success:** toast + subtle row scale/color pulse.
- **Offline:** existing banner kept.

---

## Technical scope

**New files**
- `src/components/BottomNav.tsx` → update labels/icons to 4 new tabs (Lists / Shopping / History / Insights).
- `src/components/lists/ListsHome.tsx` — unified own+shared list feed, create + quick-add.
- `src/components/lists/ListCard.tsx` — card with avatars, updated-at, live dot.
- `src/components/shopping/ShoppingMode.tsx` — dedicated in-store screen (grouped by category, sticky finish bar).
- `src/components/shopping/CategoryGroup.tsx` — collapsible section.
- `src/components/shopping/ShoppingRow.tsx` — large tappable row.
- `src/components/history/HistoryTimeline.tsx` — grouped timeline with buy-again.
- `src/components/history/BuyAgainButton.tsx` — clones items into new/active list.
- `src/components/insights/InsightsScreen.tsx` — trims Statistics to compact form (KPIs + donut + top items + patterns).
- `src/hooks/useListPresence.ts` — realtime presence per list.
- `src/hooks/useLists.ts` — fetches own+shared lists with counts + last activity.

**Edited files**
- `src/components/ShoppingList.tsx` — becomes a thin router across the 4 tabs; no longer renders everything itself.
- `src/components/BottomNav.tsx` — new labels/order.
- `src/components/shopping/Statistics.tsx` — replaced by `InsightsScreen` (keep charts, drop noise).
- `src/components/shopping/ArchivedLists.tsx` — kept but only reachable through History timeline "שחזר".

**No DB migrations required.** All data (own lists, shares, archived flag, created_at/updated_at, items) already exists.

**Realtime:** subscribe once per visible list to `postgres_changes` on `shopping_items` filtered by `list_id`. Cleanup on unmount.

**Reuse:** existing hooks (`useShoppingList`, `useShoppingItems`, `useItemOperations`) drive Shopping mode. `ExportToNewListButton` logic reused for "קנה שוב".

---

## Out of scope for this pass
- Spending/price tracking (no price column exists).
- Aisle-order sorting (needs store data).
- Push notifications.

Ready to implement on your ok. This will touch ~10 files and one BottomNav change; existing single-list Shopping flow continues to work throughout.
