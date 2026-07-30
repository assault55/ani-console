import { describe, expect, it } from 'vitest'
import { createMockHomeOverviewDataSource, homeOverviewMockData } from './data-source'

describe('home overview data source', () => {
  it('returns all dashboard sections required by the overview page', async () => {
    const result = await createMockHomeOverviewDataSource().getOverview()

    expect(result.summaries).toHaveLength(6)
    expect(result.recentItems).toHaveLength(5)
    expect(result.primaryTrend.ranges['7d'].labels).toHaveLength(5)
    expect(result.comparisonTrend.ranges['7d'].series).toHaveLength(2)
    expect(result.alerts).toHaveLength(4)
    expect(result.tasks.filter((item) => item.status === 'current')).toHaveLength(2)
    expect(result.cpu.external).toHaveLength(5)
  })

  it('returns a fresh copy so UI changes cannot mutate later API responses', async () => {
    const dataSource = createMockHomeOverviewDataSource(homeOverviewMockData)
    const first = await dataSource.getOverview()
    first.summaries[0].value = 0
    first.alerts.length = 0

    const second = await dataSource.getOverview()
    expect(second.summaries[0].value).toBe(99)
    expect(second.alerts).toHaveLength(4)
  })
})
