# Instance Logs Follow Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Console instance logs with the updated Core `v1.yaml` contract where `follow=false` returns one-time `text/plain` logs and `follow=true` returns SSE from the same `/instances/{instance_id}/logs` path.

**Architecture:** Keep `InstanceLogsPanel` as the UI owner. Store logs as plain text, fetch one-time history via `coreApi.GET('/instances/{instance_id}/logs')`, and subscribe with `EventSource` using `follow=true` on the same path.

**Tech Stack:** React, Arco Design React, openapi-fetch generated Core schema, Vitest, Playwright.

## Global Constraints

- Do not modify frozen product design spec files.
- Use `openapi/v1.yaml` as Console Core codegen input.
- Keep Console implementation under `frontends/console/src/routes` and local components.
- Verification target: focused unit test first, then codegen/typecheck/test/lint/build as feasible.

---

### Task 1: Update Instance Log Contract Use

**Files:**
- Modify: `openapi/v1.yaml`
- Modify: `frontends/console/src/api/core-schema.d.ts`
- Modify: `frontends/console/src/components/instances/InstanceLogsPanel.test.tsx`
- Modify: `frontends/console/src/components/instances/InstanceLogsPanel.tsx`
- Modify: `frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md`

**Interfaces:**
- Consumes: Core `GET /instances/{instance_id}/logs` with `follow?: boolean`, `tail_lines?: number`, `level?: debug|info|warn|error`, `container?: string`.
- Produces: `InstanceLogsPanel` renders plain log text for historical and streamed logs.

- [x] Write tests that expect `follow=true` SSE URL and `text/plain` historical log rendering.
- [x] Run the focused test and confirm it fails against the old `/logs/stream` and JSON list implementation.
- [x] Sync root `v1.yaml` into `openapi/v1.yaml` and regenerate Core schema.
- [x] Change `InstanceLogsPanel` to store and render plain text, build SSE URL with `follow=true`, and poll one-time text logs when EventSource is unavailable.
- [x] Run the focused test and required verification commands.
- [x] Update the sprint record with the new path and verification results.
