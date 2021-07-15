> Human-friendly fetch wrapper for Node.js and Browser

## Install

```
$ npm install wow-fetch
```

## Usage

```js
import fetch from 'wow-fetch'

(async () => {
  try {
    const res = await fetch('https://httpbin.org/anything')
    console.log(res.body.url) // => https://httpbin.org/anything
  } catch (err) {
    console.log(err.message)
  }
})
```

### API

It's a `GET` request by default, but can be changed by using different methods or via [`options.method`](#method).

#### fetch(url, options?)

Returns a Promise giving a [Response object](#response).

##### url

Type: `string`

The URL to request.

**Note:** The query string is **not** parsed as search params. Example:

```js
await fetch('https://example.com/?query=a b') // => https://example.com/?query=a%20b
await fetch('https://example.com/', { params: { query: 'a b'} }) // => https://example.com/?query=a+b

// The query string is overridden by `params`
await fetch('https://example.com/?query=a b', { params: { query: 'a b' } }) // => https://example.com/?query=a+b
```

##### options

Type: `object`

###### method

Type: `string` \
Default: `get`

The HTTP method used to make the request.

###### headers

Type: `Headers` | `Record<string, string>` \
Default: `null`

**Note:** This option will be merged with the instance defaults, if default option is `Record<string, string>`.

Request headers.

Example:

```js
import fetch, { Headers } from 'wow-fetch'

const headers = new Headers()
headers.set('foo', 'bar')
fetch('https://httpbin.org/anything', { headers })
```

###### params

Type: `URLSearchParams` | `Record<string, string>` \
Default: `null`

**Note:** This option will be merged with the instance defaults, if default option is `Record<string, string>`.

Request search params.

###### json

Type: `object | Array | string | number | boolean | null` *(JSON-serializable values)* \
Default: `null`

**Note #1:** This option will be merged with the instance defaults, if both this options and default option are `object`. \
**Note #2:** This option will be merged with the instance defaults, if both this options and default option are `Array`.

JSON body, the `Content-Type` header will be set to `application/json`.

###### form

Type: `URLSearchParams | Record<string, string> | string` \
Default: `null`

**Note:** This option will be merged with the instance defaults, if default option is `Record<string, string>`, and this options is not `string`.

Form body, the `Content-Type` header will be set to `application/x-www-form-urlencoded`.

###### data

Type: `FormData`\
Default: `null`

FormData body, the `Content-Type` header will be set to `multipart/form-data`.

Example:

```js
import fetch, { FormData } from 'wow-fetch'

const data = new FormData()
data.append('foo', 'bar')
fetch('https://httpbin.org/anything', { data })
```

###### body

Type: `string | URLSearchParams | Buffer | ArrayBuffer | ReadableStream` or [`form-data` instance](https://github.com/form-data/form-data) \
Default: `null`

**Note #1:** The `body` option cannot be used with the `json`, `form` or `data` option. \
**Note #2:** This option can only work with `POST`, `PUT` and `PATCH` method.

###### cookies

Type: [`tough-cookie` instance](https://github.com/salesforce/tough-cookie) \
Default: null

**Note:** If you provide this option, `options.headers.cookie` will be overridden.

Cookie support.

```js
import fetch, { CookieJar } from 'wow-fetch'

const cookies = new CookieJar()
fetch('https://httpbin.org/anything', { cookies })
```

###### type

Type: `'text' | 'json' | 'blob' | 'array' | 'array-buffer' | 'stream' | 'auto'` \
Default: `'text'`

The response body can parse automatically when this options is `auto`, but depends on response Content-Type. \
`text/*` will be parsed to `text`, `application/json` will be parsed to `json`, \
`application/*` will be parsed to `blob`, others will be parsed to `stream`.

`Blob` is browser only, and `Buffer` is Node.js only

###### signal

Type: [`abort-controller` instance](https://www.npmjs.com/package/abort-controller) \
Default: `null`

You can cancel request with AbortController.

```js
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

const controller = new AbortController()
setTimeout(() => controller.abort(), 1000) // abort after 1000ms
fetch('https://example.com/', { signal: controller })
```

###### credentials

Type: `'omit' | 'same-origin' | 'include'` \
Default: `'same-origin'`

**Note:** This option is browser only.

Controls what browsers do with credentials.

* `omit`: Tells browsers to exclude credentials from the request, and ignore any credentials sent back in the response.
* `same-origin`: Tells browsers to include credentials with requests to same-origin URLs, and use any credentials sent back in responses from same-origin URLs.
* `include`: Tells browsers to include credentials in both same- and cross-origin requests, and always use any credentials sent back in responses.

###### redirect

Type: `'follow' | 'error' | 'manual'` \
Default: `'follow'`

How to handle a redirect response.

* `follow`: Automatically follow redirects. Unless otherwise stated the redirect mode is set to follow.
* `error`: Abort with an error if a redirect occurs.
* `manual`: Caller intends to process the response in another context.

###### follow

Type: `number`
Default: `10`

**Note:** This option is Node.js only.

Maximum redirect count.

###### agent

Type: [`Agent` instance](https://nodejs.org/api/http.html#http_class_http_agent)
Default: `null`

**Note:** This option is Node.js only.

The `agent` option allows you to specify networking related options which are out of the scope of fetch.

Here is an example of [`proxy-agent`](https://github.com/TooTallNate/node-proxy-agent):

```js
import fetch from 'wow-fetch'
import ProxyAgent from 'proxy-agent'

const agent = new ProxyAgent('http://127.0.0.1:8080')
fetch('https://example.com/', { agent })
```

#### Response

##### ok

Type: `boolean`

A boolean indicating whether the response was successful (status in the range 200–299) or not.

##### url

Type: `string`

The URL of the response.

##### status

Type: `number`

The status code of the response.

##### statusText

Type: `string`

The status message corresponding to the status code.

##### redirected

Type: `boolean`

Indicates whether or not the response is the result of a redirect.

##### headers

Type: `Record<string, string>`

Associated with the response.

##### body

Type: `unknown`

Body content.

See [`options.type`](#type) for more detail.

##### options

Type: `object`

The fetch options that were set on this request.

#### fetch.get(url, options?)
#### fetch.post(url, options?)
#### fetch.put(url, options?)
#### fetch.patch(url, options?)
#### fetch.delete(url, options?)
#### fetch.head(url, options?)
#### fetch.options(url, options?)

Sets [`options.method`](#method) to the method name and makes a request.

### Instance

#### fetch.extend(options)

Configure a new `fetch` instance with default `options`.
The `options` are merged with the parent instance's `defaults`.
You can access the options with the `.defaults` property on the instance.

```js
const client = fetch.extend({
  baseUrl: 'https://example.com',
  headers: {
    'Token': 'your_token'
  }
});

client('demo');

/*
 * GET /demo HTTP/1.1
 * Host: example.com
 * Token: your_token
 */
```

See other [`options`](#options)

##### options.baseUrl

Type: `string` \
Default: `null`

##### options.hooks

```js
import fetch from 'wow-fetch'

const client = fetch.extend({
  hooks: {
    beforeRequest(opts) => opts,
    async afterResponse(res) => res,
    async requestError(opts, err) => { },
    async responseError(res, err) => res
  }
})
```

* Both `beforeRequest`, `afterRequest`, `requestError` and `responseError` are optional and can be array
* `beforeRequest` must return new options
* `afterResponse` must return new response
* If `responseError` return response, hooks will be break 

#### fetch.defaults

Type: `object`

The fetch defaults used in that instance.

### Static

#### createInstance(nextOptions, prevOptions?)

Create fetch instance with default options.

```js
import { createInstance } from 'wow-fetch'

const defaultOptions = { }
const fetch = createInstance(defaultOptions)
```
