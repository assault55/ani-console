# Sandbox Real Instances Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire ANI Console Sandbox instances to the real Core `/api/v1/instances` sandbox flow.

**Architecture:** Extend the existing Instances list/create/detail routes. Keep Core API access through `coreApi`, use Arco components, and isolate Sandbox parsing/display helpers in `src/lib/sandbox-instance.ts`.

**Tech Stack:** React 18, TanStack Router/Query, Arco Design React, Vitest, Playwright.

## Global Constraints

- `kind` is fixed to `sandbox` for Sandbox creation.
- `runtime_class` is fixed to `sandbox-kata` in the normal user flow.
- `session_timeout` choices are `15m`, `30m`, `1h`, `2h`.
- `network_egress_policy` choices are `deny_all`, `allowlist`, `internet`.
- Do not hard-code backend IPs, tokens, passwords, or call Kubernetes APIs directly.
- Use Core `/api/v1/instances` only.

---

### Task 1: Sandbox Helpers

**Files:**
- Create: `frontends/console/src/lib/sandbox-instance.ts`
- Test: `frontends/console/src/lib/sandbox-instance.test.ts`

**Steps:**
- [ ] Add failing tests for command parsing, provider label, and create/lifecycle error messages.
- [ ] Implement helper functions.
- [ ] Run `npm run test -- src/lib/sandbox-instance.test.ts`.

### Task 2: Sandbox Create Flow

**Files:**
- Modify: `frontends/console/src/routes/_authenticated/instances/index.tsx`
- Test: `frontends/console/src/routes/_authenticated/instances/-instance-create.test.ts`
- Test: `frontends/console/e2e/instances.spec.ts`

**Steps:**
- [ ] Add failing unit/E2E tests for Sandbox payload, idempotency retry reuse, `kind=sandbox` list query, and create-success detail navigation.
- [ ] Add Sandbox image and command fields.
- [ ] Use a stable create idempotency key until success/cancel/reset.
- [ ] Submit `sandbox_config` and optional `command`.
- [ ] Navigate to `/instances/sandbox/$instanceId` when response includes `instance.id`.

### Task 3: Sandbox Detail Flow

**Files:**
- Create: `frontends/console/src/routes/_authenticated/instances/sandbox/$instanceId.tsx`
- Modify: `frontends/console/src/routes/_authenticated/instances/$instanceId.tsx`
- Test: `frontends/console/e2e/instances.spec.ts`

**Steps:**
- [ ] Add failing E2E for Sandbox detail showing runtime, session, egress, provider mode, and resource refs.
- [ ] Render Sandbox details inside the existing overview tab.
- [ ] Show `真实 Kubernetes/Kata 后端` for `real_provider=true` and `provider=kubernetes_rest`.
- [ ] Show `本地开发模式` for `dev_profile.mode=local`.

### Task 4: Records And Verification

**Files:**
- Modify: `frontends/console/docs/sprints/SPRINT-SCB-04-instances-compute.md`

**Steps:**
- [ ] Record the Sandbox real instance work.
- [ ] Run focused unit tests.
- [ ] Run `npx playwright test e2e/instances.spec.ts`.
- [ ] Run `npm run verify`.
