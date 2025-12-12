const assert = require('assert');
const TCOLogic = require('../logic.js');

console.log("Running TCO Logic Tests...");

const baseData = {
    years: 5,
    mileage: 10000,
    fuelPrice: 50,
    breakdownProb: 0,
    repairPrice: 100000,
    currentMileage: 0,
    overhaulInterval: 1000000,
    oldCons: 10,
    oldMaint: 0,
    oldTax: 0,
    oldPrice: 1000000,
    oldDepr: 0,
    newPrice: 1000000,
    newCons: 10,
    newMaint: 0,
    newTax: 0,
    newDepr: 0
};

// Test 1: Basics
const res1 = TCOLogic.calculate(baseData);
const expectedFuel = (10000 / 100) * 10 * 50 * 5; // 250,000
assert.strictEqual(res1.finalOld, expectedFuel, "Basic Fuel Calc Failed");
console.log("✅ Basic Calc Passed");

// Test 2: Switch Cost
const data2 = { ...baseData, oldPrice: 500000, newPrice: 1000000, fuelPrice: 0 };
const res2 = TCOLogic.calculate(data2);
assert.strictEqual(res2.finalNew, 500000, "Switch Cost Failed");
console.log("✅ Switch Cost Passed");

// Test 3: Depreciation
const data3 = { ...baseData, fuelPrice: 0, oldDepr: 10 };
// After 1 year: 1M * 0.9 = 900k. Loss = 100k.
const res3 = TCOLogic.calculate({ ...data3, years: 1 });
assert.strictEqual(Math.round(res3.finalOld), 100000, "Depreciation Failed");
console.log("✅ Depreciation Passed");

console.log("All Tests Passed!");
