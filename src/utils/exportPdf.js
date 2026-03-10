const MARGIN_X = 34
const getPageLayout = (orientation = 'portrait') => {
  const isLandscape = orientation === 'landscape'
  const width = isLandscape ? 842 : 595
  const height = isLandscape ? 595 : 842
  return { width, height, contentWidth: width - (MARGIN_X * 2) }
}
const FIRST_PAGE_ROW_CAPACITY = 15
const NEXT_PAGE_ROW_CAPACITY = 24
const NORMAL_FONT = 'F1'
const BOLD_FONT = 'F2'

const toPdfNumber = (value) => Number(value).toFixed(2).replace(/\.00$/, '')
const rgb = ([r, g, b]) => `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`
const escapePdfText = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')

const textCommand = (text, x, y, options = {}) => {
  const {
    size = 10,
    font = NORMAL_FONT,
    color = [24, 41, 58],
  } = options

  return [
    'BT',
    `/${font} ${toPdfNumber(size)} Tf`,
    `${rgb(color)} rg`,
    `1 0 0 1 ${toPdfNumber(x)} ${toPdfNumber(y)} Tm`,
    `(${escapePdfText(text)}) Tj`,
    'ET',
  ].join('\n')
}

const rectCommand = (x, y, width, height, fill, stroke = null, lineWidth = 1) => {
  const commands = []
  if (fill) commands.push(`${rgb(fill)} rg`)
  if (stroke) commands.push(`${rgb(stroke)} RG`, `${toPdfNumber(lineWidth)} w`)
  commands.push(`${toPdfNumber(x)} ${toPdfNumber(y)} ${toPdfNumber(width)} ${toPdfNumber(height)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`)
  return commands.join('\n')
}

const lineCommand = (x1, y1, x2, y2, color, lineWidth = 1, round = false) => {
  const commands = [
    `${rgb(color)} RG`,
    `${toPdfNumber(lineWidth)} w`,
  ]
  if (round) commands.push('1 J')
  commands.push(`${toPdfNumber(x1)} ${toPdfNumber(y1)} m`)
  commands.push(`${toPdfNumber(x2)} ${toPdfNumber(y2)} l`)
  commands.push('S')
  return commands.join('\n')
}

const ellipseCommand = (cx, cy, rx, ry, fill) => {
  const k = 0.5522847498
  const ox = rx * k
  const oy = ry * k
  return [
    `${rgb(fill)} rg`,
    `${toPdfNumber(cx + rx)} ${toPdfNumber(cy)} m`,
    `${toPdfNumber(cx + rx)} ${toPdfNumber(cy + oy)} ${toPdfNumber(cx + ox)} ${toPdfNumber(cy + ry)} ${toPdfNumber(cx)} ${toPdfNumber(cy + ry)} c`,
    `${toPdfNumber(cx - ox)} ${toPdfNumber(cy + ry)} ${toPdfNumber(cx - rx)} ${toPdfNumber(cy + oy)} ${toPdfNumber(cx - rx)} ${toPdfNumber(cy)} c`,
    `${toPdfNumber(cx - rx)} ${toPdfNumber(cy - oy)} ${toPdfNumber(cx - ox)} ${toPdfNumber(cy - ry)} ${toPdfNumber(cx)} ${toPdfNumber(cy - ry)} c`,
    `${toPdfNumber(cx + ox)} ${toPdfNumber(cy - ry)} ${toPdfNumber(cx + rx)} ${toPdfNumber(cy - oy)} ${toPdfNumber(cx + rx)} ${toPdfNumber(cy)} c`,
    'f',
  ].join('\n')
}

const imageCommand = (name, x, y, width, height) => [
  'q',
  `${toPdfNumber(width)} 0 0 ${toPdfNumber(height)} ${toPdfNumber(x)} ${toPdfNumber(y)} cm`,
  `/${name} Do`,
  'Q',
].join('\n')

const truncateToWidth = (text, width, fontSize) => {
  const safe = String(text ?? '')
  const charWidth = fontSize * 0.52
  const limit = Math.max(4, Math.floor((width - 10) / charWidth))
  if (safe.length <= limit) return safe
  if (limit <= 3) return safe.slice(0, limit)
  return `${safe.slice(0, limit - 3)}...`
}

const parseColumnWidths = (columns, contentWidth) => {
  const specified = columns.map((column) => {
    if (!column.width) return null
    const parsed = Number.parseFloat(String(column.width).replace('px', ''))
    return Number.isFinite(parsed) ? parsed : null
  })

  const fixedWidth = specified.reduce((sum, width) => sum + (width || 0), 0)
  const flexCount = specified.filter((width) => width == null).length || 1
  const available = Math.max(120, contentWidth - fixedWidth)
  const flexWidth = available / flexCount

  let widths = specified.map((width) => width ?? flexWidth)
  const total = widths.reduce((sum, width) => sum + width, 0)

  if (total > contentWidth) {
    const scale = contentWidth / total
    widths = widths.map((width) => width * scale)
  }

  return widths
}

const chunkRows = (rows) => {
  const chunks = []
  let index = 0
  let capacity = FIRST_PAGE_ROW_CAPACITY

  while (index < rows.length) {
    chunks.push(rows.slice(index, index + capacity))
    index += capacity
    capacity = NEXT_PAGE_ROW_CAPACITY
  }

  if (!chunks.length) chunks.push([])
  return chunks
}

const buildClosedRelativeCubicPath = (start, curves, fill, baseX, baseY, scale) => {
  let currentX = start[0]
  let currentY = start[1]
  const cmds = [`${rgb(fill)} rg`]
  cmds.push(`${toPdfNumber(baseX + (currentX * scale))} ${toPdfNumber(baseY - (currentY * scale))} m`)

  curves.forEach(([dx1, dy1, dx2, dy2, dx, dy]) => {
    const x1 = currentX + dx1
    const y1 = currentY + dy1
    const x2 = currentX + dx2
    const y2 = currentY + dy2
    currentX += dx
    currentY += dy
    cmds.push(
      `${toPdfNumber(baseX + (x1 * scale))} ${toPdfNumber(baseY - (y1 * scale))} ` +
      `${toPdfNumber(baseX + (x2 * scale))} ${toPdfNumber(baseY - (y2 * scale))} ` +
      `${toPdfNumber(baseX + (currentX * scale))} ${toPdfNumber(baseY - (currentY * scale))} c`
    )
  })

  cmds.push('h')
  cmds.push('f')
  return cmds.join('\n')
}

const buildVectorLogoCommands = (layout) => {
  const baseX = 34
  const baseY = layout.height - 54
  const scale = 0.72
  const pointX = (x) => baseX + (x * scale)
  const pointY = (y) => baseY - (y * scale)

  return [
    ellipseCommand(pointX(45), pointY(16), 9 * scale, 12 * scale, [244, 180, 0]),
    ellipseCommand(pointX(35), pointY(27), 9 * scale, 12 * scale, [246, 191, 38]),
    lineCommand(pointX(14), pointY(50), pointX(14), pointY(13), [242, 140, 24], 2.2 * scale, true),
    buildClosedRelativeCubicPath([14, 20], [[-6, -1, -10, -6, -10, -12], [6, 1, 10, 6, 10, 12]], [242, 140, 24], baseX, baseY, scale),
    buildClosedRelativeCubicPath([14, 29], [[-6, -1, -10, -6, -10, -12], [6, 1, 10, 6, 10, 12]], [244, 161, 31], baseX, baseY, scale),
    buildClosedRelativeCubicPath([14, 38], [[-6, -1, -10, -6, -10, -12], [6, 1, 10, 6, 10, 12]], [245, 158, 11], baseX, baseY, scale),
    buildClosedRelativeCubicPath([18, 43], [[8, -9, 21, -6, 24, 5], [-9, 4, -19, 2, -24, -5]], [95, 174, 77], baseX, baseY, scale),
    buildClosedRelativeCubicPath([42, 50], [[-4, -11, 2, -22, 15, -24], [2, 11, -3, 20, -15, 24]], [63, 143, 58], baseX, baseY, scale),
  ]
}

const loadLogoImage = () => {
  if (typeof window === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const size = 96
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) {
        resolve(null)
        return
      }

      context.fillStyle = '#eff5ec'
      context.fillRect(0, 0, size, size)
      context.drawImage(image, 0, 0, size, size)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const base64 = dataUrl.split(',')[1]
      const binary = atob(base64)
      resolve({
        width: size,
        height: size,
        data: binary,
      })
    }
    image.onerror = () => resolve(null)
    image.src = '/KGL-favicon.png'
  })
}

const buildLogoCommands = (useImage, layout) => {
  const commands = []
  if (useImage) {
    commands.push(imageCommand('Im1', 38, layout.height - 94, 38, 38))
  } else {
    commands.push(...buildVectorLogoCommands(layout))
  }
  commands.push(textCommand('Karibu', 90, layout.height - 69, { size: 22, font: BOLD_FONT, color: [214, 107, 11] }))
  commands.push(textCommand('Grocery', 170, layout.height - 69, { size: 22, font: BOLD_FONT, color: [34, 134, 58] }))
  return commands
}

const buildMetaBox = (x, y, width, label, value) => {
  return [
    rectCommand(x, y, width, 32, [247, 249, 244], [207, 217, 209], 1),
    textCommand(label, x + 10, y + 20, { size: 8, font: BOLD_FONT, color: [108, 123, 134] }),
    textCommand(value, x + 10, y + 8, { size: 10, font: BOLD_FONT, color: [35, 49, 61] }),
  ].join('\n')
}

const buildFooterCommands = (pageNumber, totalPages, layout) => {
  const generatedAt = new Date().toLocaleDateString('en-GB')
  const footerY = 28

  return [
    lineCommand(MARGIN_X, footerY + 10, layout.width - MARGIN_X, footerY + 10, [208, 219, 210], 0.8),
    textCommand(`Generated ${generatedAt}`, MARGIN_X, footerY - 1, { size: 8, color: [108, 123, 134] }),
    textCommand('Karibu Grocery', (layout.width / 2) - 28, footerY - 1, { size: 8, font: BOLD_FONT, color: [57, 83, 71] }),
    textCommand(`Page ${pageNumber} of ${totalPages}`, layout.width - MARGIN_X - 48, footerY - 1, { size: 8, color: [108, 123, 134] }),
  ].join('\n')
}

const buildFirstPage = ({ title, meta, columns, rows, totals, widths, pageNumber, totalPages, useImageLogo, layout }) => {
  const commands = []

  const headerY = layout.height - 102
  const titleY = layout.height - 122
  const subtitleY = layout.height - 137
  const metaY = layout.height - 187
  const tableTopY = layout.height - 232

  commands.push(rectCommand(MARGIN_X, headerY, layout.contentWidth, 64, [239, 245, 236], [207, 222, 209], 1))
  commands.push(...buildLogoCommands(useImageLogo, layout))
  commands.push(textCommand(title, MARGIN_X, titleY, { size: 18, font: BOLD_FONT, color: [34, 72, 56] }))
  commands.push(textCommand('Operational branch report export', MARGIN_X, subtitleY, { size: 9, color: [109, 125, 115] }))

  const metaEntries = Object.entries(meta || {})
  const gap = 10
  const metaWidth = (layout.contentWidth - (gap * Math.max(0, metaEntries.length - 1))) / Math.max(1, metaEntries.length)
  metaEntries.forEach(([label, value], index) => {
    const x = MARGIN_X + (index * (metaWidth + gap))
    commands.push(buildMetaBox(x, metaY, metaWidth, label, value))
  })

  commands.push(...buildTableCommands({ topY: tableTopY, columns, rows, widths, layout }))
  commands.push(...buildTotalsCommands(totals, tableTopY - 30 - ((rows.length + 1) * 24), layout))
  commands.push(buildFooterCommands(pageNumber, totalPages, layout))

  return commands.join('\n')
}

const buildFollowPage = ({ title, columns, rows, widths, pageIndex, includeTotals, totals, totalPages, layout }) => {
  const commands = []
  const headerY = layout.height - 70
  const titleY = layout.height - 56
  const pageY = layout.height - 50
  const tableTopY = layout.height - 82

  commands.push(rectCommand(MARGIN_X, headerY, layout.contentWidth, 34, [245, 248, 242], [214, 223, 215], 1))
  commands.push(textCommand(title, MARGIN_X + 12, titleY, { size: 14, font: BOLD_FONT, color: [34, 72, 56] }))
  commands.push(textCommand(`Page ${pageIndex + 1}`, layout.width - MARGIN_X - 42, 792, { size: 8, color: [108, 123, 134] }))
  commands.push(...buildTableCommands({ topY: tableTopY, columns, rows, widths, layout }))
  if (includeTotals) {
    commands.push(...buildTotalsCommands(totals, tableTopY - 30 - ((rows.length + 1) * 24), layout))
  }
  commands.push(buildFooterCommands(pageIndex + 1, totalPages, layout))
  return commands.join('\n')
}

const buildTableCommands = ({ topY, columns, rows, widths, layout }) => {
  const commands = []
  const rowHeight = 24
  const headerHeight = 24
  let cursorX = MARGIN_X

  commands.push(rectCommand(MARGIN_X, topY, layout.contentWidth, headerHeight, [47, 107, 77], [47, 107, 77], 1))

  columns.forEach((column, index) => {
    const width = widths[index]
    commands.push(textCommand(column.label, cursorX + 6, topY + 7, { size: 9, font: BOLD_FONT, color: [255, 255, 255] }))
    if (index > 0) {
      commands.push(lineCommand(cursorX, topY, cursorX, topY + headerHeight, [88, 141, 112], 0.6))
    }
    cursorX += width
  })

  rows.forEach((row, rowIndex) => {
    const y = topY - ((rowIndex + 1) * rowHeight)
    const fill = rowIndex % 2 === 0 ? [250, 251, 248] : [242, 247, 243]
    commands.push(rectCommand(MARGIN_X, y, layout.contentWidth, rowHeight, fill, [225, 233, 227], 0.8))

    let x = MARGIN_X
    columns.forEach((column, index) => {
      const width = widths[index]
      const rawText = row[column.key] ?? ''
      const fontSize = 9
      const cellText = truncateToWidth(rawText, width, fontSize)
      const textWidthStart = column.align === 'right' ? Math.max(6, width - ((cellText.length * fontSize * 0.52) + 8)) : 6
      commands.push(textCommand(cellText, x + textWidthStart, y + 7, {
        size: fontSize,
        font: NORMAL_FONT,
        color: column.key === 'status'
          ? String(rawText).toLowerCase().includes('clear')
            ? [27, 124, 67]
            : [154, 123, 19]
          : [31, 41, 55],
      }))
      if (index > 0) {
        commands.push(lineCommand(x, y, x, y + rowHeight, [221, 230, 223], 0.5))
      }
      x += width
    })
  })

  return commands
}

const buildTotalsCommands = (totals, startY, layout) => {
  const entries = Object.entries(totals || {})
  if (!entries.length) return []

  const cardWidth = Math.min(160, (layout.contentWidth - ((entries.length - 1) * 10)) / entries.length)
  const totalWidth = (cardWidth * entries.length) + ((entries.length - 1) * 10)
  let x = MARGIN_X + Math.max(0, (layout.contentWidth - totalWidth))
  const y = Math.max(54, startY)

  return entries.flatMap(([label, value], index) => {
    const palette = index === 0
      ? { fill: [244, 235, 221], stroke: [225, 194, 150], value: [198, 117, 25] }
      : { fill: [234, 244, 236], stroke: [179, 209, 189], value: [33, 126, 69] }

    const card = [
      rectCommand(x, y, cardWidth, 42, palette.fill, palette.stroke, 1),
      textCommand(label, x + 10, y + 25, { size: 8, font: BOLD_FONT, color: [108, 123, 134] }),
      textCommand(value, x + 10, y + 10, { size: 12, font: BOLD_FONT, color: palette.value }),
    ]
    x += cardWidth + 10
    return card
  })
}

export const exportReportToPdf = async ({ title, columns, rows, totals, filename = 'report', meta = {}, orientation = 'portrait' }) => {
  if (typeof window === 'undefined') return

  const layout = getPageLayout(orientation)
  const widths = parseColumnWidths(columns, layout.contentWidth)
  const rowChunks = chunkRows(rows)
  const logoImage = await loadLogoImage()
  const useImageLogo = Boolean(logoImage)
  let totalPages = rowChunks.length

  let pageContents = rowChunks.map((chunk, index) => {
    if (index === 0) {
      return buildFirstPage({ title, meta, columns, rows: chunk, totals: rowChunks.length === 1 ? totals : {}, widths, pageNumber: 1, totalPages, useImageLogo, layout })
    }
    const isLast = index === rowChunks.length - 1
    return buildFollowPage({ title, columns, rows: chunk, widths, pageIndex: index, includeTotals: isLast, totals, totalPages, layout })
  })

  if (rowChunks.length > 1 && Object.keys(totals || {}).length) {
    const lastChunk = rowChunks[rowChunks.length - 1]
    if (lastChunk.length >= NEXT_PAGE_ROW_CAPACITY - 2) {
      totalPages += 1
      pageContents = rowChunks.map((chunk, index) => {
        if (index === 0) {
          return buildFirstPage({ title, meta, columns, rows: chunk, totals: {}, widths, pageNumber: 1, totalPages, useImageLogo, layout })
        }
        return buildFollowPage({ title, columns, rows: chunk, widths, pageIndex: index, includeTotals: false, totals: {}, totalPages, layout })
      })
      pageContents.push(buildFollowPage({ title, columns, rows: [], widths, pageIndex: rowChunks.length, includeTotals: true, totals, totalPages, layout }))
    } else {
      pageContents = rowChunks.map((chunk, index) => {
        if (index === 0) {
          return buildFirstPage({ title, meta, columns, rows: chunk, totals: {}, widths, pageNumber: 1, totalPages, useImageLogo, layout })
        }
        const isLast = index === rowChunks.length - 1
        return buildFollowPage({ title, columns, rows: chunk, widths, pageIndex: index, includeTotals: isLast, totals, totalPages, layout })
      })
    }
  }

  const objects = []
  const addObject = (content) => {
    objects.push(content)
    return objects.length
  }

  const normalFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  const logoImageObjectId = logoImage
    ? addObject(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.data.length} >>\nstream\n${logoImage.data}endstream`)
    : null
  const pageObjectIds = []

  pageContents.forEach((content) => {
    const contentObjectId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const imageResource = logoImageObjectId ? ` /XObject << /Im1 ${logoImageObjectId} 0 R >>` : ''
    const pageObjectId = addObject(`<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 ${layout.width} ${layout.height}] /Resources << /Font << /${NORMAL_FONT} ${normalFontId} 0 R /${BOLD_FONT} ${boldFontId} 0 R >>${imageResource} >> /Contents ${contentObjectId} 0 R >>`)
    pageObjectIds.push(pageObjectId)
  })

  const pagesObjectId = addObject(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`)
  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`)

  pageObjectIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace('PAGES_ID', String(pagesObjectId))
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((objectContent, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i += 1) {
    bytes[i] = pdf.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}




