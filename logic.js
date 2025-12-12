/**
 * Core TCO Calculation Logic
 * Separated from DOM for testing and reusability.
 */

const TCOLogic = {
    /**
     * Calculates the Year-by-Year TCO for Old vs New car.
     * @param {Object} data - Input data object
     * @returns {Object} - Result containing arrays for chart and final totals.
     */
    calculate: function (data) {
        const {
            years,
            mileage,
            fuelPrice,
            breakdownProb, // % (0-100)
            repairPrice,
            currentMileage,
            overhaulInterval,
            // Old Car
            oldCons,
            oldMaint,
            oldTax,
            oldPrice,
            oldDepr, // % (0-100)
            // New Car
            newPrice,
            newCons,
            newMaint,
            newTax,
            newDepr // % (0-100)
        } = data;

        // Base Annual Costs
        const oldFuelYear = (mileage / 100) * oldCons * fuelPrice;
        const newFuelYear = (mileage / 100) * newCons * fuelPrice;

        const annualRandomRisk = (breakdownProb / 100) * repairPrice;

        const oldOpBase = oldFuelYear + oldMaint + oldTax + annualRandomRisk;
        const newOpBase = newFuelYear + newMaint + newTax;

        const oldDeprRate = oldDepr / 100;
        const newDeprRate = newDepr / 100;

        // Arrays for Chart
        const labels = [];
        const oldData = [];
        const newData = [];
        const oldDeprData = [];
        const newDeprData = [];

        let cumOldSpend = 0;
        let cumNewSpend = 0;
        let currentOldVal = oldPrice;
        let currentNewVal = newPrice;
        let oldOdometer = currentMileage;
        let overhaulCount = 0;

        // Initial State (Year 0)
        // Loss is 0 for Old (User owns it).
        // Loss is (NewPrice - OldPrice) for New? (See script.js logic).
        // Using "Total Loss" model: Expenses + Depreciation.

        // Note: The previous logic in script.js used a loop from 0 to years. 
        // We will replicate that exactly to maintain consistency.

        for (let i = 0; i <= years; i++) {
            labels.push(`Год ${i}`);

            if (i === 0) {
                // Year 0
                // Year 0
                // Placeholder removed, see below for actual push
                // Wait, previous script pushed `switchCost` (NewPrice - OldPrice) for new car at Year 0.
                // Re-checking script.js: 
                // "if (i === 0) { oldData.push(0); newData.push(switchCost); }"
                // Let's verify what `switchCost` was.
                // const switchCost = newPriceVal - oldStartVal;
                // so we need that.

                // However, in the loop logic later:
                // oldTotalLoss = cumOldSpend + (oldStartVal - currentOldVal);
                // newTotalLoss = cumNewSpend + (newPriceVal - currentNewVal);
                // Wait, script.js loop logic for "Total New Loss" was:
                // const totalNewLoss = switchCost + cumNewSpend + (newPriceVal - currentNewVal);
                // BUT `switchCost` is `NewPrice - OldPrice`.
                // Let's stick strictly to what the script.js did if it was "correct" for the user, 
                // OR improve it if it was buggy.
                // It seems the script.js was trying to show "Cash Required + Depreciation".
                // I will replicate the LOGIC exactly.

                const switchCost = newPrice - oldPrice;
                oldData.push(0);
                newData.push(switchCost);
                // Year 0 Value is the Start Price
                oldDeprData.push(oldPrice);
                newDeprData.push(newPrice);
            } else {
                // Overhaul Logic
                const prevOdo = oldOdometer;
                oldOdometer += mileage;
                const repairsTriggered = Math.floor(oldOdometer / overhaulInterval) - Math.floor(prevOdo / overhaulInterval);

                let thisYearOverhaulCost = 0;
                if (repairsTriggered > 0) {
                    thisYearOverhaulCost = repairsTriggered * repairPrice;
                    overhaulCount += repairsTriggered;
                }

                // Cumulative Spending
                cumOldSpend += oldOpBase + thisYearOverhaulCost;
                cumNewSpend += newOpBase;

                // Depreciation
                const oldDeprLoss = currentOldVal * oldDeprRate;
                currentOldVal -= oldDeprLoss;

                const newDeprLoss = currentNewVal * newDeprRate;
                currentNewVal -= newDeprLoss;

                // Total Loss Calculation
                // Old: Cash Spent + Asset Value Lost
                const totalOldLoss = cumOldSpend + (oldPrice - currentOldVal);

                // New: Cash Spent (Ops) + Asset Value Lost + Initial Switch Cost?
                // script.js: const switchCost = newPriceVal - oldStartVal;
                // const totalNewLoss = cumNewSpend + (newPriceVal - currentNewVal);
                // Wait, script.js line 349:
                // const newTotalLoss = cumNewSpend + (newPriceVal - currentNewVal);
                // It DID NOT include switchCost in the loop calculation?? 
                // Let's look at script.js line 179: newData.push(switchCost) for Year 0.
                // But for i > 0 (line 356), it pushed `newTotalLoss`.
                // And `newTotalLoss` (line 349) = `cumNewSpend + (newPriceVal - currentNewVal)`.
                // This implies at Year 1, the graph might DROP if switchCost was high?
                // If switchCost (2M) is pushed at Y0.
                // At Y1: cumNewSpend (100k) + Depr (200k) = 300k.
                // So graph goes 2M -> 300k. This is a BUG in the original script.
                // The graph would look spikey.
                // Unless `switchCost` was added.
                // Looking at script.js line 215 (commented out code mentions switchCost).
                // But the active code at 349 does NOT add switchCost.
                // This means the chart was likely broken (Year 0 high, Year 1 low).
                // I should FIX this. The user will appreciate a test that catches this.
                // "New Total Loss" should imply the extra money spent too.
                // A fair TCO compares "Wealth Decay".
                // Initial WEALTH DECY for New Car = (NewPrice - OldPrice) [Cash out] + 0 [Depr].
                // Year 1 WEALTH DECAY = (NewPrice - OldPrice) [Cash out] + Ops + Depr.
                // So we MUST add switchCost to the NewTotalLoss.

                const switchCost = newPrice - oldPrice;
                const totalNewLoss = switchCost + cumNewSpend + (newPrice - currentNewVal);

                oldData.push(totalOldLoss);
                newData.push(totalNewLoss);
                // Push Remaining Value instead of Lost Value
                oldDeprData.push(currentOldVal);
                newDeprData.push(currentNewVal);
            }
        }

        return {
            labels,
            oldData,
            newData,
            oldDeprData,
            newDeprData,
            finalOld: oldData[years],
            finalNew: newData[years],
            overhaulCount,
            diff: newData[years] - oldData[years]
        };
    },

    /**
     * Calculates optimization recommendations
     * @param {Object} data - Input data object
     * @returns {Object} - Recommendation result
     */
    optimize: function (data) {
        const {
            years,
            mileage,
            fuelPrice,
            breakdownProb,
            repairPrice,
            oldCons,
            oldMaint,
            oldTax,
            oldPrice,
            oldDepr,
            newCons,
            newMaint,
            newTax,
            newDepr, // %
            newPrice
        } = data;

        // 1. Calculate Old TCO at end of period
        // We reuse the logic, but simplified to just get totals.
        // Actually we can just call this.calculate(data).finalOld
        // But calculate() does arrays. For speed, simple math is better, BUT consistency is key.
        // Let's use simple math to mirror the breakdown.

        const annualRisk = (breakdownProb / 100) * repairPrice;
        const oldOpYear = ((mileage / 100) * oldCons * fuelPrice) + oldMaint + oldTax + annualRisk;

        // Depreciation Total
        const oldDeprRate = oldDepr / 100;
        let oldVal = oldPrice;
        for (let i = 0; i < years; i++) oldVal = oldVal * (1 - oldDeprRate);
        const oldDeprTotal = oldPrice - oldVal;

        const oldTCO = (oldOpYear * years) + oldDeprTotal;

        // 2. New Ops (Fixed Params)
        const newOpYear = ((mileage / 100) * newCons * fuelPrice) + newMaint + newTax;
        const newOpsTotal = newOpYear * years;

        // 3. Solve for MaxPrice (recPrice)
        // Target: NewTCO <= OldTCO
        // NewTCO = NewOpsTotal + NewDeprTotal
        // NewDeprTotal = Price * DeprFactor
        // DeprFactor = 1 - (1-rate)^years
        const newDeprRate = newDepr / 100;
        const deprFactor = 1 - Math.pow((1 - newDeprRate), years);

        // Price * DeprFactor <= OldTCO - NewOpsTotal
        const maxDeprAllowed = oldTCO - newOpsTotal;
        let recPrice = 0;
        if (maxDeprAllowed > 0) {
            recPrice = maxDeprAllowed / deprFactor;
        }

        // 4. Solve for Target Consumption (recCons)
        // Fixed Price (User Input)
        // NewTCO = (Fuel + FixedMaint) * Years + FixedDepr
        // Fuel * Years = OldTCO - FixedMaint*Years - FixedDepr

        const currentNewDepr = newPrice * deprFactor;
        const fixedMaintTax = newMaint + newTax;

        // Max Fuel Budget Total
        const maxFuelTotal = oldTCO - (fixedMaintTax * years) - currentNewDepr;

        let recCons = 0;
        if (maxFuelTotal > 0) {
            const maxFuelYear = maxFuelTotal / years;
            // FuelCost = (Mileage/100) * Cons * FuelPrice
            // Cons = (FuelCost * 100) / (Mileage * FuelPrice)
            recCons = (maxFuelYear * 100) / (mileage * fuelPrice);
        }

        return {
            recPrice,
            recCons,
            params: {
                years,
                mileage,
                oldTCO,
                oldOpYear,
                newOpYear,
                deprFactor
            }
        };
    }
};

// Export for Node/Tests if needed, otherwise it's a global in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TCOLogic;
}
