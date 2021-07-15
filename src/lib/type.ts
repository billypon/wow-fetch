import { Agent } from 'http'

import { Headers, Response, RequestRedirect, RequestCredentials, BodyInit } from 'node-fetch'
import { AbortSignal } from 'node-fetch/externals'
import * as FormData from 'form-data'
import { CookieJar } from 'tough-cookie'

export type FetchFunction = <T = FetchResponse>(url: string, options?: Partial<FetchOptions>) => Promise<T>

export type FetchInstance = FetchFunction & Record<FetchMethod, FetchFunction> & {
  extend: (options: Partial<FetchDefaultOptions>) => FetchInstance
  get defaults(): FetchDefaultOptions
}

export type FetchMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'
export type FetchParams = Record<string, string>

export type BeforeRequestHook = (options: FetchOptions) => FetchOptions
export type AfterResponseHook = (result: unknown) => Promise<unknown>
export type RequestErrorHook = (options: FetchOptions, error: Error) => Promise<boolean | void>
export type ResponseErrorHook = (response: FetchResponse, error: Error) => Promise<unknown>

export interface FetchOptions {
  url: string
  method: FetchMethod
  headers: FetchParams | Headers
  body: BodyInit
  signal: AbortSignal
  // node-fetch does not support options
  credentials: RequestCredentials
  // node-fetch extension options
  redirect: RequestRedirect
  follow: number
  agent: Agent
  // wow-fetch extension options
  params: FetchParams | URLSearchParams
  json: unknown
  form: string | FetchParams | URLSearchParams
  data: FormData
  cookies: CookieJar
  type: 'text' | 'json' | 'blob' | 'buffer' | 'array-buffer' | 'stream' | 'auto'
}

export interface FetchDefaultOptions extends Exclude<FetchOptions, 'url'> {
  baseUrl: string,
  hooks: Partial<{
    beforeRequest: BeforeRequestHook | BeforeRequestHook[]
    afterResponse: AfterResponseHook | AfterResponseHook[]
    requestError: RequestErrorHook | RequestErrorHook[]
    responseError: ResponseErrorHook | ResponseErrorHook[]
  }>
}

export interface FetchResponse<T = unknown> extends Pick<Response, 'ok' | 'url' | 'status' | 'statusText' | 'redirected'> {
  headers: FetchParams
  body: T
  options: FetchOptions
}
