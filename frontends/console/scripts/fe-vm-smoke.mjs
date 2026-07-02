import { chromium } from '@playwright/test'

const base = process.env.CONSOLE_URL || 'http://127.0.0.1:5173'
const vmBootImage = 'quay.io/kubevirt/cirros-container-disk-demo:v1.2.0'
const vmName = `fe-vm-${Date.now().toString().slice(-8)}`

function field(modal, label) {
  return modal.locator('.arco-form-item').filter({ hasText: label }).locator('input').first()
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const log = (msg) => console.log(`[fe-smoke] ${msg}`)

  try {
    log(`open ${base}/instances`)
    await page.goto(`${base}/instances`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('heading', { name: '实例' }).waitFor({ timeout: 15000 })

    await page.getByRole('button', { name: '创建实例' }).click()
    const modal = page.locator('.arco-modal')
    await modal.waitFor({ state: 'visible' })

    log('select VM kind first')
    await modal.locator('.arco-select').first().click()
    await page.getByRole('option', { name: 'VM' }).click()

    log(`fill vm form: ${vmName}`)
    await field(modal, '名称').fill(vmName)
    await field(modal, 'CPU').fill('1')
    await field(modal, '内存').fill('1Gi')
    const boot = field(modal, 'Boot Image')
    await boot.fill(vmBootImage)
    log(`boot_image: ${await boot.inputValue()}`)

    log('submit create')
    await modal.getByRole('button', { name: '确定' }).click()
    await modal.waitFor({ state: 'hidden', timeout: 120000 })

    log('wait instance link')
    const link = page.getByRole('link', { name: vmName })
    await link.waitFor({ timeout: 120000 })
    await link.click()

    await page.getByRole('heading', { name: vmName }).waitFor({ timeout: 30000 })
    log('on detail page, wait for status')
    await page.waitForTimeout(15000)

    const body = await page.locator('.arco-descriptions').first().textContent()
    log(`detail: ${(body || '').replace(/\s+/g, ' ').slice(0, 240)}`)

    log('delete instance')
    await page.getByRole('button', { name: '删除' }).click()
    const confirm = page.locator('.arco-modal').last()
    await confirm.getByRole('button', { name: '确定' }).click()
    await confirm.waitFor({ state: 'hidden', timeout: 60000 })
    await page.waitForTimeout(3000)

    await page.getByRole('button', { name: '返回列表' }).click()
    await page.getByRole('heading', { name: '实例' }).waitFor()

    const row = page.getByRole('row').filter({ hasText: vmName })
    const rowText = await row.textContent().catch(() => '')
    log(`after delete row: ${(rowText || 'not found').replace(/\s+/g, ' ').slice(0, 200)}`)

    log(`done: ${vmName}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[fe-smoke] failed:', err)
  process.exit(1)
})
