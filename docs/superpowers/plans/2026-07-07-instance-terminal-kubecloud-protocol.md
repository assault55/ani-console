# Instance Terminal KubeCloud Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Console instance terminal WebSocket I/O compatible with the working KubeCloud terminal frame protocol while preserving existing plain-output compatibility.

**Architecture:** Keep the existing `InstanceTerminal` component and wrap only the WebSocket frame boundary. xterm input becomes JSON `{ Op: "stdin", Data }`, resize becomes `{ Op: "resize", Cols, Rows }`, and incoming string/binary/blob data is decoded as JSON `Data` when present or rendered as plain text otherwise.

**Tech Stack:** React 18, `@xterm/xterm`, browser `WebSocket`, Vitest, Playwright.

## Global Constraints

- Do not edit frozen product spec documents.
- Preserve the existing `POST /instances/{instance_id}/exec` session flow and direct `ws_url` connection.
- Do not introduce a new terminal library or component system.
- Keep compatibility with plain string, ArrayBuffer, and Blob output frames.

---

### Task 1: Terminal Frame Codec

**Files:**
- Modify: `frontends/console/src/components/instances/InstanceTerminal.tsx`
- Modify: `frontends/console/src/components/instances/InstanceTerminal.test.tsx`
- Modify: `frontends/console/e2e/instances.spec.ts`
- Modify: `frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md`

**Interfaces:**
- Consumes: xterm `onData(data: string)` and `onResize({ cols, rows })`
- Produces: WebSocket sends `{"Op":"stdin","Data":string}` and `{"Op":"resize","Cols":number,"Rows":number}`; incoming JSON `{ "Data": string }` renders the `Data` value

- [ ] **Step 1: Write failing tests**

Add/adjust tests so stdin and resize expect `Op` frames, and stdout accepts JSON `Data` frames.

- [ ] **Step 2: Run focused test to verify failure**

Run: `npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx`

Expected before implementation: FAIL because current component sends raw stdin / lowercase resize and writes JSON output literally.

- [ ] **Step 3: Implement frame codec**

Change `socket.send(data)` to `socket.send(JSON.stringify({ Op: 'stdin', Data: data }))`, resize to `JSON.stringify({ Op: 'resize', Cols: cols, Rows: rows })`, and decode incoming JSON `Data` before `term.write`.

- [ ] **Step 4: Run focused and integration verification**

Run:

```bash
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx
npm run typecheck
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx src/components/instances/InstanceLogsPanel.test.tsx
npx playwright test e2e/instances.spec.ts -g '容器实例终端在页面内连接 exec WebSocket'
```

Expected: all commands pass.

- [ ] **Step 5: Record change**

Append a concise entry to `frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md` describing the KubeCloud-compatible terminal frame protocol and verification commands.
