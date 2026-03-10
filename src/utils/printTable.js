const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export const printSimpleTable = ({ title, subtitle = '', columns = [], rows = [], totals = [] }) => {
  if (typeof window === 'undefined') return

  const popup = window.open('', '_blank', 'width=980,height=720')
  if (!popup) return

  const headerCells = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const bodyRows = rows.length
    ? rows.map((row) => `
      <tr>${columns.map((column) => `<td>${escapeHtml(row[column.key] ?? '')}</td>`).join('')}</tr>
    `).join('')
    : `<tr><td colspan="${columns.length}" class="empty">No records available.</td></tr>`

  const totalsMarkup = totals.length
    ? `<div class="totals">${totals.map((total) => `<div class="total-card"><span>${escapeHtml(total.label)}</span><strong>${escapeHtml(total.value)}</strong></div>`).join('')}</div>`
    : ''

  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 24px; color: #1f2937; }
    .title { font-size: 22px; font-weight: 700; margin: 0; }
    .subtitle { margin: 6px 0 18px; color: #5f6f5e; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; border: 1px solid #d8decf; font-size: 12px; text-align: left; }
    th { background: #eef1e6; color: #566a61; text-transform: uppercase; font-size: 10px; letter-spacing: .08em; }
    .empty { text-align: center; color: #64748b; }
    .totals { margin-top: 18px; display: flex; gap: 12px; justify-content: flex-end; }
    .total-card { min-width: 150px; border: 1px solid #d8decf; background: #f7faf5; border-radius: 12px; padding: 10px 12px; }
    .total-card span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6a7f67; }
    .total-card strong { display: block; margin-top: 4px; font-size: 16px; color: #30543e; }
  </style>
</head>
<body>
  <h1 class="title">${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${totalsMarkup}
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 150); };</script>
</body>
</html>`)
  popup.document.close()
}
