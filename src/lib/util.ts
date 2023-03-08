export function isPlainObject(target: unknown): boolean {
  return target?.constructor === Object
}

const nullBodyStatus = new Set([ 101, 204, 205, 304 ])
export const redirectStatus = new Set([ 300, 301, 302, 303, 307, 308 ])

export function isNullBody(status: number): boolean {
  return nullBodyStatus.has(status)
}

export async function asyncForEach<T = unknown>(array: T[], callback: (item: T, index: number, array: T[]) => Promise<boolean | void>): Promise<void> {
  for (let i = 0; i < array.length; i++) {
    const result = await callback(array[i], i, array)
    if (result === false) {
      return
    }
  }
}

export async function asyncReduce<T = unknown>(array: T[], callback: (value: unknown, current: T) => Promise<unknown>, initial?: unknown): Promise<unknown> {
  let value = initial
  for (const item of array) {
    value = await callback(value, item)
  }
  return value
}

export function getSetCookies(setCookieString: string): string[] {
  return setCookieString.match(/[^=, ]+=[^;]*(; ([^=, ]+=[^;]+|secure|httponly))*/gi)
}
