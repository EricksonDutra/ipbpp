

## Plan: UX/UI Improvements for Dashboard and Admin Panel

This is a large refactoring focused on visual polish, better UX patterns, and small quality-of-life features. No business logic or data model changes.

### Files to modify

1. **`src/pages/Dashboard.tsx`** — Member dashboard improvements
2. **`src/pages/AdminPage.tsx`** — Admin panel improvements

---

### 1. Dashboard (Member Panel)

**1.1 Header & Context**
- Add contextual subtitle: "Acompanhe os pedidos de oração, finanças e projetos da igreja em um só lugar."
- Add "Ir para Painel Administrativo" link/badge for admin/pastor users (using `Link` to `/admin`)

**1.2 Financial Summary Cards**
- Labels: bump to `text-sm`, values to `text-xl font-bold`
- Color logic for Saldo card: green if > 0, red if < 0, gray if === 0
- Add small legend below Saldo: "Somatório de todos os relatórios do período selecionado"

**1.3 Financial Table**
- Rename headers: "Mês" → "Período (Mês/Ano)", "Detalhes" → "Relatório detalhado"
- Style `tfoot` with `bg-muted/50` and `border-t-2`
- Color-code Saldo per row (green/red/neutral)
- Add tooltip on "Ver" button: "Abrir relatório detalhado"
- Show `<Badge>Sem anexo</Badge>` instead of "—" when no document

**1.4 Period Filters**
- Add year `Select` (populated from distinct years in `financials`) and month `Select` (with "Todos" option)
- Default to current year
- Filter `financials` array in memory; recalculate card totals from filtered data
- Show legend: "Exibindo registros de {period}"

**1.5 Empty/Error States**
- Better empty message: "Nenhum relatório encontrado para este período. Fale com a administração para cadastrar os relatórios financeiros."

---

### 2. AdminPage — Financial Tab

**2.1 Dialog Improvements**
- Title: "Novo Relatório Financeiro" vs "Editar Relatório Financeiro"
- Group fields visually with section labels: "Período", "Valores", "Documento"

**2.2 Duplicate Protection**
- Before insert, check if `financials` array already has matching month/year
- If duplicate found, show toast warning and offer to edit existing record instead

**2.3 Admin Financial Table**
- Add "Status" column: Badge "Com anexo" (green) or "Sem anexo" (gray)
- Add sortable Period column (toggle asc/desc on header click)

**2.4 Upload UX**
- Show file name, size (formatted), and type label (PDF/Imagem/etc.)
- Validate max 10MB and allowed types before upload, show friendly error

---

### 3. AdminPage — Other Tabs

**3.1 Members**
- Add search input above the table (client-side filter by name, case-insensitive)
- Show "Administrador" badge when member has admin role

**3.2 Visitors**
- Add explanatory text: "Compartilhe o link com visitantes para preencherem seus dados pelo celular."
- Add confirmation dialog before deleting a visitor

**3.3 Requests**
- Highlight pending requests with `bg-amber-50` background and `AlertTriangle` icon
- After approve/reject, collapse the admin notes area for reviewed items (already done partially)

**3.4 Notices**
- Show "Inativo" label below title for inactive notices (already partially done, enhance)
- Sort: active notices first, then inactive, preserving date order within groups

---

### 4. Typography, Spacing & Responsiveness

- Consistent typography: `text-2xl/font-bold` for page titles, `text-lg/font-bold` for sections, `text-sm/font-semibold` for table headers
- Increase card padding to `p-5`, section spacing to `mb-8`
- Table cells: minimum `py-3`
- Ensure cards stack on mobile, tables scroll horizontally smoothly

---

### Technical Approach

All changes are purely presentational and client-side filtering. No database migrations, no new API calls, no new edge functions. Both files (`Dashboard.tsx` and `AdminPage.tsx`) will be rewritten with the enhancements while preserving all existing logic and data flows.

Estimated scope: ~2 files modified significantly, using existing UI components (Badge, Select, Tooltip, Dialog, AlertDialog).

