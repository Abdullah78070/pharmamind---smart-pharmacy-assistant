import { ItemInput, CalculatedItem, AppSettings, TaxMethod, ItemType } from '../types';
import { StorageService } from './storageService';

export const CalculatorService = {
  calculateItem: (input: ItemInput, settings: AppSettings): CalculatedItem => {
    const {
      type,
      pharmaPrice,
      qty,
      bonus,
      supplierDiscountVal,
      extraDiscountPct,
      taxValue,
      taxMethod,
      publicPrice
    } = input;

    // 1. Base Discount % based on Type Settings
    let typeDiscountPct = 0;
    switch (type) {
      case ItemType.NORMAL: typeDiscountPct = settings.discountNormal / 100; break;
      case ItemType.SPECIAL: typeDiscountPct = settings.discountSpecial / 100; break;
      case ItemType.OTHER: typeDiscountPct = settings.discountOther / 100; break;
    }

    // 2. Financial Calculations
    const totalUnits = qty + bonus;
    const baseTotal = pharmaPrice * qty; // Cost without any discount
    
    // Type Discount
    const typeDiscountValue = baseTotal * typeDiscountPct;
    const afterTypeDiscount = baseTotal - typeDiscountValue;

    // Extra Percentage Discount (applied on the remaining amount)
    const extraDiscountValue = afterTypeDiscount * (extraDiscountPct / 100);
    
    // Subtotal before supplier cash discount and tax
    let subTotal = afterTypeDiscount - extraDiscountValue;

    // Supplier Cash Discount (Flat value deducted)
    subTotal = subTotal - supplierDiscountVal;

    // Tax
    let taxTotal = 0;
    if (taxMethod === TaxMethod.PER_UNIT) {
      taxTotal = taxValue * qty; // Usually tax is paid on purchased qty, sometimes on bonus too. Assuming purchased qty for cost basis.
    } else {
      taxTotal = taxValue;
    }

    // Final Net Cost for the whole line
    const netTotalCost = subTotal + taxTotal;

    // Unit Cost
    const netUnitCost = totalUnits > 0 ? netTotalCost / totalUnits : 0;

    // Real Discount % (Compared to Public Price)
    // Formula: 1 - (Net Unit Cost / Public Price)
    const realDiscountPct = publicPrice > 0 ? (1 - (netUnitCost / publicPrice)) * 100 : 0;

    // 3. AI / Smart Insights
    const result: CalculatedItem = {
      ...input,
      totalUnits,
      baseTotal,
      typeDiscountValue,
      afterTypeDiscount,
      extraDiscountValue,
      taxTotal,
      netTotalCost,
      netUnitCost,
      realDiscountPct,
      historyComparison: 'new',
      isFakeDiscount: false
    };

    // History Comparison
    const lastPurchase = StorageService.getLastPurchaseItem(input.name);
    if (lastPurchase) {
      const diff = netUnitCost - lastPurchase.netUnitCost;
      const pctDiff = lastPurchase.netUnitCost > 0 ? (diff / lastPurchase.netUnitCost) * 100 : 0;
      
      result.priceDifferencePct = Math.abs(pctDiff);
      
      if (diff < -0.001) { // Cheaper now
        result.historyComparison = 'better';
        result.savingsVsHistory = Math.abs(diff) * totalUnits;
      } else if (diff > 0.001) { // More expensive
        result.historyComparison = 'worse';
        result.savingsVsHistory = -1 * Math.abs(diff) * totalUnits;
      } else {
        result.historyComparison = 'same';
      }
    }

    // Fake Discount Detection
    // Logic: If declared discount (e.g. 20%) is vastly different from real discount due to price hikes or bad bonus structure.
    // Or simpler: If real discount is negative (cost > public) or suspciously low compared to type discount.
    const expectedTypeDiscount = typeDiscountPct * 100;
    if (realDiscountPct < (expectedTypeDiscount - 5)) {
      result.isFakeDiscount = true; // Flag if real discount is significantly worse than the "base" type discount
    }

    return result;
  }
};