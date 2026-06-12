import { z } from 'zod'

/** Uniform error envelope returned by every API endpoint. */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string()
})

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string()
})

export const AuthVerifyResponseSchema = z.object({
  authenticated: z.boolean()
})

export const OllamaStatusSchema = z.object({
  reachable: z.boolean(),
  modelAvailable: z.boolean(),
  models: z.array(z.string()),
  message: z.string()
})

export type ApiError = z.infer<typeof ApiErrorSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type AuthVerifyResponse = z.infer<typeof AuthVerifyResponseSchema>
export type OllamaStatus = z.infer<typeof OllamaStatusSchema>
