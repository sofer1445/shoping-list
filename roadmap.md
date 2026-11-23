# Design upgrade

- [x] Import and activate Impeccable; confirm in-store clarity as the priority.
- [x] Choose a visual direction compatible with existing brand commitments.
- [x] Redesign navigation, lists, shopping, history, insights and sign-in presentation without changing data logic.
- [x] Verify public authentication presentation and isolated focus flow at 320/390/1280px; no horizontal overflow or runtime errors.
- [x] Record the design system and save the changes.
- [ ] Verify private list/history/insights flows: blocked by external unmanaged authentication; isolated list harness did not render and is not verification.

# Bug and edge-case audit

- [x] Fix authentication lifecycle, stale list requests and isolated offline backups.
- [x] Fix duplicate bulk input, save feedback and rapid repeated actions.
- [x] Verify live public authentication at 320/360/1280px; verify focus, editing, RTL gestures, last-item, empty and failed-save states using isolated test data; nine regression tests passed.
- [x] Save fixes and report authentication-dependent checks that remain blocked.
- [ ] Verify real signed-in CRUD, household realtime and concurrent duplicate additions: external unmanaged authentication provides no test session; these checks and hosted signup settings remain unverified.