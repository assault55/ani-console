# Instance Logs Manual Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the instance logs tab load historical logs by default and only connect the live log stream after the user clicks a button.

**Architecture:** Keep `InstanceLogsPanel` responsible for historical log loading and EventSource lifecycle. Split the effect behavior so active tab and level changes fetch history, while live streaming is controlled by explicit `liveEnabled` state.

**Tech Stack:** React, Arco Design React, Vitest, React Testing Library, Core API typed client.

## Global Constraints

- Do not edit frozen product spec documents.
- Preserve Core v1 API paths: history uses `follow=false`, live uses `follow=true`.
- Use existing Arco components and Console patterns.

---

### Task 1: Instance Logs Manual Live Toggle

**Files:**
- Modify: `frontends/console/src/components/instances/InstanceLogsPanel.tsx`
- Modify: `frontends/console/src/components/instances/InstanceLogsPanel.test.tsx`
- Modify: `frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md`

**Interfaces:**
- Consumes: `coreApi.GET('/instances/{instance_id}/logs')` with `follow=false`.
- Produces: A logs panel that only creates `EventSource('/api/v1/instances/{id}/logs?follow=true&tail_lines=100&level=...')` after the user clicks `开启实时`.

- [x] Write a failing unit test proving active logs load history without creating EventSource.
- [x] Write a failing unit test proving clicking `开启实时` creates EventSource and clicking `停止实时` closes it.
- [x] Implement `liveEnabled` state and separate history/live effects.
- [x] Update existing reconnect/status tests for manual live mode.
- [x] Run targeted unit tests, typecheck, and diff checks.
