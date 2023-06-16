export const crawlObject = <Type extends Record<string, any>>(
  original: Type,
  destination: Type,
  condition: (slice: Type) => boolean,
  onSlice: (original: Type, destination: Type, path: string[]) => void,
  path: string[] = [],
) => {
  if (!original) {
    return
  }
  if (condition(original)) {
    onSlice(original, destination, path)
  } else if (typeof original === 'object') {
    Object.keys(original).forEach((key) => {
      if (condition(original[key])) {
        destination[key as keyof Type] = destination[key] ?? {}
      }
      crawlObject(original[key], destination[key], condition, onSlice, [
        ...path,
        key,
      ])
    })
  }
}
