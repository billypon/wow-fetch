import { Headers, Response } from 'node-fetch'
import * as FormData from 'form-data'
import { CookieJar, Cookie } from 'tough-cookie'

import { createInstance } from './lib/factory'
export { FetchError } from './lib/error'
export { getSetCookies } from './lib/util'
export * from './lib/type'

const fetch = createInstance({ })

export { createInstance, Headers, Response, FormData, CookieJar, Cookie }
export default fetch
