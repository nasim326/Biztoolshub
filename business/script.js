// script.js
(function () {
  const currencyEl = document.getElementById("currency");
  const invoiceNumberEl = document.getElementById("invoiceNumber");
  const invoiceDateEl = document.getElementById("invoiceDate");
  const dueDateEl = document.getElementById("dueDate");
  const invoiceStatusEl = document.getElementById("invoiceStatus");
  const invoiceThemeEl = document.getElementById("invoiceTheme");

  const companyNameEl = document.getElementById("companyName");
  const companyEmailEl = document.getElementById("companyEmail");
  const companyPhoneEl = document.getElementById("companyPhone");
  const companyAddressEl = document.getElementById("companyAddress");
  const companyCityEl = document.getElementById("companyCity");
  const companyCountryEl = document.getElementById("companyCountry");
  const companyTaxNumberEl = document.getElementById("companyTaxNumber");
  const companyLogoEl = document.getElementById("companyLogo");
  const logoDropArea = document.getElementById("logoDropArea");

  const customerNameEl = document.getElementById("customerName");
  const customerCompanyEl = document.getElementById("customerCompany");
  const customerEmailEl = document.getElementById("customerEmail");
  const customerPhoneEl = document.getElementById("customerPhone");
  const customerAddressEl = document.getElementById("customerAddress");
  const customerCityEl = document.getElementById("customerCity");
  const customerCountryEl = document.getElementById("customerCountry");
  const customerTaxNumberEl = document.getElementById("customerTaxNumber");

  const shippingAmountEl = document.getElementById("shippingAmount");
  const invoiceDiscountEl = document.getElementById("invoiceDiscount");
  const amountPaidEl = document.getElementById("amountPaid");
  const vatRateEl = document.getElementById("vatRate");
  const vatCustomWrapperEl = document.getElementById("vatCustomWrapper");
  const vatCustomEl = document.getElementById("vatCustom");
  const paymentMethodEl = document.getElementById("paymentMethod");

  const invoiceNotesEl = document.getElementById("invoiceNotes");
  const invoiceTermsEl = document.getElementById("invoiceTerms");
  const paymentInstructionsEl = document.getElementById("paymentInstructions");
  const bankDetailsEl = document.getElementById("bankDetails");
  const clientSignatureEl = document.getElementById("clientSignature");
  const sellerSignatureEl = document.getElementById("sellerSignature");

  const addItemBtn = document.getElementById("addItemBtn");
  const itemsBodyEl = document.getElementById("itemsBody");

  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const loadDraftBtn = document.getElementById("loadDraftBtn");
  const deleteDraftBtn = document.getElementById("deleteDraftBtn");
  const duplicateInvoiceBtn = document.getElementById("duplicateInvoiceBtn");
  const printInvoiceBtn = document.getElementById("printInvoiceBtn");

  const previewLogoEl = document.getElementById("previewLogo");
  const previewCompanyNameEl = document.getElementById("previewCompanyName");
  const previewCompanyAddressEl = document.getElementById("previewCompanyAddress");
  const previewCompanyCityCountryEl = document.getElementById("previewCompanyCityCountry");
  const previewCompanyPhoneEl = document.getElementById("previewCompanyPhone");
  const previewCompanyEmailEl = document.getElementById("previewCompanyEmail");
  const previewCompanyTaxEl = document.getElementById("previewCompanyTax");

  const previewInvoiceNumberEl = document.getElementById("previewInvoiceNumber");
  const previewInvoiceDateEl = document.getElementById("previewInvoiceDate");
  const previewDueDateEl = document.getElementById("previewDueDate");
  const previewStatusEl = document.getElementById("previewStatus");

  const previewCustomerNameEl = document.getElementById("previewCustomerName");
  const previewCustomerCompanyEl = document.getElementById("previewCustomerCompany");
  const previewCustomerAddressEl = document.getElementById("previewCustomerAddress");
  const previewCustomerCityCountryEl = document.getElementById("previewCustomerCityCountry");
  const previewCustomerPhoneEl = document.getElementById("previewCustomerPhone");
  const previewCustomerEmailEl = document.getElementById("previewCustomerEmail");
  const previewCustomerTaxEl = document.getElementById("previewCustomerTax");

  const previewItemsBodyEl = document.getElementById("previewItemsBody");
  const previewSubtotalEl = document.getElementById("previewSubtotal");
  const previewTaxEl = document.getElementById("previewTax");
  const previewDiscountEl = document.getElementById("previewDiscount");
  const previewShippingEl = document.getElementById("previewShipping");
  const previewGrandTotalEl = document.getElementById("previewGrandTotal");
  const previewAmountPaidEl = document.getElementById("previewAmountPaid");
  const previewBalanceDueEl = document.getElementById("previewBalanceDue");

  const previewNotesEl = document.getElementById("previewNotes");
  const previewTermsEl = document.getElementById("previewTerms");
  const previewPaymentInstructionsEl = document.getElementById("previewPaymentInstructions");
  const previewBankDetailsEl = document.getElementById("previewBankDetails");
  const previewClientSignatureEl = document.getElementById("previewClientSignature");
  const previewSellerSignatureEl = document.getElementById("previewSellerSignature");

  const previewCardEl = document.querySelector(".invoice-preview-card");

  const LS_KEY = "invoice-generator-draft";
  const LS_INVOICE_COUNTER = "invoice-generator-counter";

  function formatCurrency(value) {
    const currency = currencyEl.value || "SAR";
    const num = isNaN(value) ? 0 : Number(value);
    return `${currency} ${num.toFixed(2)}`;
  }

  function generateInvoiceNumber() {
    let counter = parseInt(localStorage.getItem(LS_INVOICE_COUNTER) || "0", 10);
    counter += 1;
    localStorage.setItem(LS_INVOICE_COUNTER, String(counter));
    const year = new Date().getFullYear();
    const padded = String(counter).padStart(4, "0");
    return `INV-${year}-${padded}`;
  }

  function initInvoiceNumber() {
    if (!invoiceNumberEl.value) {
      invoiceNumberEl.value = generateInvoiceNumber();
    }
  }

  function addItemRow(item = {}) {
    const tr = document.createElement("tr");

    const descTd = document.createElement("td");
    const descInput = document.createElement("input");
    descInput.type = "text";
    descInput.value = item.description || "";
    descTd.appendChild(descInput);

    const qtyTd = document.createElement("td");
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.step = "0.01";
    qtyInput.value = item.qty || "";
    qtyTd.appendChild(qtyInput);

    const priceTd = document.createElement("td");
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.step = "0.01";
    priceInput.value = item.unitPrice || "";
    priceTd.appendChild(priceInput);

    const taxTd = document.createElement("td");
    const taxInput = document.createElement("input");
    taxInput.type = "number";
    taxInput.step = "0.01";
    taxInput.value = item.tax || "";
    taxTd.appendChild(taxInput);

    const discountTd = document.createElement("td");
    const discountInput = document.createElement("input");
    discountInput.type = "number";
    discountInput.step = "0.01";
    discountInput.value = item.discount || "";
    discountTd.appendChild(discountInput);

    const totalTd = document.createElement("td");
    const totalSpan = document.createElement("span");
    totalSpan.textContent = formatCurrency(0);
    totalTd.appendChild(totalSpan);

    const actionsTd = document.createElement("td");
    const duplicateBtn = document.createElement("button");
    duplicateBtn.type = "button";
    duplicateBtn.className = "btn btn-secondary";
    duplicateBtn.innerHTML = '<i class="fa fa-copy"></i>';
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-secondary";
    deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
    actionsTd.appendChild(duplicateBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(descTd);
    tr.appendChild(qtyTd);
    tr.appendChild(priceTd);
    tr.appendChild(taxTd);
    tr.appendChild(discountTd);
    tr.appendChild(totalTd);
    tr.appendChild(actionsTd);

    itemsBodyEl.appendChild(tr);

    function recalcRow() {
      const qty = parseFloat(qtyInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const tax = parseFloat(taxInput.value) || 0;
      const discount = parseFloat(discountInput.value) || 0;

      let rowTotal = qty * price;
      const taxAmount = rowTotal * (tax / 100);
      const discountAmount = rowTotal * (discount / 100);
      rowTotal = rowTotal + taxAmount - discountAmount;

      totalSpan.textContent = formatCurrency(rowTotal);
      updatePreview();
    }

    [qtyInput, priceInput, taxInput, discountInput, descInput].forEach((input) => {
      input.addEventListener("input", recalcRow);
    });

    duplicateBtn.addEventListener("click", () => {
      const newItem = {
        description: descInput.value,
        qty: qtyInput.value,
        unitPrice: priceInput.value,
        tax: taxInput.value,
        discount: discountInput.value,
      };
      addItemRow(newItem);
      updatePreview();
    });

    deleteBtn.addEventListener("click", () => {
      tr.remove();
      updatePreview();
    });

    recalcRow();
  }

  function getItemsData() {
    const rows = Array.from(itemsBodyEl.querySelectorAll("tr"));
    return rows.map((tr) => {
      const inputs = tr.querySelectorAll("input");
      const [descInput, qtyInput, priceInput, taxInput, discountInput] = inputs;
      const qty = parseFloat(qtyInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const tax = parseFloat(taxInput.value) || 0;
      const discount = parseFloat(discountInput.value) || 0;

      let rowTotal = qty * price;
      const taxAmount = rowTotal * (tax / 100);
      const discountAmount = rowTotal * (discount / 100);
      rowTotal = rowTotal + taxAmount - discountAmount;

      return {
        description: descInput.value,
        qty,
        unitPrice: price,
        tax,
        discount,
        total: rowTotal,
      };
    });
  }

  function calculateTotals() {
    const items = getItemsData();
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const rowTaxTotal = items.reduce((sum, item) => {
      const base = item.qty * item.unitPrice;
      return sum + base * (item.tax / 100);
    }, 0);
    const rowDiscountTotal = items.reduce((sum, item) => {
      const base = item.qty * item.unitPrice;
      return sum + base * (item.discount / 100);
    }, 0);

    let vatPercent = 0;
    if (vatRateEl.value === "custom") {
      vatPercent = parseFloat(vatCustomEl.value) || 0;
    } else {
      vatPercent = parseFloat(vatRateEl.value) || 0;
    }

    const vatAmount = subtotal * (vatPercent / 100);
    const invoiceDiscount = parseFloat(invoiceDiscountEl.value) || 0;
    const shipping = parseFloat(shippingAmountEl.value) || 0;
    const amountPaid = parseFloat(amountPaidEl.value) || 0;

    const grandTotal = subtotal + rowTaxTotal + vatAmount - rowDiscountTotal - invoiceDiscount + shipping;
    const balanceDue = grandTotal - amountPaid;

    return {
      items,
      subtotal,
      rowTaxTotal,
      rowDiscountTotal,
      vatAmount,
      invoiceDiscount,
      shipping,
      grandTotal,
      amountPaid,
      balanceDue,
    };
  }

  function updatePreview() {
    previewCompanyNameEl.textContent = companyNameEl.value || "Company Name";
    previewCompanyAddressEl.textContent = companyAddressEl.value || "";
    previewCompanyCityCountryEl.textContent = [companyCityEl.value, companyCountryEl.value].filter(Boolean).join(", ");
    previewCompanyPhoneEl.textContent = companyPhoneEl.value ? `Phone: ${companyPhoneEl.value}` : "";
    previewCompanyEmailEl.textContent = companyEmailEl.value ? `Email: ${companyEmailEl.value}` : "";
    previewCompanyTaxEl.textContent = companyTaxNumberEl.value ? `Tax: ${companyTaxNumberEl.value}` : "";

    previewInvoiceNumberEl.textContent = invoiceNumberEl.value || "";
    previewInvoiceDateEl.textContent = invoiceDateEl.value || "";
    previewDueDateEl.textContent = dueDateEl.value || "";
    previewStatusEl.textContent = invoiceStatusEl.value || "Draft";

    previewCustomerNameEl.textContent = customerNameEl.value || "";
    previewCustomerCompanyEl.textContent = customerCompanyEl.value || "";
    previewCustomerAddressEl.textContent = customerAddressEl.value || "";
    previewCustomerCityCountryEl.textContent = [customerCityEl.value, customerCountryEl.value].filter(Boolean).join(", ");
    previewCustomerPhoneEl.textContent = customerPhoneEl.value ? `Phone: ${customerPhoneEl.value}` : "";
    previewCustomerEmailEl.textContent = customerEmailEl.value ? `Email: ${customerEmailEl.value}` : "";
    previewCustomerTaxEl.textContent = customerTaxNumberEl.value ? `Tax: ${customerTaxNumberEl.value}` : "";

    const totals = calculateTotals();

    previewItemsBodyEl.innerHTML = "";
    totals.items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.description || ""}</td>
        <td>${item.qty.toFixed(2)}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td>${item.tax.toFixed(2)}%</td>
        <td>${item.discount.toFixed(2)}%</td>
        <td>${formatCurrency(item.total)}</td>
      `;
      previewItemsBodyEl.appendChild(tr);
    });

    previewSubtotalEl.textContent = formatCurrency(totals.subtotal);
    previewTaxEl.textContent = formatCurrency(totals.rowTaxTotal + totals.vatAmount);
    previewDiscountEl.textContent = formatCurrency(totals.rowDiscountTotal + totals.invoiceDiscount);
    previewShippingEl.textContent = formatCurrency(totals.shipping);
    previewGrandTotalEl.textContent = formatCurrency(totals.grandTotal);
    previewAmountPaidEl.textContent = formatCurrency(totals.amountPaid);
    previewBalanceDueEl.textContent = formatCurrency(totals.balanceDue);

    previewNotesEl.textContent = invoiceNotesEl.value || "";
    previewTermsEl.textContent = invoiceTermsEl.value || "";
    previewPaymentInstructionsEl.textContent = paymentInstructionsEl.value || "";
    previewBankDetailsEl.textContent = bankDetailsEl.value || "";
    previewClientSignatureEl.textContent = clientSignatureEl.value || "";
    previewSellerSignatureEl.textContent = sellerSignatureEl.value || "";

    previewCardEl.classList.remove("theme-blue", "theme-green", "theme-gold", "theme-purple", "theme-red");
    const theme = invoiceThemeEl.value || "blue";
    previewCardEl.classList.add(`theme-${theme}`);
  }

  function validateField(id, validator) {
    const el = document.getElementById(id);
    const errorEl = document.querySelector(`[data-error-for="${id}"]`);
    if (!el || !errorEl) return true;
    const value = el.value.trim();
    const error = validator(value);
    if (error) {
      errorEl.textContent = error;
      el.classList.add("invalid");
      return false;
    } else {
      errorEl.textContent = "";
      el.classList.remove("invalid");
      return true;
    }
  }

  function setupValidation() {
    companyEmailEl.addEventListener("input", () => {
      validateField("companyEmail", (v) => {
        if (!v) return "";
        return /\S+@\S+\.\S+/.test(v) ? "" : "Invalid email";
      });
    });

    customerEmailEl.addEventListener("input", () => {
      validateField("customerEmail", (v) => {
        if (!v) return "";
        return /\S+@\S+\.\S+/.test(v) ? "" : "Invalid email";
      });
    });

    companyPhoneEl.addEventListener("input", () => {
      validateField("companyPhone", (v) => {
        if (!v) return "";
        return v.length >= 6 ? "" : "Phone too short";
      });
    });

    customerPhoneEl.addEventListener("input", () => {
      validateField("customerPhone", (v) => {
        if (!v) return "";
        return v.length >= 6 ? "" : "Phone too short";
      });
    });

    invoiceNumberEl.addEventListener("input", () => {
      validateField("invoiceNumber", (v) => (!v ? "Required" : ""));
    });

    invoiceDateEl.addEventListener("input", () => {
      validateField("invoiceDate", (v) => (!v ? "Required" : ""));
    });

    dueDateEl.addEventListener("input", () => {
      validateField("dueDate", (v) => (!v ? "Required" : ""));
    });

    companyNameEl.addEventListener("input", () => {
      validateField("companyName", (v) => (!v ? "Required" : ""));
    });

    customerNameEl.addEventListener("input", () => {
      validateField("customerName", (v) => (!v ? "Required" : ""));
    });
  }

  function saveDraft() {
    const data = {
      currency: currencyEl.value,
      invoiceNumber: invoiceNumberEl.value,
      invoiceDate: invoiceDateEl.value,
      dueDate: dueDateEl.value,
      invoiceStatus: invoiceStatusEl.value,
      invoiceTheme: invoiceThemeEl.value,
      company: {
        name: companyNameEl.value,
        email: companyEmailEl.value,
        phone: companyPhoneEl.value,
        address: companyAddressEl.value,
        city: companyCityEl.value,
        country: companyCountryEl.value,
        taxNumber: companyTaxNumberEl.value,
        logo: previewLogoEl.dataset.logo || null,
      },
      customer: {
        name: customerNameEl.value,
        company: customerCompanyEl.value,
        email: customerEmailEl.value,
        phone: customerPhoneEl.value,
        address: customerAddressEl.value,
        city: customerCityEl.value,
        country: customerCountryEl.value,
        taxNumber: customerTaxNumberEl.value,
      },
      totals: {
        shipping: shippingAmountEl.value,
        invoiceDiscount: invoiceDiscountEl.value,
        amountPaid: amountPaidEl.value,
        vatRate: vatRateEl.value,
        vatCustom: vatCustomEl.value,
        paymentMethod: paymentMethodEl.value,
      },
      notes: {
        invoiceNotes: invoiceNotesEl.value,
        invoiceTerms: invoiceTermsEl.value,
        paymentInstructions: paymentInstructionsEl.value,
        bankDetails: bankDetailsEl.value,
        clientSignature: clientSignatureEl.value,
        sellerSignature: sellerSignatureEl.value,
      },
      items: getItemsData(),
    };

    localStorage.setItem(LS_KEY, JSON.stringify(data));
    alert("Draft saved.");
  }

  function loadDraft() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      alert("No draft found.");
      return;
    }
    const data = JSON.parse(raw);

    currencyEl.value = data.currency || "SAR";
    invoiceNumberEl.value = data.invoiceNumber || "";
    invoiceDateEl.value = data.invoiceDate || "";
    dueDateEl.value = data.dueDate || "";
    invoiceStatusEl.value = data.invoiceStatus || "Draft";
    invoiceThemeEl.value = data.invoiceTheme || "blue";

    companyNameEl.value = data.company?.name || "";
    companyEmailEl.value = data.company?.email || "";
    companyPhoneEl.value = data.company?.phone || "";
    companyAddressEl.value = data.company?.address || "";
    companyCityEl.value = data.company?.city || "";
    companyCountryEl.value = data.company?.country || "";
    companyTaxNumberEl.value = data.company?.taxNumber || "";

    if (data.company?.logo) {
      previewLogoEl.innerHTML = `<img src="${data.company.logo}" alt="Company Logo" />`;
      previewLogoEl.dataset.logo = data.company.logo;
    }

    customerNameEl.value = data.customer?.name || "";
    customerCompanyEl.value = data.customer?.company || "";
    customerEmailEl.value = data.customer?.email || "";
    customerPhoneEl.value = data.customer?.phone || "";
    customerAddressEl.value = data.customer?.address || "";
    customerCityEl.value = data.customer?.city || "";
    customerCountryEl.value = data.customer?.country || "";
    customerTaxNumberEl.value = data.customer?.taxNumber || "";

    shippingAmountEl.value = data.totals?.shipping || "";
    invoiceDiscountEl.value = data.totals?.invoiceDiscount || "";
    amountPaidEl.value = data.totals?.amountPaid || "";
    vatRateEl.value = data.totals?.vatRate || "0";
    vatCustomEl.value = data.totals?.vatCustom || "";
    paymentMethodEl.value = data.totals?.paymentMethod || "Cash";

    invoiceNotesEl.value = data.notes?.invoiceNotes || "";
    invoiceTermsEl.value = data.notes?.invoiceTerms || "";
    paymentInstructionsEl.value = data.notes?.paymentInstructions || "";
    bankDetailsEl.value = data.notes?.bankDetails || "";
    clientSignatureEl.value = data.notes?.clientSignature || "";
    sellerSignatureEl.value = data.notes?.sellerSignature || "";

    itemsBodyEl.innerHTML = "";
    (data.items || []).forEach((item) => addItemRow(item));

    if (vatRateEl.value === "custom") {
      vatCustomWrapperEl.style.display = "block";
    } else {
      vatCustomWrapperEl.style.display = "none";
    }

    updatePreview();
    alert("Draft loaded.");
  }

  function deleteDraft() {
    localStorage.removeItem(LS_KEY);
    alert("Draft deleted.");
  }

  function duplicateInvoice() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      alert("No draft to duplicate. Save a draft first.");
      return;
    }
    const data = JSON.parse(raw);
    data.invoiceNumber = generateInvoiceNumber();
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    alert("Invoice duplicated with new number. Load draft to view.");
  }

  function setupLogoUpload() {
    logoDropArea.addEventListener("click", () => companyLogoEl.click());

    logoDropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      logoDropArea.classList.add("dragover");
    });

    logoDropArea.addEventListener("dragleave", () => {
      logoDropArea.classList.remove("dragover");
    });

    logoDropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      logoDropArea.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) handleLogoFile(file);
    });

    companyLogoEl.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleLogoFile(file);
    });

    function handleLogoFile(file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const src = e.target.result;
        previewLogoEl.innerHTML = `<img src="${src}" alt="Company Logo" />`;
        previewLogoEl.dataset.logo = src;
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  }

  function setupCollapsibles() {
    const collapsibles = document.querySelectorAll(".collapsible");
    collapsibles.forEach((col) => {
      const btn = col.querySelector(".collapse-toggle");
      const content = col.querySelector(".collapse-content");
      col.classList.add("open");
      content.style.maxHeight = "1000px";

      btn.addEventListener("click", () => {
        if (col.classList.contains("open")) {
          col.classList.remove("open");
          content.style.maxHeight = "0";
        } else {
          col.classList.add("open");
          content.style.maxHeight = "1000px";
        }
      });
    });
  }

  function setupEvents() {
    [
      currencyEl,
      invoiceNumberEl,
      invoiceDateEl,
      dueDateEl,
      invoiceStatusEl,
      invoiceThemeEl,
      companyNameEl,
      companyEmailEl,
      companyPhoneEl,
      companyAddressEl,
      companyCityEl,
      companyCountryEl,
      companyTaxNumberEl,
      customerNameEl,
      customerCompanyEl,
      customerEmailEl,
      customerPhoneEl,
      customerAddressEl,
      customerCityEl,
      customerCountryEl,
      customerTaxNumberEl,
      shippingAmountEl,
      invoiceDiscountEl,
      amountPaidEl,
      vatRateEl,
      vatCustomEl,
      paymentMethodEl,
      invoiceNotesEl,
      invoiceTermsEl,
      paymentInstructionsEl,
      bankDetailsEl,
      clientSignatureEl,
      sellerSignatureEl,
    ].forEach((el) => {
      el.addEventListener("input", updatePreview);
      el.addEventListener("change", updatePreview);
    });

    vatRateEl.addEventListener("change", () => {
      if (vatRateEl.value === "custom") {
        vatCustomWrapperEl.style.display = "block";
      } else {
        vatCustomWrapperEl.style.display = "none";
      }
      updatePreview();
    });

    addItemBtn.addEventListener("click", () => {
      addItemRow();
      updatePreview();
    });

    saveDraftBtn.addEventListener("click", saveDraft);
    loadDraftBtn.addEventListener("click", loadDraft);
    deleteDraftBtn.addEventListener("click", deleteDraft);
    duplicateInvoiceBtn.addEventListener("click", duplicateInvoice);

    printInvoiceBtn.addEventListener("click", () => {
      window.print();
    });
  }

  function initDefaults() {
    const today = new Date().toISOString().slice(0, 10);
    if (!invoiceDateEl.value) invoiceDateEl.value = today;
    if (!dueDateEl.value) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueDateEl.value = d.toISOString().slice(0, 10);
    }
    initInvoiceNumber();
    addItemRow();
  }

  function init() {
    setupCollapsibles();
    setupLogoUpload();
    setupValidation();
    setupEvents();
    initDefaults();
    updatePreview();
  }

  document.addEventListener("DOMContentLoaded", init);
})();