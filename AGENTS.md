# Architecture rules

- Keep presentation upgrades in the existing four-tab React flow; retain data hooks and permission boundaries so redesigns do not change household data access.
- Define shared visual roles in global CSS and consume them through Tailwind tokens and shadcn controls; this keeps every screen theme-compatible.
- Use sibling purchase/open buttons and edit/menu buttons within item containers, never nested interactive controls; this preserves keyboard and touch access.
- Scope offline item backups by user and list, and use them only for transport failures; cached items must not cross account, list or permission boundaries.
- Keep item normalization, duplicate detection and quantity validation in shared pure utilities with regression tests; all item entry paths must enforce the same rules.
- Derive the shopping selection from the parent list ID and ignore stale fetch responses; opening or finishing a list must never implicitly create or select another list.
- Keep auth callbacks synchronous and clear query caches on identity changes; nested auth calls can deadlock and stale caches can expose another account.
- Layer dialogs above immersive shopping and their menus above dialogs; portal controls must remain visible and touch-accessible.
- Wrap authentication persistence with a safe storage adapter; blocked browser storage must not crash the application.
