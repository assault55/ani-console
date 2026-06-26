#!/usr/bin/env node
/**
 * E2E 前置检查：确保 Playwright Chromium 已下载且可启动。
 * 在 pretest:e2e / verify 前自动执行。
 */
import { execSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }
}

console.log('[e2e] 检查 Playwright Chromium…')
run('npx', ['playwright', 'install', 'chromium'])

let launchError = ''
try {
  const { chromium } = require('playwright')
  const browser = await chromium.launch({ headless: true })
  await browser.close()
  console.log('[e2e] Chromium 启动检查通过')
} catch (err) {
  launchError = err instanceof Error ? err.message : String(err)
}

if (launchError) {
  const missingLib = /libatk|shared libraries|cannot open shared object/i.test(launchError)
  console.error('\n[e2e] Chromium 无法启动：')
  console.error(launchError)
  if (missingLib) {
    console.error('\n[e2e] Linux 缺少系统依赖，请执行：')
    console.error('  cd frontends/console && npx playwright install-deps chromium')
    console.error('或：npm run setup:e2e\n')
  }
  process.exit(1)
}
