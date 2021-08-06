import Fetch, { Headers, Response, RequestInit, BodyInit } from 'node-fetch'
import * as FormData from 'form-data'
import { Cookie } from 'tough-cookie'

import { isPlainObject, isNullBody, asyncForEach } from './util'
import {
  FetchOptions,
  FetchDefaultOptions,
  FetchInstance,
  FetchMethod,
  FetchParams,
  FetchResponse,
  BeforeRequestHook,
  AfterResponseHook,
  RequestErrorHook,
  ResponseErrorHook,
} from './type'
import { FetchError } from './error'
import {
  CONTENT_TYPE,
  COOKIE,
  SET_COOKIE,
} from './const'

const DEFAULT_OPTIONS: Partial<FetchDefaultOptions> = {
  method: 'get',
  type: 'json',
  redirect: 'follow',
  follow: 10,
  credentials: 'same-origin',
}

interface FetchParam<T = unknown> {
  has(key: string): boolean
  set(key: string, value: T): void
}

function mergeOptions(defaultOptions: FetchDefaultOptions, options: FetchOptions, url?: string): FetchOptions {
  const opts: FetchOptions = { ...defaultOptions, ...options, url }
  mergeOptionProps(opts, defaultOptions)

  const headers: FetchParams = { }
  if (opts.headers) {
    if (opts.headers instanceof Headers) {
      for (const [ key, value ] of (opts.headers as Headers).entries()) {
        headers[key] = value
      }
    } else {
      Object.entries(opts.headers).forEach(([ key, value ]) => headers[key] = value)
    }
    opts.headers = headers
  }

  if ([ 'post', 'put', 'patch' ].includes(opts.method)) {
    if (opts.json) {
      opts.body = JSON.stringify(opts.json)
      headers[CONTENT_TYPE] = 'application/json'
    } else if (opts.form) {
      opts.body = (!isPlainObject(opts.form) ? opts.form : new URLSearchParams(opts.form as FetchParams)) as unknown as BodyInit
      headers[CONTENT_TYPE] = 'application/x-www-form-urlencoded'
    } else if (opts.data) {
      opts.body = opts.data as FormData
      headers[CONTENT_TYPE] = `multipart/form-data; boundary=${ (opts.data as FormData).getBoundary() }`
    }
  } else {
    delete opts.body
  }
  ;[ 'json', 'form', 'data', 'hooks' ].forEach(x => delete opts[x])
  
  const beforeRequestHooks = defaultOptions.hooks.beforeRequest as BeforeRequestHook[]
  return beforeRequestHooks.reduce((_opts, fn) => fn(_opts), opts)
}

function mergeOptionProps(options: FetchOptions, defaultOptions: FetchDefaultOptions): void {
  ;[ 'headers', 'query', 'form', 'data' ].forEach(x => {
    if (options[x] && isPlainObject(defaultOptions[x])) {
      if (isPlainObject(options[x])) {
        options[x] = { ...defaultOptions[x], ...options[x] }
      } else if (x !== 'data') {
        const param = options[x] as FetchParam
        if (param.has) { // Make sure options.form is not a string
          Object.entries(defaultOptions[x]).forEach(([ key, value ]) => {
            if (!param.has(key)) {
              param.set(key, value)
            }
          })
        }
      }
    }
  })

  if (options.json && defaultOptions.json) {
    if (isPlainObject(options.json)) {
      if (isPlainObject(defaultOptions.json)) {
        options.json = { ...defaultOptions.json as object, ...options.json as object }
      }
    } else if (Array.isArray(options.json)) {
      if (Array.isArray(defaultOptions.json)) {
        options.json = [ ...defaultOptions.json, ...options.json ]
      }
    }
  }
}

function mergeUrl(baseUrl: string, url: string): string {
  if (!baseUrl || /^https?:\/\//.test(url)) {
    return url
  }
  return `${ baseUrl }${ !/\/$/.test(baseUrl) && !/^\//.test(url) ? '/' : '' }${ url }`
}

function mergeParams(url: string, query: URLSearchParams, override = true): string {
  if (!query) {
    return url
  }
  const queryString = query ? query.toString() : ''
  if (queryString) {
    const index = override ? url.indexOf('?') : -1
    const split = override
      ? '?'
      : url[-1] !== '?'
        ? index < 0 ? '?' : '&'
        : ''
    return `${ !override || index < 0 ? url : url.substr(0, index) }${ split }${ queryString }`
  }
  return url
}

async function consumeResponse(response: Response, options: FetchOptions, defaultOptions: FetchDefaultOptions): Promise<unknown> {
  const { ok, url, status, statusText, redirected } = response

  const headers = Object.fromEntries(response.headers.entries())

  if (options.cookies && response.headers.has(SET_COOKIE)) {
    const cookies = response.headers.raw()[SET_COOKIE]
    cookies.forEach(x => {
      const cookie = Cookie.parse(x)
      options.cookies.setCookieSync(cookie, url)
    })
  }

  const result = {
    ok,
    url,
    status,
    statusText,
    headers,
    redirected,
    options: {
      ...options,
      method: options.method,
      headers: options.headers,
    },
  } as FetchResponse

  try {
    result.body = await consumeBody(response, ok ? options.type : 'auto')
    if (!ok) {
      throw new FetchError(`HTTP ${ statusText || 'Error' }`, 'invalid-status', result)
    }
    const afterResponseHooks = defaultOptions.hooks.afterResponse as AfterResponseHook[]
    return await afterResponseHooks.reduce<unknown>(async (_result, fn) => fn(await _result), Promise.resolve(result))
  } catch (err: unknown) {
    result.body = result.body || response.body
    const error = err as Error
    const responseErrorHooks = defaultOptions.hooks.responseError as ResponseErrorHook[]
    for (const hook of responseErrorHooks) {
      try {
        return await hook(result, error)
      } catch (_) {
      }
    }
    throw error instanceof Error ? error : new FetchError((error as Error).message || error, 'response-error', result)
  }
}

async function consumeBody(response: Response, type: string): Promise<unknown> {
  if (isNullBody(response.status)) {
    return Promise.resolve(null)
  }
  switch (type) {
    case 'text':
      return response.text()
    case 'json':
      return response.json()
    case 'blob':
      return response.blob()
    case 'buffer':
      return response.buffer()
    case 'array-buffer':
      return response.arrayBuffer()
    case 'auto':
      const [ type ] = response.headers.get(CONTENT_TYPE).split(';')
      const [ mainType, subType ] = type.split('/')
      switch (mainType) {
        case 'text':
          return response.text()
        case 'application':
          return subType === 'json' ? response.json() : response.blob()
      }
  }
  return Promise.resolve(response.body)
}

export function createInstance(nextOptions: Partial<FetchDefaultOptions>, prevOptions: Partial<FetchDefaultOptions> = { }) {
  const defaultOptions = { ...DEFAULT_OPTIONS, ...prevOptions, ...nextOptions } as FetchDefaultOptions
  mergeOptionProps(defaultOptions, prevOptions as FetchDefaultOptions)

  defaultOptions.hooks = { ...prevOptions.hooks, ...nextOptions.hooks }
  ;[ 'beforeRequest', 'afterResponse', 'requestError', 'responseError' ].forEach(x => {
    if (defaultOptions.hooks[x]) {
      defaultOptions.hooks[x] = Array.isArray(defaultOptions.hooks[x]) ? defaultOptions.hooks[x] : [ defaultOptions.hooks[x] ]
      if (nextOptions.hooks?.[x] && prevOptions.hooks?.[x]) {
        if (Array.isArray(prevOptions.hooks[x])) {
          defaultOptions.hooks[x] = [ ...prevOptions.hooks[x], ...defaultOptions.hooks[x] ]
        } else {
          defaultOptions.hooks[x] = [ prevOptions.hooks[x], ...defaultOptions.hooks[x] ]
        }
      }
    } else {
      defaultOptions.hooks[x] = [ ]
    }
  })

  const fetch = async function(url: string, opts?: Partial<FetchOptions>) {
    const options = mergeOptions(defaultOptions, opts as FetchOptions, url)
    const query = options.query instanceof URLSearchParams ? options.query : new URLSearchParams(options.query as FetchParams)
    const wholeUrl = mergeUrl(defaultOptions.baseUrl, mergeParams(options.url, query))

    if (options.cookies) {
      const cookieString = options.cookies.getCookieStringSync(wholeUrl)
      if (cookieString) {
        (options.headers as FetchParams)[COOKIE] = cookieString
      }
    }

    let response: Response
    try {
      response = await Fetch(wholeUrl, {
        method: options.method.toUpperCase(),
        headers: options.headers,
        body: options.body,
        redirect: options.redirect,
        follow: options.follow,
        signal: options.signal,
        agent: options.agent,
        credentials: options.credentials,
      } as RequestInit)
    } catch (error: unknown) {
      const requestErrorHooks = defaultOptions.hooks.requestError as RequestErrorHook[]
      await asyncForEach(requestErrorHooks, hook => hook(options, error as Error))
      throw error
    }
    return consumeResponse(response, options, defaultOptions)
  } as unknown as FetchInstance

  ;[ 'get', 'post', 'put', 'patch', 'delete', 'head', 'options' ].forEach(method => {
    fetch[method] = (url: string, options?: Partial<FetchOptions>) => {
      return fetch(url, { ...options, method: method as FetchMethod })
    }
  })

  fetch.extend = (options) => {
    return createInstance(options, defaultOptions)
  }

  Object.defineProperty(fetch, 'defaults', {
    value: defaultOptions,
  })

  return fetch
}
