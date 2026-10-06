/**
 * Dots & Boxes grid indexing.
 *
 * Grid of `size × size` dots.
 * Boxes are `(size - 1) × (size - 1)`.
 *
 * Coordinate system: (x, y) where x → right, y → up.
 * Dot (x, y) with x, y in [0, size-1].
 *
 * Horizontal line h(y, x) connects (x, y) → (x+1, y).
 *   - y in [0, size-1], x in [0, size-2]
 *   - Total = size * (size - 1)
 *
 * Vertical line v(y, x) connects (x, y) → (x, y+1).
 *   - y in [0, size-2], x in [0, size-1]
 *   - Total = (size - 1) * size
 *
 * Box (y, x) is bounded by:
 *   - top:    h(y+1, x)
 *   - bottom: h(y, x)
 *   - left:   v(y, x)
 *   - right:  v(y, x+1)
 *   - y, x in [0, size-2]
 */

export function hIndex(size: number, y: number, x: number): number {
  return y * (size - 1) + x;
}

export function vIndex(size: number, y: number, x: number): number {
  return y * size + x;
}

export function boxIndex(size: number, y: number, x: number): number {
  return y * (size - 1) + x;
}

export function totalH(size: number): number {
  return size * (size - 1);
}

export function totalV(size: number): number {
  return (size - 1) * size;
}

export function totalBoxes(size: number): number {
  return (size - 1) * (size - 1);
}

/** Get the 4 line indices bounding a box at (y, x). */
export function boxLines(
  size: number,
  y: number,
  x: number
): { top: number; bottom: number; left: number; right: number } {
  return {
    top: hIndex(size, y + 1, x),
    bottom: hIndex(size, y, x),
    left: vIndex(size, y, x),
    right: vIndex(size, y, x + 1),
  };
}

/** Is the box at (y, x) fully surrounded by drawn lines? */
export function isBoxComplete(
  size: number,
  y: number,
  x: number,
  horizontal: Set<number>,
  vertical: Set<number>
): boolean {
  const { top, bottom, left, right } = boxLines(size, y, x);
  return (
    horizontal.has(top) &&
    horizontal.has(bottom) &&
    vertical.has(left) &&
    vertical.has(right)
  );
}

/**
 * Given a just-drawn line, return the list of boxes that share this line.
 * Each returned box is { y, x }.
 */
export function adjacentBoxes(
  size: number,
  type: "h" | "v",
  index: number
): { y: number; x: number }[] {
  const boxes: { y: number; x: number }[] = [];

  if (type === "h") {
    // horizontal line h(y, x)
    const y = Math.floor(index / (size - 1));
    const x = index % (size - 1);
    // box above (y, x) if y < size-1
    if (y < size - 1) boxes.push({ y, x });
    // box below (y-1, x) if y > 0
    if (y > 0) boxes.push({ y: y - 1, x });
  } else {
    // vertical line v(y, x)
    const y = Math.floor(index / size);
    const x = index % size;
    // box right (y, x) if x < size-1
    if (x < size - 1) boxes.push({ y, x });
    // box left (y, x-1) if x > 0
    if (x > 0) boxes.push({ y, x: x - 1 });
  }

  return boxes;
}

/** Is a given line already drawn? */
export function isLineDrawn(
  type: "h" | "v",
  index: number,
  horizontal: Set<number>,
  vertical: Set<number>
): boolean {
  return type === "h" ? horizontal.has(index) : vertical.has(index);
}

/** Bounds check — is this a valid line index for this grid size? */
export function isValidLine(
  size: number,
  type: "h" | "v",
  index: number
): boolean {
  if (type === "h") {
    return index >= 0 && index < totalH(size);
  }
  return index >= 0 && index < totalV(size);
}