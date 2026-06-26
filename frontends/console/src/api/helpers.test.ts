import { describe, expect, it } from 'vitest'
import { unwrapApi } from './helpers'

describe('unwrapApi', () => {
  it('returns data on success', async () => {
    const data = await unwrapApi(
      Promise.resolve({ data: { id: '1' }, error: undefined, response: new Response(null, { status: 200 }) }),
    )
    expect(data).toEqual({ id: '1' })
  })

  it('throws api error', async () => {
    const err = { message: 'fail' }
    await expect(
      unwrapApi(Promise.resolve({ data: undefined, error: err, response: new Response(null, { status: 400 }) })),
    ).rejects.toEqual(err)
  })

  it('throws on non-ok response without error body', async () => {
    await expect(
      unwrapApi(Promise.resolve({ data: {}, error: undefined, response: new Response(null, { status: 500 }) })),
    ).rejects.toThrow('HTTP 500')
  })
})
