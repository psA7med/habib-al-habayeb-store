import iconv from "iconv-lite"

/**
 * Robust decoder supporting UTF-8 (with or without BOM) and Windows-1256 (Arabic Excel format).
 */
export function decodeCsvBuffer(buffer: Buffer): string {
  // UTF-8 BOM detection
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8")
  }

  const utf8 = buffer.toString("utf8")
  // If replacement characters are present, it's likely Windows-1256
  if (utf8.includes("\uFFFD")) {
    try {
      return iconv.decode(buffer, "win1256")
    } catch {
      return utf8
    }
  }

  return utf8
}

/**
 * Standard CSV line parser handling quotes, commas, semicolons, tabs, and multiline cells.
 */
export function parseCsvLines(csvText: string): string[][] {
  const result: string[][] = []
  let currentRow: string[] = []
  let currentCell = ""
  let insideQuotes = false

  // Detect delimiter: comma, semicolon, or tab
  const firstLine = csvText.split(/\r\n|\n/)[0] || ""
  let delimiter = ","
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ";"
  } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = "\t"
  }

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"'
        i++ // skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ""
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++
      currentRow.push(currentCell.trim())
      if (currentRow.some((c) => c.length > 0)) {
        result.push(currentRow)
      }
      currentRow = []
      currentCell = ""
    } else {
      currentCell += char
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    if (currentRow.some((c) => c.length > 0)) {
      result.push(currentRow)
    }
  }

  return result
}
