# Architecture rules

- Keep presentation upgrades in the existing four-tab React flow; retain data hooks and permission boundaries so redesigns do not change household data access.
- Define shared visual roles in global CSS and consume them through Tailwind tokens and shadcn controls; this keeps every screen theme-compatible.
- Use sibling purchase/open buttons and edit/menu buttons within item containers, never nested interactive controls; this preserves keyboard and touch access.