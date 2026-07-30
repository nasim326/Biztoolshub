document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const darkToggle = document.getElementById("darkModeToggle");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const backToTop = document.getElementById("backToTop");
  const loader = document.getElementById("page-loader");
  const yearSpan = document.getElementById("year");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Loader
  if (loader) {
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }

  // Dark mode
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      body.classList.toggle("dark");
    });
  }

  // Mobile nav
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Back to top
  if (backToTop) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTop.style.display = "block";
      } else {
        backToTop.style.display = "none";
      }
    });

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Smooth scrolling for internal links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Toast notification
  function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.style.position = "fixed";
      toast.style.bottom = "1rem";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.background = "#2563eb";
      toast.style.color = "#fff";
      toast.style.padding = "0.6rem 1rem";
      toast.style.borderRadius = "999px";
      toast.style.boxShadow = "0 10px 30px rgba(15,23,42,0.3)";
      toast.style.zIndex = "100";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 2500);
  }

  // Global search filter
  function setupSearch(inputId, scopeAttr) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", () => {
      const query = input.value.toLowerCase();
      document.querySelectorAll(`[data-search-scope="${scopeAttr}"] article`).forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  setupSearch("globalSearch", "tools");
  setupSearch("heroSearch", "tools");
  setupSearch("blogSearch", "blog");

  // FAQ accordion
  document.querySelectorAll("[data-faq]").forEach((faqContainer) => {
    faqContainer.querySelectorAll(".faq-item").forEach((item) => {
      item.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        faqContainer.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("active"));
        faqContainer.querySelectorAll(".faq-content").forEach((c) => (c.style.display = "none"));
        if (!isActive) {
          item.classList.add("active");
          const content = item.nextElementSibling;
          if (content) content.style.display = "block";
        }
      });
    });
  });

  // FAQ category filter
  document.querySelectorAll("[data-faq-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-faq-category");
      document.querySelectorAll("[data-faq-category]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".faq-item").forEach((item) => {
        const itemCategory = item.getAttribute("data-category");
        if (category === "all" || itemCategory === category) {
          item.style.display = "";
          const content = item.nextElementSibling;
          if (content) content.style.display = "none";
          item.classList.remove("active");
        } else {
          item.style.display = "none";
          const content = item.nextElementSibling;
          if (content) content.style.display = "none";
        }
      });
    });
  });

  // FAQ search
  const faqSearch = document.getElementById("faqSearch");
  if (faqSearch) {
    faqSearch.addEventListener("input", () => {
      const query = faqSearch.value.toLowerCase();
      document.querySelectorAll(".faq-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? "" : "none";
        const content = item.nextElementSibling;
        if (content) content.style.display = "none";
        item.classList.remove("active");
      });
    });
  }

  // Tabs
  document.querySelectorAll("[data-tabs]").forEach((tabsContainer) => {
    const tabs = tabsContainer.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === target);
        });
      });
    });
  });

  // Newsletter forms
  function setupNewsletterForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (!email || !email.value.includes("@")) {
        showToast("Please enter a valid email address.");
        return;
      }
      showToast("Subscribed successfully!");
      form.reset();
    });
  }

  setupNewsletterForm("newsletterForm");
  setupNewsletterForm("footerNewsletterForm");
  setupNewsletterForm("blogNewsletterForm");

  // Contact form validation
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = contactForm.querySelector("#contactName");
      const email = contactForm.querySelector("#contactEmail");
      const subject = contactForm.querySelector("#contactSubject");
      const message = contactForm.querySelector("#contactMessage");
      if (!name.value || !email.value.includes("@") || !subject.value || !message.value) {
        showToast("Please fill in all fields with valid information.");
        return;
      }
      showToast("Message sent (demo).");
      contactForm.reset();
    });
  }

  // Calculator engine
  function handleCalculator(form, type) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let resultText = "";
      try {
        switch (type) {
          case "eos": {
            const salary = parseFloat(form.salary.value);
            const years = parseFloat(form.years.value);
            if (isNaN(salary) || isNaN(years) || salary <= 0 || years <= 0) {
              throw new Error("Enter valid salary and years.");
            }
            const eos = salary * 0.5 * years;
            resultText = `Estimated EOS benefit: ${eos.toFixed(2)}`;
            break;
          }
          case "salary": {
            const monthly = parseFloat(form.monthly.value);
            if (isNaN(monthly) || monthly <= 0) throw new Error("Enter valid monthly salary.");
            const annual = monthly * 12;
            resultText = `Annual salary: ${annual.toFixed(2)}`;
            break;
          }
          case "leave": {
            const daily = parseFloat(form.daily.value);
            const days = parseFloat(form.days.value);
            if (isNaN(daily) || isNaN(days) || daily <= 0 || days <= 0) {
              throw new Error("Enter valid daily salary and days.");
            }
            const total = daily * days;
            resultText = `Leave salary: ${total.toFixed(2)}`;
            break;
          }
          case "loan": {
            const amount = parseFloat(form.amount.value);
            const rate = parseFloat(form.rate.value) / 100;
            const years = parseFloat(form.years.value);
            if (isNaN(amount) || isNaN(rate) || isNaN(years) || amount <= 0 || rate < 0 || years <= 0) {
              throw new Error("Enter valid loan details.");
            }
            const n = years * 12;
            const monthlyRate = rate / 12;
            const payment =
              monthlyRate === 0
                ? amount / n
                : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
            const total = payment * n;
            const interest = total - amount;
            resultText = `Monthly payment: ${payment.toFixed(2)}, Total interest: ${interest.toFixed(2)}`;
            break;
          }
          case "gold": {
            const weight = parseFloat(form.weight.value);
            const price = parseFloat(form.price.value);
            if (isNaN(weight) || isNaN(price) || weight <= 0 || price <= 0) {
              throw new Error("Enter valid weight and price.");
            }
            const total = weight * price;
            resultText = `Estimated gold value: ${total.toFixed(2)}`;
            break;
          }
          case "vat": {
            const amount = parseFloat(form.amount.value);
            const rate = parseFloat(form.rate.value) / 100;
            if (isNaN(amount) || isNaN(rate) || amount <= 0 || rate < 0) {
              throw new Error("Enter valid amount and rate.");
            }
            const vat = amount * rate;
            const total = amount + vat;
            resultText = `VAT: ${vat.toFixed(2)}, Total: ${total.toFixed(2)}`;
            break;
          }
          case "concrete": {
            const length = parseFloat(form.length.value);
            const width = parseFloat(form.width.value);
            const depth = parseFloat(form.depth.value);
            if ([length, width, depth].some((v) => isNaN(v) || v <= 0)) {
              throw new Error("Enter valid dimensions.");
            }
            const volume = length * width * depth;
            resultText = `Concrete volume: ${volume.toFixed(2)} m³`;
            break;
          }
          case "steel": {
            const diameter = parseFloat(form.diameter.value);
            const length = parseFloat(form.length.value);
            if ([diameter, length].some((v) => isNaN(v) || v <= 0)) {
              throw new Error("Enter valid diameter and length.");
            }
            const area = Math.PI * Math.pow(diameter / 2, 2);
            const density = 7850; // kg/m³
            const weight = area * length * density / 1e6;
            resultText = `Steel weight: ${weight.toFixed(2)} kg`;
            break;
          }
          case "paint": {
            const area = parseFloat(form.area.value);
            const coverage = parseFloat(form.coverage.value);
            if ([area, coverage].some((v) => isNaN(v) || v <= 0)) {
              throw new Error("Enter valid area and coverage.");
            }
            const liters = area / coverage;
            resultText = `Estimated paint required: ${liters.toFixed(2)} liters`;
            break;
          }
          case "profit": {
            const cost = parseFloat(form.cost.value);
            const price = parseFloat(form.price.value);
            if ([cost, price].some((v) => isNaN(v) || v <= 0) || price <= cost) {
              throw new Error("Enter valid cost and price (price > cost).");
            }
            const profit = price - cost;
            const margin = (profit / price) * 100;
            resultText = `Profit: ${profit.toFixed(2)}, Margin: ${margin.toFixed(2)}%`;
            break;
          }
          case "json": {
            const input = form.json.value;
            try {
              const obj = JSON.parse(input);
              resultText = `Formatted JSON:\n${JSON.stringify(obj, null, 2)}`;
            } catch {
              throw new Error("Invalid JSON.");
            }
            break;
          }
          case "base64": {
            const text = form.text.value;
            if (!text) throw new Error("Enter text.");
            if (form.mode.value === "encode") {
              resultText = `Encoded: ${btoa(text)}`;
            } else {
              try {
                resultText = `Decoded: ${atob(text)}`;
              } catch {
                throw new Error("Invalid Base64.");
              }
            }
            break;
          }
          case "password": {
            const length = parseInt(form.length.value, 10);
            if (isNaN(length) || length < 6) throw new Error("Length must be at least 6.");
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            let pwd = "";
            for (let i = 0; i < length; i++) {
              pwd += chars[Math.floor(Math.random() * chars.length)];
            }
            resultText = `Generated password: ${pwd}`;
            break;
          }
          default:
            resultText = "Calculator not implemented.";
        }
        const resultDiv = form.parentElement.querySelector(".calculator-result");
        if (resultDiv) {
          resultDiv.textContent = resultText;
        }
      } catch (err) {
        showToast(err.message);
      }
    });

    const resetBtn = form.querySelector("[data-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        form.reset();
        const resultDiv = form.parentElement.querySelector(".calculator-result");
        if (resultDiv) resultDiv.textContent = "";
      });
    }

    const shareBtn = form.parentElement.querySelector("[data-share]");
    if (shareBtn && navigator.share) {
      shareBtn.addEventListener("click", () => {
        navigator
          .share({
            title: document.title,
            text: "Check out this calculator on BizTools Hub.",
            url: window.location.href,
          })
          .catch(() => {});
      });
    }
  }

  document.querySelectorAll(".calculator-form").forEach((form) => {
    const type = form.getAttribute("data-calculator");
    handleCalculator(form, type);
  });
});


