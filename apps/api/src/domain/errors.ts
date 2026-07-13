/** Raised when an entity referenced by the request does not exist. */
export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} "${id}" no existe`)
    this.name = 'NotFoundError'
  }
}

/** Raised when the AI fails to produce a valid plan after all retries. */
export class PlanGenerationError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
  ) {
    super(message)
    this.name = 'PlanGenerationError'
  }
}
