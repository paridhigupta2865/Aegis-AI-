const form          = document.getElementById('churnForm');
const resultSection = document.getElementById('resultSection');
const resultCard    = document.getElementById('resultCard');
const resultIcon    = document.getElementById('resultIcon');
const resultModel   = document.getElementById('resultModel');
const resultStatus  = document.getElementById('resultStatus');
const probBar       = document.getElementById('probBar');
const probValue     = document.getElementById('probValue');
const resultMessage = document.getElementById('resultMessage');
const chip1         = document.getElementById('chip1');
const chip2         = document.getElementById('chip2');
const chip3         = document.getElementById('chip3');
const submitBtn     = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {};
  new FormData(form).forEach((val, key) => { formData[key] = val; });

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Analysing…`;

  try {
    const res  = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();

    if (data.error) { alert('Server error: ' + data.error); return; }

    displayResult(data, formData);

  } catch (err) {
    alert('Cannot reach Flask server.\nMake sure app.py is running.\n\n' + err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Run Churn Analysis <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
});

function displayResult(data, formData) {
  const isChurn  = data.churn === 1;
  const prob     = data.probability;
  const tenure   = parseFloat(formData.tenure);
  const monthly  = parseFloat(formData.MonthlyCharges);
  const contract = formData.Contract;

  // Card state
  resultCard.classList.remove('is-churn', 'is-safe');
  resultCard.classList.add(isChurn ? 'is-churn' : 'is-safe');

  resultIcon.textContent   = isChurn ? '⚠️' : '✅';
  resultModel.textContent  = 'Prediction made by XGBoost model';
  resultStatus.textContent = isChurn ? 'Likely to Churn' : 'Likely to Stay';

  // Probability bar (delayed to allow CSS transition)
  probBar.style.width = '0%';
  probValue.textContent = prob.toFixed(1) + '%';
  setTimeout(() => { probBar.style.width = prob + '%'; }, 60);

  // Message
  if (isChurn) {
    resultMessage.innerHTML = `This customer has a <strong>${prob}%</strong> probability of churning.
      ${tenure < 12 ? 'Short tenure (<12 months) is a strong early churn signal. ' : ''}
      ${monthly > 70 ? 'High monthly charges often correlate with dissatisfaction. ' : ''}
      ${contract === 'Month-to-month' ? 'Month-to-month contracts provide no switching friction. ' : ''}
      <br><br><strong>Recommendation:</strong> Trigger a retention workflow — consider a loyalty offer, personalised outreach, or a contract upgrade incentive.`;
  } else {
    resultMessage.innerHTML = `This customer has only a <strong>${prob}%</strong> probability of churning — they appear stable.
      ${tenure > 24 ? 'Long tenure (>24 months) is a strong loyalty indicator. ' : ''}
      ${contract !== 'Month-to-month' ? 'An active long-term contract reduces churn risk. ' : ''}
      <br><br><strong>Recommendation:</strong> Maintain engagement through regular value check-ins. Monitor if contract nears renewal.`;
  }

  // Chips
  const chips = [chip1, chip2, chip3];
  const tags = isChurn
    ? [`Tenure: ${tenure} mo`, `Monthly: $${monthly}`, contract]
    : [`Stable Account`, `Tenure: ${tenure} mo`, contract];
  chips.forEach((c, i) => {
    c.textContent = tags[i];
    c.classList.add('visible');
  });

  resultSection.classList.remove('hidden');
  setTimeout(() => {
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}
