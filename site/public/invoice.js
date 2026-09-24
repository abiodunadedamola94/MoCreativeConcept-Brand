/* ══════════════════════════════════════════════════════════
   MoCreative Concept — Invoice document (client script)
   Renders the INVOICE data object into #invDoc, then wires the
   editable line-item engine: click-to-edit title/description,
   an editable price field, a qty +/- stepper, per-row delete,
   add-row, and live recalculation of every downstream total
   (row total -> table subtotal -> grand total -> each milestone
   amount). This is the object Agent 09 / Agent 10 will populate
   per client — swap the INVOICE literal below for a fetch to
   Supabase once invoices are stored there instead of hardcoded.
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const INVOICE = {
    status: "unpaid", // unpaid | paid | overdue
    currency: "₦",

    from: {
      name: "MoCreative Concept",
      role: "Product Design & AI Automation",
      phone: ["+234 814 536 1262", "+234 811 828 6894"],
      email: "hello@mocreativeconcept.com",
      website: "mocreativeconcept.com",
    },

    to: {
      company: "H.N.O Apartment Agency",
      address: "Bourdillon Rd, Ikoyi, Lagos, Nigeria",
      phone: "+234 707 752 9216",
    },

    meta: {
      invoiceNo: "0012345",
      timeline: "4–5 Weeks",
      date: "12 May 2026",
      dueDate: "",
    },

    items: [
      { title: "Product Strategy & UX Planning", sub: "Product architecture and structural build", price: 120000, qty: 1 },
      { title: "UI/UX Design", sub: "UI design, prototyping, design system", price: 220000, qty: 1 },
      { title: "Frontend Development", sub: "Coding and implementation", price: 280000, qty: 1 },
      { title: "CMS Integration", sub: "Content management system software", price: 60000, qty: 1 },
      { title: "Blog & Reviews System", sub: "Social content and client testimonials", price: 50000, qty: 1 },
      { title: "WhatsApp & Inquiry Integration", sub: "Contact form and field API", price: 40000, qty: 1 },
      { title: "SEO & Mobile Optimization", sub: "Performance optimization and responsiveness", price: 45000, qty: 1 },
      { title: "Deployment & Launch Setup", sub: "DNS configuration", price: 35000, qty: 1 },
      { title: "Project Management & QA", sub: "Product review and testing", price: 25000, qty: 1 },
    ],

    additionalCosts: [
      { title: "Custom Domain (.com)", sub: "Domain name purchase and ownership", price: 25000, qty: 1, unit: "/yr" },
      { title: "Hosting / VPS", sub: "Security and data protection server", price: 60000, qty: 1, unit: "/yr" },
    ],

    tax: { label: "Tax VAT 18%", amount: 25000 },
    discount: 0,

    milestones: [
      { label: "Initial Deposit", pct: 50 },
      { label: "Midway Payment", pct: 30 },
      { label: "Final Payment before launch", pct: 20 },
    ],

    postLaunchSupport:
      "Includes 2 weeks of post-launch support, bug fixes, deployment assistance, and minor content adjustments.",

    positioning:
      "This project is positioned as a Premium Hospitality Agency Platform designed to create a scalable, luxury digital experience for guests and apartment owners.",

    notes: [
      "Payment is due within <strong>7 days</strong> of the invoice date. Please quote the invoice number in your transfer description.",
      "Deliverables are released within 24 hours of payment confirmation. Questions: <strong>hello@mocreativeconcept.com</strong>.",
    ],

    payment: {
      holder: "Abiodun Adedamola David",
      methods: [
        { bank: "OPay", account: "8145361262" },
        { bank: "FCMB", account: "4536241019" },
      ],
    },

    thanks: "Thanks for building with me.",
  };

  const cur = INVOICE.currency || "₦";
  const money = (n) => cur + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plainNum = (n) => Math.round(Number(n) || 0).toLocaleString("en-NG");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const MARK = `<div class="inv-mark"><img src="/assets/mc-logo-lit.webp" width="1254" height="1254" alt=""></div>`;

  function buildRow(i) {
    const unit = i.unit ? `<span class="unit-suffix">${esc(i.unit)}</span>` : "";
    return `
    <div class="tbl-row">
      <div class="td">
        <input class="title-input" type="text" value="${esc(i.title || "")}" placeholder="Item title" aria-label="Item title">
        <input class="sub-input" type="text" value="${esc(i.sub || "")}" placeholder="Short description" aria-label="Item description">
      </div>
      <div class="td num price-cell" data-k="Price">
        <span class="cur-sym">${cur}</span>
        <input class="price-input" type="text" inputmode="decimal" value="${plainNum(i.price)}" aria-label="Price">
        ${unit}
      </div>
      <div class="td num qty" data-k="Qty">
        <div class="qty-stepper">
          <button class="qty-btn" type="button" data-dir="-1" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-val">${i.qty ?? 1}</span>
          <button class="qty-btn" type="button" data-dir="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="td num" data-k="Total"><span class="row-total">${money(i.price * (i.qty ?? 1))}</span></div>
      <button class="row-del" type="button" aria-label="Remove item">&#10005;</button>
    </div>`;
  }

  function metaRow(k, v, gold) {
    return `<div class="meta-row"><span class="meta-k">${esc(k)}</span><span class="meta-v${gold ? " is-gold" : ""}">${esc(v)}</span></div>`;
  }

  function render() {
    const d = INVOICE;
    const sum = (arr) => arr.reduce((t, i) => t + i.price * (i.qty ?? 1), 0);
    const itemsTotal = sum(d.items);
    const addonsTotal = sum(d.additionalCosts || []);
    const taxAmount = d.tax?.amount ?? 0;
    const discount = d.discount ?? 0;
    const grand = itemsTotal + addonsTotal + taxAmount - discount;
    const statusText = { unpaid: "Unpaid", paid: "Paid", overdue: "Overdue" }[d.status] || "Unpaid";

    const html = `
    <header class="inv-masthead">
      <div class="mast-brand">
        ${MARK}
        <div>
          <div class="mast-name">${esc(d.from.name)}</div>
          <div class="mast-role">${esc(d.from.role)}</div>
        </div>
      </div>
      <div class="mast-contact">
        <div class="mc-col"><div class="mc-label">Phone</div><div class="mc-val">${d.from.phone.map(esc).join("<br>")}</div></div>
        <div class="mc-col"><div class="mc-label">Email</div><div class="mc-val">${esc(d.from.email)}</div></div>
        <div class="mc-col"><div class="mc-label">Website</div><div class="mc-val">${esc(d.from.website)}</div></div>
      </div>
    </header>

    <div class="inv-wave">
      <svg viewBox="0 0 1200 34" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h1200v10c-200 24-420 24-600 10S200 2 0 22z" fill="var(--mo-gold)" opacity=".92"/>
      </svg>
    </div>

    <div class="inv-body">
      <div class="inv-head-grid">
        <div>
          <div class="to-label">To</div>
          <div class="to-name">${esc(d.to.company)}</div>
          <div class="to-detail">${esc(d.to.address)}<br>Phone: ${esc(d.to.phone)}</div>
          <span class="inv-status" data-state="${esc(d.status)}">${statusText}</span>
        </div>
        <div class="inv-title-block">
          <h1 class="inv-wordmark" id="invHeading">INVOICE</h1>
          <div class="inv-meta-rows">
            ${metaRow("Invoice No", d.meta.invoiceNo, true)}
            ${metaRow("Timeline", d.meta.timeline)}
            ${metaRow("Date", d.meta.date)}
            ${d.meta.dueDate ? metaRow("Due", d.meta.dueDate) : ""}
          </div>
        </div>
      </div>

      <div class="inv-table">
        <div class="tbl-head">
          <span class="th">Item Description</span><span class="th num">Price</span><span class="th num">Qty</span><span class="th num">Total</span><span class="th"></span>
        </div>
        <div id="itemsBody">${d.items.map(buildRow).join("")}</div>
        <button class="add-row-btn" type="button" data-target="items">+ Add item</button>
        <div class="tbl-subtotal"><div class="st-k">Sub Total</div><div class="st-v" id="itemsSubtotal">${money(itemsTotal)}</div></div>
      </div>

      <div class="inv-table">
        <div class="tbl-head">
          <span class="th">Additional Costs</span><span class="th num">Price</span><span class="th num">Qty</span><span class="th num">Total</span><span class="th"></span>
        </div>
        <div id="addonsBody">${(d.additionalCosts || []).map(buildRow).join("")}</div>
        <button class="add-row-btn" type="button" data-target="addons">+ Add cost</button>
      </div>

      <div class="totals-bar">
        <div class="tot-row" id="totAddonsRow" style="${addonsTotal ? "" : "display:none"}">
          <span class="tot-k">Additional Costs</span><span class="tot-v" id="addonsTotalVal">${money(addonsTotal)}</span>
        </div>
        ${taxAmount ? `<div class="tot-row"><span class="tot-k">${esc(d.tax.label)}</span><span class="tot-v">${money(taxAmount)}</span></div>` : ""}
        ${discount ? `<div class="tot-row"><span class="tot-k">Discount</span><span class="tot-v">−${money(discount)}</span></div>` : ""}
        <div class="tot-rule"></div>
        <div class="tot-row is-grand"><span class="tot-k">Grand Total</span><span class="tot-v" id="grandTotal">${money(grand)}</span></div>
      </div>

      ${
        d.milestones && d.milestones.length
          ? `
      <div class="sec-head"><h2>Payment Structure</h2><span class="rule"></span></div>
      <div class="ms-table" id="msTable">
        <div class="ms-head"><span class="th">Milestone</span><span class="th num">Amount</span></div>
        ${d.milestones
          .map(
            (m) => `
        <div class="ms-row" data-pct="${m.pct}">
          <div class="td">${esc(m.label)}<span class="ms-pct">${m.pct}%</span></div>
          <div class="td num" data-k="Amount"><span class="ms-amount">${money(Math.round((grand * m.pct) / 100))}</span></div>
        </div>`
          )
          .join("")}
      </div>`
          : ""
      }

      ${d.postLaunchSupport ? `<div class="support-strip"><div class="ss-k">Post-Launch Support</div><div class="ss-v">${esc(d.postLaunchSupport)}</div></div>` : ""}

      ${d.notes && d.notes.length ? `<div class="notes-block"><div class="n-label">Notes</div>${d.notes.map((n) => `<p>${n}</p>`).join("")}</div>` : ""}

      <footer class="inv-footer">
        <div>
          ${d.positioning ? `<p class="positioning">${esc(d.positioning)}</p>` : ""}
          <div class="powered">${MARK}<div><div class="pw-label">Powered by</div><div class="pw-name">MoCreative Concept</div></div></div>
        </div>
        <div class="pay-info">
          <div class="pi-label">Payment Info</div>
          ${d.payment.methods
            .map(
              (m) => `
          <div class="pay-method">
            <div class="pay-bank">${esc(m.bank)}</div>
            <div class="pay-acct"><span>${esc(m.account)}</span><button class="copy-btn" type="button" data-copy="${esc(m.account)}">Copy</button></div>
          </div>`
            )
            .join("")}
          <div class="pay-holder">${esc(d.payment.holder)}</div>
        </div>
      </footer>

      ${d.thanks ? `<div class="thanks">${esc(d.thanks)}</div>` : ""}
    </div>`;

    const docEl = document.getElementById("invDoc");
    if (!docEl) return;
    docEl.innerHTML = html;

    const tbRef = document.getElementById("tbRef");
    if (tbRef) tbRef.textContent = "Invoice " + d.meta.invoiceNo;
    document.title = `Invoice ${d.meta.invoiceNo} — MoCreative Concept`;
  }

  /* ══════════════ editable engine + recalculation ══════════ */
  function rowData(rowEl) {
    const price = parseFloat((rowEl.querySelector(".price-input")?.value || "0").replace(/[^\d.]/g, "")) || 0;
    const qty = parseInt(rowEl.querySelector(".qty-val")?.textContent, 10) || 1;
    return { price, qty, total: price * qty };
  }

  function recalcAll() {
    const invDoc = document.getElementById("invDoc");
    if (!invDoc) return;
    let itemsTotal = 0,
      addonsTotal = 0;

    invDoc.querySelectorAll("#itemsBody .tbl-row").forEach((rowEl) => {
      const { total } = rowData(rowEl);
      const totalEl = rowEl.querySelector(".row-total");
      if (totalEl) totalEl.textContent = money(total);
      itemsTotal += total;
    });
    const itemsSubtotalEl = document.getElementById("itemsSubtotal");
    if (itemsSubtotalEl) itemsSubtotalEl.textContent = money(itemsTotal);

    invDoc.querySelectorAll("#addonsBody .tbl-row").forEach((rowEl) => {
      const { total } = rowData(rowEl);
      const totalEl = rowEl.querySelector(".row-total");
      if (totalEl) totalEl.textContent = money(total);
      addonsTotal += total;
    });
    const addonsRow = document.getElementById("totAddonsRow");
    const addonsVal = document.getElementById("addonsTotalVal");
    if (addonsVal) addonsVal.textContent = money(addonsTotal);
    if (addonsRow) addonsRow.style.display = addonsTotal ? "" : "none";

    const taxAmount = INVOICE.tax?.amount ?? 0;
    const discount = INVOICE.discount ?? 0;
    const grand = itemsTotal + addonsTotal + taxAmount - discount;

    const grandEl = document.getElementById("grandTotal");
    if (grandEl) grandEl.textContent = money(grand);

    document.querySelectorAll("#msTable .ms-row").forEach((msRow) => {
      const pct = parseFloat(msRow.dataset.pct) || 0;
      const amtEl = msRow.querySelector(".ms-amount");
      if (amtEl) amtEl.textContent = money(Math.round((grand * pct) / 100));
    });
  }

  function wireEvents() {
    const invDoc = document.getElementById("invDoc");
    if (!invDoc) return;

    invDoc.addEventListener("click", (e) => {
      const qtyBtn = e.target.closest(".qty-btn");
      if (qtyBtn) {
        const span = qtyBtn.parentElement.querySelector(".qty-val");
        let val = (parseInt(span.textContent, 10) || 1) + (qtyBtn.dataset.dir === "1" ? 1 : -1);
        if (val < 1) val = 1;
        span.textContent = val;
        recalcAll();
        return;
      }
      const delBtn = e.target.closest(".row-del");
      if (delBtn) {
        const rowEl = delBtn.closest(".tbl-row");
        const body = rowEl.parentElement;
        rowEl.remove();
        if (body.children.length === 0) {
          body.insertAdjacentHTML("beforeend", buildRow({ title: "", sub: "", price: 0, qty: 1 }));
        }
        recalcAll();
        return;
      }
      const addBtn = e.target.closest(".add-row-btn");
      if (addBtn) {
        const bodyId = addBtn.dataset.target === "items" ? "itemsBody" : "addonsBody";
        const body = document.getElementById(bodyId);
        if (body) body.insertAdjacentHTML("beforeend", buildRow({ title: "New item", sub: "", price: 0, qty: 1 }));
        recalcAll();
        return;
      }
      const copyBtn = e.target.closest(".copy-btn");
      if (copyBtn) {
        navigator.clipboard
          ?.writeText(copyBtn.dataset.copy)
          .then(() => {
            const was = copyBtn.textContent;
            copyBtn.textContent = "Copied";
            copyBtn.classList.add("is-done");
            setTimeout(() => {
              copyBtn.textContent = was;
              copyBtn.classList.remove("is-done");
            }, 1600);
          })
          .catch(() => {});
      }
    });

    invDoc.addEventListener("input", (e) => {
      if (e.target.matches(".price-input")) recalcAll();
    });

    invDoc.addEventListener(
      "blur",
      (e) => {
        if (e.target.matches(".price-input")) {
          const n = parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0;
          e.target.value = Math.round(n).toLocaleString("en-NG");
        }
      },
      true
    );
  }

  function init() {
    render();
    wireEvents();
    document.getElementById("printBtn")?.addEventListener("click", () => window.print());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
