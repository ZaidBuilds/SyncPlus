# SyncPlus Dashboard Fix & Upgrade TODO

## Phase 1 — Critical Bug Fixes
- [x] Create TODO.md
- [x] Fix `src/lib/workspace.js` — rename shadowed `startOfWeek`/`endOfWeek` variables in `getThisWeeksTasks`
- [x] Fix `src/components/Layout.jsx` — add `!e.ctrlKey && !e.metaKey` guard to keyboard shortcuts
- [x] Fix `src/components/Layout.jsx` — fix `userInitials` to use `full_name` only with proper fallback
- [ ] Fix `src/pages/Dashboard.jsx` — import `formatCurrency` from `@/lib/workspace`
- [ ] Fix `src/pages/Dashboard.jsx` — fix `tasksDue` display logic
- [ ] Fix `src/pages/Dashboard.jsx` — memoize motivational quote with `useMemo`
- [ ] Fix `src/pages/Dashboard.jsx` — fix SVG gradient ID to avoid DOM conflicts
- [ ] Fix `src/pages/Dashboard.jsx` — remove dead code (`ProgressCard`, `InlineQuickAdd`)

## Phase 2 — Professional Dashboard Upgrade
- [ ] Add business metrics cards (pipeline value, active deals, collection rate)
- [ ] Add mini revenue/collection chart using `recharts`
- [ ] Add deal pipeline summary with stage progress bars
- [ ] Add recent activity feed (latest invoices, deals, tasks)
- [ ] Add Framer Motion entrance animations
- [ ] Polish empty states and responsive grid
- [ ] Add `useCallback` for event handlers

## Phase 3 — Validation
- [ ] Run `npm run lint` to ensure no new errors
- [ ] Verify app loads and dashboard renders correctly

