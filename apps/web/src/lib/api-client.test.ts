import { afterEach, expect, test, vi } from 'vitest'
import { ApiClient, ApiRequestError, UnauthorizedError } from './api-client.js'

const connection = { baseUrl: 'http://server:3210', password: 'secret' }

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    ...response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('sends the password as a Bearer token', async () => {
  const fetchMock = mockFetch({ json: async () => [] })
  await new ApiClient(connection).listNotes()

  expect(fetchMock).toHaveBeenCalledWith(
    'http://server:3210/api/notes',
    expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ Authorization: 'Bearer secret' })
    })
  )
})

test('serializes the body and sets the content type on writes', async () => {
  const fetchMock = mockFetch({ status: 201, json: async () => ({}) })
  await new ApiClient(connection).createNote({ title: 'Hola', content: '' })

  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(init.body).toBe(JSON.stringify({ title: 'Hola', content: '' }))
  expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
})

test('throws UnauthorizedError on 401', async () => {
  mockFetch({ ok: false, status: 401 })
  await expect(new ApiClient(connection).listNotes()).rejects.toBeInstanceOf(
    UnauthorizedError
  )
})

test('throws ApiRequestError with the server message on other errors', async () => {
  mockFetch({
    ok: false,
    status: 404,
    json: async () => ({ error: 'not_found', message: 'Nota "x" no existe' })
  })
  const error = await new ApiClient(connection)
    .listNotes()
    .catch((caught: unknown) => caught)

  expect(error).toBeInstanceOf(ApiRequestError)
  expect((error as ApiRequestError).message).toBe('Nota "x" no existe')
  expect((error as ApiRequestError).status).toBe(404)
})

test('returns undefined on 204 responses', async () => {
  mockFetch({ status: 204 })
  await expect(
    new ApiClient(connection).deleteNote('11111111-1111-4111-8111-111111111111')
  ).resolves.toBeUndefined()
})
