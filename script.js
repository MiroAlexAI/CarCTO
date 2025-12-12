// Elements
const inputs = {
    // Old Car
    oldPrice: document.getElementById('old-price'),
    oldConsumption: document.getElementById('old-consumption'),
    oldMaintenance: document.getElementById('old-maintenance'),
    oldTax: document.getElementById('old-tax'),

    // Risk & Depr
    breakdownProb: document.getElementById('breakdown-prob'),
    repairCost: document.getElementById('repair-cost'),
    oldDepr: document.getElementById('old-depreciation'),
    newDepr: document.getElementById('new-depreciation'),
    overhaulInterval: document.getElementById('overhaul-interval'),

    // Common
    mileage: document.getElementById('mileage'),
    fuelPrice: document.getElementById('fuel-price'),
    years: document.getElementById('years'),

    // New Car
    newPrice: document.getElementById('new-price'),
    newConsumption: document.getElementById('new-consumption'),
    newMaintenance: document.getElementById('new-maintenance'),
    newTax: document.getElementById('new-tax'),
};

const displays = {
    // Value Displays
    oldPrice: document.getElementById('old-price-val'),
    oldCons: document.getElementById('old-consumption-val'),
    oldMaint: document.getElementById('old-maintenance-val'),
    oldTax: document.getElementById('old-tax-val'),

    overhaulInt: document.getElementById('overhaul-interval-val'),
    breakdownProb: document.getElementById('breakdown-prob-val'),
    repairCost: document.getElementById('repair-cost-val'),

    newPrice: document.getElementById('new-price-val'),
    newCons: document.getElementById('new-consumption-val'),
    newMaint: document.getElementById('new-maintenance-val'),
    newTax: document.getElementById('new-tax-val'),

    mileage: document.getElementById('mileage-val'),
    years: document.getElementById('years-val'),
    fuelPrice: document.getElementById('fuel-price-val'),

    oldDepr: document.getElementById('old-depr-val'),
    newDepr: document.getElementById('new-depr-val'),

    // Results in UI
    resYears: document.getElementById('res-years'),
    totalDiff: document.getElementById('total-diff'),
    recommendation: document.getElementById('recommendation'),
    oldTotalCost: document.getElementById('old-total-cost'),
    newTotalCost: document.getElementById('new-total-cost'),
    upgradeCost: document.getElementById('upgrade-cost'),

    // Optimization
    optResult: document.getElementById('optimization-result'),
    optText: document.getElementById('opt-text'),
    optPrice: document.getElementById('opt-price'),
    optCons: document.getElementById('opt-cons'),
};

const optimizeBtn = document.getElementById('optimize-btn');

let chart = null;

// Initialize
function init() {
    // Add event listeners
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateDisplays();
                calculate();
                hideOptimization();
            });
        }
    });

    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', optimize);
    }

    // Initial calcs
    updateDisplays();
    calculate();
}

function updateDisplays() {
    // Format helper
    const fmt = (num) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num);
    const fmtCurrency = (num) => fmt(num) + ' ₽';
    const fmtMillions = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + ' млн ₽';
        if (num >= 1000) return (num / 1000).toFixed(0) + ' тыс ₽';
        return num + ' ₽';
    };

    if (displays.oldPrice) displays.oldPrice.textContent = fmtMillions(inputs.oldPrice.value);
    if (displays.oldCons) displays.oldCons.textContent = inputs.oldConsumption.value;
    if (displays.oldMaint) displays.oldMaint.textContent = fmtCurrency(inputs.oldMaintenance.value);
    if (displays.oldTax) displays.oldTax.textContent = fmtCurrency(inputs.oldTax.value);

    if (displays.overhaulInt) displays.overhaulInt.textContent = (inputs.overhaulInterval.value / 1000) + ' тыс.';
    if (displays.breakdownProb) displays.breakdownProb.textContent = inputs.breakdownProb.value + '%';
    if (displays.repairCost) displays.repairCost.textContent = fmtCurrency(inputs.repairCost.value);

    if (displays.newPrice) displays.newPrice.textContent = fmtMillions(inputs.newPrice.value);
    if (displays.newCons) displays.newCons.textContent = inputs.newConsumption.value;
    if (displays.newMaint) displays.newMaint.textContent = fmtCurrency(inputs.newMaintenance.value);
    if (displays.newTax) displays.newTax.textContent = fmtCurrency(inputs.newTax.value);

    if (displays.mileage) displays.mileage.textContent = fmt(inputs.mileage.value);
    if (displays.years) displays.years.textContent = inputs.years.value;
    if (displays.fuelPrice) displays.fuelPrice.textContent = fmtCurrency(inputs.fuelPrice.value);

    if (displays.oldDepr) displays.oldDepr.textContent = inputs.oldDepr.value + '%';
    if (displays.newDepr) displays.newDepr.textContent = inputs.newDepr.value + '%';

    if (displays.resYears) displays.resYears.textContent = inputs.years.value;
}

function formatMoney(num) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
}

function hideOptimization() {
    displays.optResult.style.display = 'none';
}

function getInputs() {
    const years = parseInt(inputs.years.value);
    const mileage = parseInt(inputs.mileage.value);
    const fuelPrice = parseFloat(inputs.fuelPrice.value);

    // Safety checks for elements that might be missing
    // Current Mileage removed, default to 0 (Calculation is relative to NOW)
    const startOdometer = 0;

    // Logic: overhaul interval is distance from *now*, or absolute?
    // If user inputs "250k" for interval. And starts at 0 (relative).
    // Break happens in 250k km.
    // If they meant "250k on odometer", and car has 180k. Break is in 70k.
    // By removing "current mileage", we force the semantic "Distance until overhaul".
    // Which is actually simpler for the average user ("Repair coming in 50k").
    const overhaulInterval = parseInt(inputs.overhaulInterval.value);

    return {
        years,
        mileage,
        fuelPrice,
        breakdownProb: parseInt(inputs.breakdownProb.value),
        repairPrice: parseInt(inputs.repairCost.value),
        currentMileage: startOdometer,
        overhaulInterval,
        // Old
        oldCons: parseFloat(inputs.oldConsumption.value),
        oldMaint: parseInt(inputs.oldMaintenance.value),
        oldTax: parseInt(inputs.oldTax.value),
        oldPrice: parseInt(inputs.oldPrice.value),
        oldDepr: parseFloat(inputs.oldDepr.value),
        // New
        newPrice: parseInt(inputs.newPrice.value),
        newCons: parseFloat(inputs.newConsumption.value),
        newMaint: parseInt(inputs.newMaintenance.value),
        newTax: parseInt(inputs.newTax.value),
        newDepr: parseFloat(inputs.newDepr.value),
    };
}

function calculate() {
    if (typeof TCOLogic === 'undefined') {
        console.error('TCOLogic not loaded');
        return;
    }

    const data = getInputs();
    const result = TCOLogic.calculate(data);

    // Update UI Elements
    displays.oldTotalCost.textContent = formatMoney(result.finalOld);
    displays.newTotalCost.textContent = formatMoney(result.finalNew);

    // Upgrade Cost (Cash required)
    const cashRequired = data.newPrice - data.oldPrice;
    displays.upgradeCost.textContent = formatMoney(cashRequired);

    displays.totalDiff.textContent = formatMoney(Math.abs(result.diff));

    if (result.diff < 0) {
        displays.totalDiff.style.color = '#4ade80';
        displays.recommendation.textContent = "✅ Выгодно (Меньше потери стоимости)";
        displays.recommendation.style.color = "#4ade80";
        displays.recommendation.style.backgroundColor = "rgba(74, 222, 128, 0.2)";
    } else {
        displays.totalDiff.style.color = '#f87171';
        displays.recommendation.textContent = "❌ Невыгодно (Большая амортизация)";
        displays.recommendation.style.color = "#f87171";
        displays.recommendation.style.backgroundColor = "rgba(248, 113, 113, 0.2)";
    }

    updateChart(result);

    // Update Risk UI Text
    const riskLabel = document.querySelector('.sub-title');
    if (riskLabel) riskLabel.textContent = `Риски (Капремонтов: ${result.overhaulCount})`;
}

function optimize() {
    // Goal: Find New Car Price where (NewTCO <= OldTCO) at Year 5 (or current 'years').
    // NewTCO = NewOps + NewDepr.
    // NewOps = (Fuel + Maint + Tax) * Years.
    // NewDepr = Price * (1 - (1-rate)^Years).
    // Target: NewOps + NewDepr <= OldTCO.
    // Assuming NewOps is constant (based on current New Car Cons/Maint).
    // Solve for Price.
    // Price * DeprFactor <= OldTCO - NewOps.
    // Price <= (OldTCO - NewOps) / DeprFactor.

    const years = parseInt(inputs.years.value);
    const mileage = parseInt(inputs.mileage.value);
    const fuelPrice = parseFloat(inputs.fuelPrice.value);
    const newDeprRate = parseFloat(inputs.newDepr.value) / 100;

    // 1. Calculate Old TCO at end of period
    const prob = parseInt(inputs.breakdownProb.value) / 100;
    const repair = parseInt(inputs.repairCost.value);
    const annualRisk = prob * repair;
    const oldOpYear = ((mileage / 100) * inputs.oldConsumption.value * fuelPrice) + parseInt(inputs.oldMaintenance.value) + parseInt(inputs.oldTax.value) + annualRisk;

    const oldStartVal = parseInt(inputs.oldPrice.value);
    const oldDeprRate = parseFloat(inputs.oldDepr.value) / 100;
    let oldVal = oldStartVal;
    for (let i = 0; i < years; i++) oldVal = oldVal * (1 - oldDeprRate);
    const oldDeprTotal = oldStartVal - oldVal;

    const oldTCO = (oldOpYear * years) + oldDeprTotal;

    // 2. Calculate New Ops (Fixed Params)
    const newOpYear = ((mileage / 100) * inputs.newConsumption.value * fuelPrice) + parseInt(inputs.newMaintenance.value) + parseInt(inputs.newTax.value);
    const newOpsTotal = newOpYear * years;

    // 3. Solve for MaxPrice
    // NewTCO = NewOpsTotal + (Price * DeprFactor)
    // Price * DeprFactor = NewTCO - NewOpsTotal
    // MaxPrice * DeprFactor = OldTCO - NewOpsTotal

    // DeprFactor = Total % lost over years
    // P_end = P_start * (1-r)^y
    // Loss = P_start - P_end = P_start * (1 - (1-r)^y)
    const deprFactor = 1 - Math.pow((1 - newDeprRate), years);

    const maxDeprAllowed = oldTCO - newOpsTotal;

    let recPrice = 0;
    if (maxDeprAllowed > 0) {
        recPrice = maxDeprAllowed / deprFactor;
    }

    // 4. Solve for Target Consumption (Fixed Price)
    // If Price is fixed to User Input, what consumption makes NewTCO == OldTCO?
    // NewTCO = (Fuel + FixedMaint) * Years + FixedDepr.
    // Fuel * Years = OldTCO - FixedMaint*Years - FixedDepr.
    // FuelYear = (OldTCO - FixedMaint*Years - FixedDepr) / Years.
    // FuelCons = (FuelYear / FuelPrice) * 100 / Mileage.

    const currentNewPrice = parseInt(inputs.newPrice.value);
    const currentNewDepr = currentNewPrice * deprFactor;
    const fixedMaintTax = parseInt(inputs.newMaintenance.value) + parseInt(inputs.newTax.value);
    const maxFuelTotal = oldTCO - (fixedMaintTax * years) - currentNewDepr;
    const maxFuelYear = maxFuelTotal / years;
    let recCons = (maxFuelYear / fuelPrice) * 100 / mileage;

    // Display
    displays.optResult.style.display = 'block';

    if (recPrice > 0) {
        displays.optPrice.textContent = formatMoney(recPrice);
    } else {
        displays.optPrice.textContent = "Невозможно (Слишком дорого содержать)";
    }

    if (recCons > 0) {
        displays.optCons.textContent = recCons.toFixed(1) + " л/100км";
    } else {
        displays.optCons.textContent = "0 л (Нужно доплачивать чтобы ездить)";
    }

    displays.optText.textContent = `Чтобы выйти в ноль за ${years} лет по сравнению с текущим авто:`;

    // Scroll to it
    displays.optResult.scrollIntoView({ behavior: 'smooth' });
}

function updateChart(result) {
    const ctx = document.getElementById('costChart').getContext('2d');
    const { labels, oldData, newData, oldDeprData, newDeprData, finalOld, finalNew } = result;

    if (chart) {
        chart.destroy();
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is not loaded');
        return;
    }

    // Prepare legend strings with Totals
    const oldLabel = `Старый (Всего: ${formatMoney(finalOld)})`;
    const newLabel = `Новый (Всего: ${formatMoney(finalNew)})`;
    const diffVal = finalNew - finalOld;
    const diffLabel = `Разница: ${formatMoney(diffVal)} ${diffVal > 0 ? '(Дороже)' : '(Дешевле)'}`;

    // We add difference to the chart title or subtitle if possible, or append to legend
    // Chart.js 3+ supports subtitles. Let's try adding it to title first line.

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: oldLabel,
                    data: oldData,
                    borderColor: '#ef4444', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: newLabel,
                    data: newData,
                    borderColor: '#0ea5e9', // Sky Blue
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Старый (Остаточная стоимость)',
                    data: oldDeprData,
                    borderColor: '#fca5a5', // Lighter red
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Новый (Остаточная стоимость)',
                    data: newDeprData,
                    borderColor: '#7dd3fc', // Lighter blue
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: [
                        'Сравнение совокупной стоимости владения (TCO)',
                        diffLabel
                    ],
                    font: {
                        size: 14,
                        family: 'Inter'
                    },
                    color: '#64748b',
                    padding: { bottom: 20 }
                },
                legend: {
                    align: 'center',
                    labels: {
                        color: '#64748b',
                        font: { family: 'Inter', size: 11 },
                        usePointStyle: true,
                        boxWidth: 6
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            // Remove totals from legend label for cleaner tooltip if needed, but keeping it is fine.
                            // Simplified label for tooltip to avoid clutter?
                            if (label.includes('(')) {
                                label = label.split('(')[0].trim();
                            }

                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Затраты накопительно (Руб)',
                        font: { size: 10 }
                    },
                    grid: { color: '#e2e8f0', drawBorder: false },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            }
        }
    });
}

// Start
init();
