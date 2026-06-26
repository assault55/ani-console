import { describe, expect, it } from 'vitest'
import { listOrThrow } from './api-list'

describe('listOrThrow', () => {
  it('returns data when no error', async () => {
    const data = await listOrThrow(() =>
      Promise.resolve({ data: { items: [{ id: '1' }], total: 1 }, error: undefined, response: new Response() }),
    )
    expect(data.items).toHaveLength(1)
  })

  it('throws when api returns error', async () => {
    const err = { message: 'not found' }
    await expect(
      listOrThrow(() => Promise.resolve({ data: undefined, error: err, response: new Response() })),
    ).rejects.toEqual(err)
  })
})
