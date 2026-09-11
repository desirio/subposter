/**
 * A stand-in for a Supabase query builder: every chained call (`.update()`,
 * `.eq()`, ...) is recorded, and awaiting the chain resolves to `result`.
 */
export function mockQuery<T>(result: { data?: T; error?: unknown }) {
  const calls: Array<[string, unknown[]]> = []
  const resolved = { data: result.data ?? null, error: result.error ?? null }

  const builder: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(resolved).then(resolve, reject)
        }
        return (...args: unknown[]) => {
          calls.push([prop, args])
          return builder
        }
      },
    }
  )

  /** Arguments of every call to `method`, in order. */
  const argsOf = (method: string) => calls.filter(([m]) => m === method).map(([, args]) => args)

  return { builder, calls, argsOf }
}
