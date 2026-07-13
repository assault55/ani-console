---
name: development-record
description: Update project development records after verified code changes. Use after implementing, fixing, testing, or validating code in this repository, especially when changes touch Console pages, APIs, network/storage flows, or sprint-scoped work, before sending the final completion summary.
---

# Development Record

After code changes and verification, update the project record before final response.

## Workflow

1. Identify the relevant record file with `rg` before creating anything new.
   - Console sprint work usually records in `frontends/console/docs/sprints/SPRINT-*.md`.
   - Console task status may record in `frontends/console/docs/CONSOLE-TASK-PLAN.md` or `frontends/console/docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md`.
   - Do not edit frozen product spec files.
2. Add a concise entry covering:
   - changed files or area
   - user-visible behavior
   - important validation or integration notes
   - verification commands run
3. Keep the record factual and short. Do not duplicate long terminal output.
4. If no suitable record exists, say that in the final response instead of creating a random new document.
5. Run `git diff --check` for the touched record file before final response.

## Final Response

Mention the record file updated and the verification commands that passed. If the record could not be updated, say why.
