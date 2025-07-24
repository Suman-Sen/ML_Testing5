export function toggleShowMetadata<T extends { showMetadata?: boolean }>(
  index: number,
  state: T[],
  setState: React.Dispatch<React.SetStateAction<T[]>>
) {
  setState((prev) =>
    prev.map((item, i) =>
      i === index ? { ...item, showMetadata: !item.showMetadata } : item
    )
  );
}
