#!/usr/bin/env node
/**
 * notify-feishu.mjs
 * -----------------------------------------
 * Sends a Feishu (飞书) webhook notification when banner data needs updating.
 *
 * Checks banner-schedule.json: if the current phase's endUtc has passed
 * (or is within 2 days), sends a reminder to update the data.
 *
 * Env:
 *   FEISHU_WEBHOOK_URL - required, the Feishu bot webhook URL
 *   DRY_RUN            - if "true", print the payload but don't send
 *
 * Run:  node scripts/notify-feishu.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = join(ROOT, 'scripts', 'banner-schedule.json')
const WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || ''
const DRY_RUN = process.env.DRY_RUN === 'true'

function log(msg) { console.log(`[notify-feishu] ${msg}`) }

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const now = Date.now()
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000

// Find the current phase (started but not yet ended)
const currentPhase = data.phases.find((p) => {
  const start = new Date(p.startUtc).getTime()
  const end = new Date(p.endUtc).getTime()
  return start <= now && end > now
})

// Find if any phase is expiring soon (within 2 days)
const expiringSoon = data.phases.find((p) => {
  const end = new Date(p.endUtc).getTime()
  const remaining = end - now
  return remaining > 0 && remaining <= TWO_DAYS
})

// Find if all phases have ended (data is stale)
const allEnded = data.phases.every((p) => new Date(p.endUtc).getTime() <= now)

let title, text, needsUpdate = false

if (allEnded) {
  needsUpdate = true
  title = '⚠️ 卡池数据已过期'
  text = [
    `版本 ${data.version} 的所有卡池阶段已结束。`,
    `最后更新: ${data.updated}`,
    '',
    '请更新 scripts/banner-schedule.json:',
    '1. 查看版本直播或官方公告确认新卡池',
    '2. 修改 banner-schedule.json',
    '3. git push 触发自动部署',
    '',
    '或手动触发 workflow:',
    'https://github.com/allenshi16/genshin-wish-simulator/actions/workflows/update-banners.yml',
  ].join('\n')
} else if (expiringSoon) {
  needsUpdate = true
  const endTime = new Date(expiringSoon.endUtc)
  title = '🔔 卡池即将结束，准备更新数据'
  text = [
    `${expiringSoon.character.name} 卡池将于 ${endTime.toISOString().replace('T', ' ').replace(':00Z', ' UTC')} 结束。`,
    `距今不到 2 天。`,
    '',
    '请准备下一阶段的卡池数据并更新 banner-schedule.json。',
  ].join('\n')
} else if (currentPhase) {
  const endTime = new Date(currentPhase.endUtc)
  const daysLeft = Math.round((endTime.getTime() - now) / 86400000)
  title = '✅ 卡池数据正常'
  text = [
    `当前卡池: ${currentPhase.character.name} (${data.version} ${currentPhase.label})`,
    `剩余 ${daysLeft} 天，结束时间: ${endTime.toISOString().replace('T', ' ').replace(':00Z', ' UTC')}`,
    '',
    '无需操作。',
  ].join('\n')
} else {
  needsUpdate = true
  title = '⚠️ 卡池数据异常'
  text = [
    '未找到有效的当前卡池阶段。',
    `版本: ${data.version}，最后更新: ${data.updated}`,
    '',
    '请检查 banner-schedule.json 的日期是否正确。',
  ].join('\n')
}

log(`Status: ${needsUpdate ? 'NEEDS UPDATE' : 'OK'}`)
log(`Title: ${title}`)

if (!needsUpdate && !DRY_RUN) {
  log('No notification needed.')
  console.log('SENT=false')
  process.exit(0)
}

// Build Feishu card message
const payload = {
  msg_type: 'interactive',
  card: {
    header: {
      title: { tag: 'plain_text', content: title },
      template: needsUpdate ? 'orange' : 'green',
    },
    elements: [
      {
        tag: 'markdown',
        content: text,
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '打开仓库' },
            url: 'https://github.com/allenshi16/genshin-wish-simulator',
            type: 'primary',
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '触发 Workflow' },
            url: 'https://github.com/allenshi16/genshin-wish-simulator/actions/workflows/update-banners.yml',
          },
        ],
      },
    ],
  },
}

if (DRY_RUN) {
  log('DRY_RUN=true — payload:')
  console.log(JSON.stringify(payload, null, 2))
  console.log('SENT=false')
  process.exit(0)
}

if (!WEBHOOK_URL) {
  log('FEISHU_WEBHOOK_URL not set. Skipping notification.')
  console.log('SENT=false')
  process.exit(0)
}

try {
  const resp = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  })
  if (!resp.ok) {
    log(`Feishu webhook returned HTTP ${resp.status}`)
    console.log('SENT=false')
    process.exit(0)
  }
  const result = await resp.json()
  if (result.code !== 0) {
    log(`Feishu API error: ${result.msg}`)
    console.log('SENT=false')
  } else {
    log('Notification sent successfully.')
    console.log('SENT=true')
  }
} catch (err) {
  log(`Fetch failed: ${err.message}`)
  console.log('SENT=false')
}
