// MoCreative Concept — invoice document markup.
// The document itself is injected as markup (same pattern as ./brand-markup.ts
// for the home page); ../../public/invoice.js hydrates it with the editable
// line-item engine, live totals, and print/download behaviour.

const MARK = `
  <div class="inv-mark">
    <img src="/assets/mc-logo-lit.webp" width="1254" height="1254" alt="">
  </div>`;

export const INVOICE_MARKUP = `
<div class="inv-page">
  <div class="inv-shell">

    <div class="inv-toolbar">
      <span>
        <span class="tb-label" id="tbRef">Invoice</span>
        <span class="sample-badge">Sample data — not a real client</span>
      </span>
      <div class="tb-actions">
        <button class="tb-btn" id="printBtn" type="button">Download / Print</button>
      </div>
    </div>

    <article class="inv-doc" id="invDoc">
      <!-- rendered by invoice.js -->
    </article>

  </div>
</div>`;

export const INVOICE_MARK_HTML = MARK;
