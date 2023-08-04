export type ExcludeFromTuple<Tuple extends readonly any[], Unwanted> =
    Tuple extends [infer Head, ...infer Tail] ? [Head] extends [Unwanted] ? ExcludeFromTuple<Tail, Unwanted> :
    [Head, ...ExcludeFromTuple<Tail, Unwanted>] : []