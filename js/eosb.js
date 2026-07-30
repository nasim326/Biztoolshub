// script
// Utility: format currency as SAR XX,XXX.XX
function formatSAR(amount) {
  if (isNaN(amount) || amount === null) return 'SAR 0.00';
  return 'SAR ' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Utility: count-up animation for numbers
function animateCountUp(element, target, duration = 800) {
  const start = 0;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = start + (target - start) * progress;
    element.textContent = formatSAR(value);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// EOSB calculation logic
function calculateEOSB(salary, years, reason) {
  const firstYears = Math.min(years, 5);
  const additionalYears = Math.max(years - 5, 0);

  const firstBenefit = 0.5 * salary * firstYears;
  const additionalBenefit = 1 * salary * additionalYears;
  const grossEOSB = firstBenefit + additionalBenefit;

  let percentage = 100;

  if (reason === 'termination') {
    percentage = 100;
  } else if (reason === 'resignation') {
    if (years < 2) {
      percentage = 0;
    } else if (years >= 2 && years <= 5) {
      percentage = 33.33;
    } else if (years > 5 && years < 10) {
      percentage = 66.67;
    } else if (years >= 10) {
      percentage = 100;
    }
  }

  const finalEOSB = grossEOSB * (percentage / 100);

  return {
    firstBenefit,
    additionalBenefit,
    grossEOSB,
    percentage,
    finalEOSB,
    firstYears,
    additionalYears
  };
}

// DOM elements
const salaryInput = document.getElementById('salary');
const yearsInput = document.getElementById('years');
const reasonSelect = document.getElementById('reason');

const salaryError = document.getElementById('salaryError');
const yearsError = document.getElementById('yearsError');
const reasonError = document.getElementById('reasonError');

const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');
const printBtn = document.getElementById('printBtn');
const pdfBtn = document.getElementById('pdfBtn');

const resultSalary = document.getElementById('resultSalary');
const resultYears = document.getElementById('resultYears');
const resultReason = document.getElementById('resultReason');
const resultFirstFive = document.getElementById('resultFirstFive');
const resultAdditional = document.getElementById('resultAdditional');
const resultGross = document.getElementById('resultGross');
const resultPercentage = document.getElementById('resultPercentage');
const resultFinal = document.getElementById('resultFinal');

const statusMessage = document.getElementById('statusMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const themeToggle = document.getElementById('themeToggle');
const yearSpan = document.getElementById('year');
const resultsCard = document.getElementById('resultsCard');
const inputCard = document.getElementById('inputCard');
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
// Set current year
yearSpan.textContent = new Date().getFullYear();

// Validation
function validateInputs() {
  let valid = true;
  const salary = parseFloat(salaryInput.value);
  const years = parseFloat(yearsInput.value);
  const reason = reasonSelect.value;

  salaryError.textContent = '';
  yearsError.textContent = '';
  reasonError.textContent = '';
  statusMessage.textContent = '';

  if (isNaN(salary) || salary <= 0) {
    salaryError.textContent = 'Please enter a valid monthly salary greater than 0.';
    valid = false;
  }

  if (isNaN(years) || years <= 0) {
    yearsError.textContent = 'Please enter valid years of service greater than 0.';
    valid = false;
  }

  if (!reason) {
    reasonError.textContent = 'Please select a reason for leaving.';
    valid = false;
  }

  return valid;
}

// Update results UI
function updateResults() {
  const salary = parseFloat(salaryInput.value);
  const years = parseFloat(yearsInput.value);
  const reason = reasonSelect.value;

  if (!validateInputs()) return;

  const result = calculateEOSB(salary, years, reason);

  resultSalary.textContent = formatSAR(salary);
  resultYears.textContent = `${years.toFixed(1)} Years`;
  resultReason.textContent = reason === 'termination' ? 'Termination' : 'Resignation';
  resultFirstFive.textContent = formatSAR(result.firstBenefit);
  resultAdditional.textContent = formatSAR(result.additionalBenefit);
  resultGross.textContent = formatSAR(result.grossEOSB);
  resultPercentage.textContent = `${result.percentage.toFixed(2)}%`;

  animateCountUp(resultFinal, result.finalEOSB, 900);

  statusMessage.textContent = 'Calculation completed successfully.';
}

// Live calculation while typing
['input', 'change'].forEach(evt => {
  salaryInput.addEventListener(evt, () => {
    if (salaryInput.value && yearsInput.value && reasonSelect.value) {
      updateResults();
    }
  });
  yearsInput.addEventListener(evt, () => {
    if (salaryInput.value && yearsInput.value && reasonSelect.value) {
      updateResults();
    }
  });
  reasonSelect.addEventListener(evt, () => {
    if (salaryInput.value && yearsInput.value && reasonSelect.value) {
      updateResults();
    }
  });
});

// Calculate button
calculateBtn.addEventListener('click', () => {
  if (!validateInputs()) return;

  calculateBtn.classList.add('loading');
  loadingOverlay.classList.add('active');

  setTimeout(() => {
    loadingOverlay.classList.remove('active');
    calculateBtn.classList.remove('loading');
    updateResults();
    resultsCard.classList.add('highlighted');
    setTimeout(() => resultsCard.classList.remove('highlighted'), 800);
  }, 800);
});

// Reset button
resetBtn.addEventListener('click', () => {
  salaryInput.value = '';
  yearsInput.value = '';
  reasonSelect.value = '';
  salaryError.textContent = '';
  yearsError.textContent = '';
  reasonError.textContent = '';
  statusMessage.textContent = '';

  resultSalary.textContent = 'SAR 0.00';
  resultYears.textContent = '0.0 Years';
  resultReason.textContent = '-';
  resultFirstFive.textContent = 'SAR 0.00';
  resultAdditional.textContent = 'SAR 0.00';
  resultGross.textContent = 'SAR 0.00';
  resultPercentage.textContent = '0%';
  resultFinal.textContent = 'SAR 0.00';
});

// Copy result
copyBtn.addEventListener('click', async () => {
  const text = `
Saudi EOSB Calculation
----------------------
Monthly Salary: ${resultSalary.textContent}
Years of Service: ${resultYears.textContent}
Leaving Reason: ${resultReason.textContent}
First 5 Years Benefit: ${resultFirstFive.textContent}
Additional Years Benefit: ${resultAdditional.textContent}
Gross EOSB: ${resultGross.textContent}
Applicable Percentage: ${resultPercentage.textContent}
Final EOSB Payable: ${resultFinal.textContent}
  `.trim();

  try {
    await navigator.clipboard.writeText(text);
    statusMessage.textContent = 'Result copied to clipboard.';
  } catch {
    statusMessage.textContent = 'Unable to copy result.';
  }
});

// Print result
printBtn.addEventListener('click', () => {
  window.print();
});

// Download PDF
pdfBtn.addEventListener('click', () => {
  const element = document.getElementById('resultsCard');
  const opt = {
    margin:       0.5,
    filename:     'Saudi_EOSB_Calculation.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().from(element).set(opt).save();
});

// Dark / Light mode toggle
themeToggle.addEventListener('click', () => {
  const body = document.body;
  const icon = themeToggle.querySelector('i');

  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  }
});

// FAQ Accordion
document.querySelectorAll('.accordion-item').forEach(item => {
  const header = item.querySelector('.accordion-header');
  header.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
  });
});


