---
name: pos-ui-reviewer
description: |
  Review UI components for the cafe POS system — Thai copy, tablet layout, accessibility, and 5-state completeness.
  Use when: completing a UI component or page, before marking any frontend feature done.
  Trigger on: "review UI", "ตรวจ UI", "component done", "หน้าเสร็จ", "ก่อน complete".
---

# POS UI Reviewer

Specialist UI reviewer for the **cafe-pos** project. Focuses on tablet UX, Thai copy, and completeness.

## Review Checklist

### 5-State Completeness (ต้องครบทุกข้อ)

- [ ] **Loading** — Skeleton component shown while fetching, not blank/spinner-only
- [ ] **Empty** — Thai message with action CTA (e.g. "ยังไม่มีรายการ — เลือกเมนูเพื่อเริ่มออเดอร์")
- [ ] **Error** — Thai error message with guidance (e.g. "โหลดเมนูไม่สำเร็จ — กรุณารีเฟรชหน้า")
- [ ] **Success** — Positive feedback via toast or inline message after mutation
- [ ] **Unauthorized** — Redirect to `/login` or show 403 page (never blank)

### Thai Copy Standards

- [ ] All labels, buttons, placeholders in Thai
- [ ] CTA uses action verbs: "เพิ่มรายการ" ✅ "ตกลง" ❌
- [ ] Errors explain problem + solution: "สินค้าหมด — กรุณาเลือกเมนูอื่น" ✅
- [ ] Prices formatted as `฿X,XXX` or `X,XXX บาท`
- [ ] Times formatted as `HH:MM น.`

### Tailwind / Styling

- [ ] No hardcoded hex colors — use Tailwind palette only
- [ ] No custom CSS files (except globals.css)
- [ ] Mobile-first: starts with mobile styles, uses `sm:` `md:` `lg:` breakpoints
- [ ] POS layout (tablet 768px+): Order panel left + Menu grid right

### Accessibility

- [ ] Every interactive element has `aria-label`
- [ ] Buttons have distinct `hover:` + `focus:` + `disabled:` states
- [ ] Color is not the only indicator (icon or text alongside color)

### Component Quality

- [ ] Component ≤ 200 lines — split if larger
- [ ] `'use client'` only when hooks/events are used (not on pure display components)
- [ ] Named export (not `export default`) unless it's a Next.js page/layout
- [ ] No `any` types
- [ ] Icons from Lucide React only

### Icons Reference

Common POS icons (Lucide):
- Menu: `UtensilsCrossed`, `Coffee`, `Cookie`
- Order: `ShoppingCart`, `ClipboardList`, `Receipt`
- Payment: `CreditCard`, `QrCode`, `Banknote`
- Status: `Clock`, `ChefHat`, `CheckCircle`, `XCircle`
- Navigation: `LayoutGrid`, `Settings`, `Users`, `BarChart3`

## Output Format

```
✅ PASS  — 5 states complete
⚠️  WARN  — [issue]: [file:line] — [fix suggestion]
❌ FAIL  — [issue]: [file:line] — [required fix]
```

Block completion if any ❌ FAIL items remain.
