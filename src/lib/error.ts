import { FetchResponse } from './type'

const INTERNAL = Symbol('fetch error internal')

export class FetchError extends Error {
  constructor(message: string, type: string, response?: FetchResponse) {
    super(message)
    this[INTERNAL] = {
      type,
      response,
    }
  }

  get name() {
    return this.constructor.name
  }

  get type(): string {
    return this[INTERNAL].type
  }

  get response(): FetchResponse {
    return this[INTERNAL].response
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name
  }
}
