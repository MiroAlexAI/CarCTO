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
    oldConsumption: document.getElementById('old-consumption-val'),
    mileage: document.getElementById('mileage-val'),
    years: document.getElementById('years-val'),
    newConsumption: document.getElementById('new-consumption-val'),
    breakdownProb: document.getElementById('breakdown-prob-val'),
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
        if (input) { // Check for nulls just in case
            input.addEventListener('input', () => {
                updateDisplays();
                calculate();
                hideOptimization();
            });
        }
    });

    // New inputs listeners
    const cmInput = document.getElementById('current-mileage');
    if (cmInput) cmInput.addEventListener('input', () => { calculate(); });

    const oiInput = document.getElementById('overhaul-interval');
    if (oiInput) oiInput.addEventListener('input', () => { calculate(); });

    // New inputs listeners
    ['current-mileage', 'overhaul-interval'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                calculate();
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
    displays.oldConsumption.textContent = inputs.oldConsumption.value + ' л';
    displays.newConsumption.textContent = inputs.newConsumption.value + ' л';
    displays.mileage.textContent = inputs.mileage.value + ' км';
    displays.years.textContent = inputs.years.value + ' лет';
    displays.breakdownProb.textContent = inputs.breakdownProb.value + '%';
    displays.resYears.textContent = inputs.years.value;
}

function formatMoney(num) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
}

function hideOptimization() {
    displays.optResult.style.display = 'none';
}

function calculate() {
    const years = parseInt(inputs.years.value);
    const mileage = parseInt(inputs.mileage.value);
    const fuelPrice = parseFloat(inputs.fuelPrice.value);

    // Risk Calculation
    const prob = parseInt(inputs.breakdownProb.value) / 100;
    const repairPrice = parseInt(inputs.repairCost.value);
    const annualRandomRisk = prob * repairPrice;

    // Overhaul Logic
    // If element doesn't exist, default to 0/HighInterval
    const cmEl = document.getElementById('current-mileage');
    const startOdometer = cmEl ? parseInt(cmEl.value) : 180000;

    const oiEl = document.getElementById('overhaul-interval');
    const overhaulInterval = oiEl ? parseInt(oiEl.value) : 250000;

    // Old Car Data
    const oldCons = parseFloat(inputs.oldConsumption.value);
    const oldMaint = parseInt(inputs.oldMaintenance.value);
    const oldTax = parseInt(inputs.oldTax.value);
    const oldStartVal = parseInt(inputs.oldPrice.value);
    const oldDeprRate = parseFloat(inputs.oldDepr.value) / 100;

    // New Car Data
    const newPriceVal = parseInt(inputs.newPrice.value);
    const newCons = parseFloat(inputs.newConsumption.value);
    const newMaint = parseInt(inputs.newMaintenance.value);
    const newTax = parseInt(inputs.newTax.value);
    const newDeprRate = parseFloat(inputs.newDepr.value) / 100;

    // Annual Fuel
    const oldFuelYear = (mileage / 100) * oldCons * fuelPrice;
    const newFuelYear = (mileage / 100) * newCons * fuelPrice;

    // Annual Ops Base
    const oldOpBase = oldFuelYear + oldMaint + oldTax + annualRandomRisk;
    const newOpBase = newFuelYear + newMaint + newTax;

    // Data for Chart
    const labels = [];
    const oldData = [];
    const newData = [];

    let cumOldSpend = 0;
    let cumNewSpend = 0;
    let currentOldVal = oldStartVal;
    let currentNewVal = newPriceVal;

    const switchCost = newPriceVal - oldStartVal;

    let oldOdometer = startOdometer;
    let overhaulCount = 0;



    // Initial State: 
    // If I keep old: Loss = 0 (Base). Future losses add up.
    // If I switch: Immediate Loss = (NewPrice - OldPrice) (Cash Spent).
    // Actually, simple TCO usually just sums expenses and price difference.
    // Let's stick to the previous "Cumulative Cost" model but add Depreciation Loss.

    // Initial cost to switch
    // const switchCost = newPriceVal - oldStartVal; (Removed duplicate)

    for (let i = 0; i <= years; i++) {
        labels.push(`Год ${i}`);

        if (i === 0) {
            oldData.push(0);
            newData.push(switchCost);
        } else {
            // Check for Overhaul this year
            const prevOdo = oldOdometer;
            oldOdometer += mileage;

            const repairsTriggered = Math.floor(oldOdometer / overhaulInterval) - Math.floor(prevOdo / overhaulInterval);

            let thisYearOverhaulCost = 0;
            if (repairsTriggered > 0) {
                thisYearOverhaulCost = repairsTriggered * repairPrice;
                overhaulCount += repairsTriggered;
            }

            // Expenses
            cumOldSpend += oldOpBase + thisYearOverhaulCost;
            cumNewSpend += newOpBase;

            // Depreciation Loss this year
            const oldDeprLoss = currentOldVal * oldDeprRate;
            currentOldVal -= oldDeprLoss;

            const newDeprLoss = currentNewVal * newDeprRate;
            currentNewVal -= newDeprLoss;

            // Total Accumulated Cost = Cash Spent + Value Lost so far
            // For Old: Ops + (StartValue - CurrentValue)
            const totalOldLoss = cumOldSpend + (oldStartVal - currentOldVal);

            // For New: SwitchCost + Ops + (StartNewValue - CurrentNewValue)
            // Wait, SwitchCost IS the cash injection.
            // If I pay 2M for new, 1M for old. I spent 1M cash.
            // My asset box has 2M value.
            // Loss = Cash Spent + (Value Drop).
            // Cash spent initially = SwitchCost.
            // Value Drop = NewPrice - CurrentNewVal.
            const totalNewLoss = switchCost + cumNewSpend + (newPriceVal - currentNewVal); // Wait, SwitchCost is basically implied in depreciation if we consider Asset Value?
            // No. Simple view:
            // Old Route: Wallet - (Ops) + CarValue.
            // New Route: Wallet - (Ops) - SwitchCost + CarValue.
            // We want to graph "Total Cost", i.e. how much poorer am I getting?
            // Cost = Ops + Depreciation.
            // Let's use that.

            // Redefine for chart:
            // AccOld = Ops + TotalDeprOld
            // AccNew = SwitchCost + Ops + TotalDeprNew - (Wait, SwitchCost isn't "Cost" if you get an asset back... it's only Cost if we count Opportunity Cost or just cashflow)

            // Sticking to the most understandable User metric:
            // "Money Gone from my life" = Expenses + Depreciation.
            // But the SwitchCost is tricky. If I buy a 10M car, I haven't "lost" 10M, I swapped cash for car. I lose depreciation.
            // BUT, usually people compare "keeping old" vs "buying new".
            // If I buy new, I am "out of pocket" the difference immediately? No, that's partial asset swap.
            // Let's rely on standard TCO: TCO = Purchase Price - Resale Value + Operating Costs.
            // At year N:
            // Old TCO = (StartValue - CurrentValue) + CumulativeOps.
            // New TCO = (NewPrice - CurrentNewValue) + CumulativeOps + (Wait, do we count the price difference?)
            // Yes. TCO of New Car vs Old Car.
            // Actually, usually it's "TCO of changing".
            // Cost of Changing = (NewPrice - OldStartValue) + (NewOps - OldOps) + (OldEndValue - NewEndValue)? Too complex.

            // Let's stick to the previous graph logic which was robust:
            // "Cumulative Cash Outflow + Asset Value Loss"
            // Old Line: CumOps + (OldStart - OldCurr)
            // New Line: CumOps + (NewStart - NewCurr) + (NewStart - OldStart) <-- The "Extra Capital" tied up?
            // Logic Check:
            // If New = 2M, Old = 1M.
            // I pay 1M cash.
            // Year 1:
            // Old: lost 10% (100k) + Ops (100k) = 200k cost.
            // New: lost 10% (200k) + Ops (50k).
            // Is New Cost 250k?
            // Plus I spent 1M cash? 
            // If we treat the 1M as "Sunk", then yes.
            // But usually we compare:
            // Option A: Keep Old. Net Worth = OldValue - Ops.
            // Option B: Buy New. Net Worth = NewValue - Ops - SwitchPrice.
            // This is the best comparison. "Net Worth Delta".
            // Graph: "Cumulative Cost" = (StartNetWorth - CurrentNetWorth).
            // StartNetWorth = OldStartValue + CashOnHand(SwitchPrice).
            // Option A (Keep): CashOnHand stays (0 loss). OldValue drops. Ops drain cash.
            // Cost = (OldStart - OldCurr) + Ops.
            // Option B (Switch): CashOnHand gone (become Car). NewValue drops. Ops drain.
            // Cost = (NewStart - NewCurr) + Ops + (Wait... CashOnHand is gone to buy car, so it's not "Lost", it converted).
            // The "Cost" of the switch is implicit in the Depreciation of a HIGHER value asset.
            // AND Opportunity cost of capital (ignored for simplicity).
            // So: Cost = Depreciation + Ops.
            // Does the price difference matter?
            // Only via Depreciation (10% of 3M is more than 10% of 1M).
            // AND the fact that you SPENT the difference?
            // IF you consider the money "spent" is gone... no, it's in the car.
            // SO: TCO = Cumulative Ops + Cumulative Depreciation.

            // BUT users usually want to know "When does the fuel saving cover the PURCHASE PRICE?".
            // In that case, they treat Purchase Price as a COST.
            // This is the "Break Even" view.

            // Let's implement the "Break Even" view (Purchase Delta is a COST).
            // Old Cost = Ops + Risk. (Ignore depreciation for break-even, or treat it as lost value).
            // New Cost = Ops + PriceDelta - (NewValue - OldValue @ End)? 
            // Let's stick to the script I used before:
            // Old = Ops.
            // New = Ops + UpgradePrice.
            // This assumes New Car Value == Old Car Value at end? No, that's unfair.
            // Correct Break Even: 
            // Cost A = Ops_Old + (OldStart - OldEnd)
            // Cost B = Ops_New + (NewStart - NewEnd) + (OpportunityCost?)

            // Let's use the simplest robust TCO:
            // TCO = Operating Costs + Depreciation.
            // The user inputs "Upgrade Price" implicitly via NewPrice.
            // If I follow the previous `script.js` which worked visually:
            // It had: `accNew = upgradeCost`.
            // This treats the entire upgrade cost as "Lost immediately". That's a "Cashflow Break Even" (assuming zero resale of new car).
            // That is too harsh for new cars.

            // BETTER MODEL:
            // Cost = Operating Costs + (ValueLost).
            // Old Data: Ops + (Start - Cur).
            // New Data: Ops + (NewStart - NewCur) + (PriceDiff * 0.0)??
            // No, if you pay 2M difference, and the car holds value, you haven't lost 2M.
            // But you have tied up 2M.
            // Let's stick to "Net Cost":
            // Old: OpsSum + (OldStart - OldCurr)
            // New: OpsSum + (NewStart - NewCurrent)
            // ... This completely ignores the 2M you had to pay!
            // Unless we assume Capital Cost?
            // Users usually think: "I pay 2M. I save 100k/year. It takes 20 years."
            // This implies they treat 2M as "Gone".
            // This is the "Payback Period" model.
            // I will use "Payback Period" model for the graph because it aligns with user intuition "Is it worth it?".

            // Model:
            // Old: Cumulative Ops.
            // New: Cumulative Ops + UpgradePrice.
            // (Previous model).
            // MODIFIED: Subtract the "Residual Value Gain" from the New Line?
            // New Line = UpgradePrice + NewOps - (NewCurr - OldCurr).
            // i.e. "Extra Cost" = PricePaid + Ops - (ExtraEquityIHave).

            // Let's try this "True Economic Cost" model.
            // Cost = (UpgradeCash) + (Ops) - (EquityGain).
            // EquityGain = (NewCarValue - OldCarValue).
            // This accurately reflects "Richness".

            const equityGain = currentNewVal - currentOldVal;
            const realCostNew = switchCost + cumNewSpend - equityGain;
            // Simplify: switchCost - equityGain = (NewStart - OldStart) - (NewCurr - OldCurr) 
            // = (NewStart - NewCurr) - (OldStart - OldCurr).
            // = NewDepr - OldDepr.
            // So RealCostNew = CumNewOps + NewDeprTotal - OldDeprTotal.
            // This compares "How much money I lost" in both scenarios relative to each other?
            // Let's just plot TCO A vs TCO B.
            // TCO = Ops + Depreciation.

            // RE-DECISION: I will plot "Total Money Lost" (Expenses + Depreciation).
            // This is scientifically accurate.
            // Old Line: CumOps + (OldStart - OldCurr).
            // New Line: CumOps + (NewStart - NewCurr).
            // The "Upgrade Cost" doesn't appear explicitly, but matches the "High Depreciation" of the new car.
            // Be careful: If depreciation is low, New might look cheaper immediately!
            // BUT you still had to find 2M.
            // This graph might confuse users who want "Payback".
            // "Payback" graph: 
            // Old: CumOps.
            // New: CumOps + UpgradePrice - (ResaleDiff).
            // ResaleDiff = (NewCur - OldCur).
            // This converges to TCO.

            const oldTotalLoss = cumOldSpend + (oldStartVal - currentOldVal);
            const newTotalLoss = cumNewSpend + (newPriceVal - currentNewVal);

            // We need to shift one line to represent the "Investment"? 
            // No, "Total Loss" is the fair comparison.
            // IF NewTotalLoss < OldTotalLoss, you are winning.

            oldData.push(oldTotalLoss);
            newData.push(newTotalLoss);
        }
    }

    // Results in UI (Final Year)
    const finalOld = oldData[years];
    const finalNew = newData[years];

    displays.oldTotalCost.textContent = formatMoney(finalOld);
    displays.newTotalCost.textContent = formatMoney(finalNew);

    // Upgrade Cost (Cash required)
    const cashRequired = newPriceVal - oldStartVal;

    // Net Gain/Loss
    displays.upgradeCost.textContent = formatMoney(cashRequired); // Static cash needed

    const diff = finalNew - finalOld;
    displays.totalDiff.textContent = formatMoney(Math.abs(diff));

    if (diff < 0) {
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

    updateChart(labels, oldData, newData);

    // Update Risk UI Text
    const riskLabel = document.querySelector('.sub-title');
    if (riskLabel) riskLabel.textContent = `Риски (Капремонтов: ${overhaulCount})`;
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

function updateChart(labels, oldData, newData) {
    const ctx = document.getElementById('costChart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is not loaded');
        return;
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Старый (Потери)',
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
                    label: 'Новый (Потери)',
                    data: newData,
                    borderColor: '#0ea5e9', // Sky Blue
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    align: 'end',
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
