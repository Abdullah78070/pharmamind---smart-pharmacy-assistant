export enum ItemType {
  NORMAL = 'عادي',
  SPECIAL = 'خاص',
  OTHER = 'أخرى',
}

export const ItemTypeShort = {
  [ItemType.NORMAL]: 'REG',
  [ItemType.SPECIAL]: 'SPE',
  [ItemType.OTHER]: 'OTH',
};

export enum TaxMethod {
  PER_UNIT = 'لكل وحدة',
  TOTAL = 'إجمالي',
}

export interface AppSettings {
  discountNormal: number;
  discountSpecial: number;
  discountOther: number;
  pharmacyName: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  balance: number; // Positive means they owe money
  notes?: string;
}

export interface ClientTransaction {
  id: string;
  clientId: string;
  date: string;
  type: 'SALE' | 'PAYMENT'; // SALE = Increase Debt, PAYMENT = Decrease Debt
  amount: number;
  notes?: string;
  relatedInvoiceId?: string; // If this transaction comes from reselling an invoice
  invoiceNumber?: string; // Helper for display
}

export interface ItemInput {
  id: string;
  name: string;
  type: ItemType;
  qty: number;
  bonus: number;
  publicPrice: number;
  pharmaPrice: number;
  supplierDiscountVal: number;
  extraDiscountPct: number;
  taxValue: number;
  taxMethod: TaxMethod;
}

export interface CalculatedItem extends ItemInput {
  totalUnits: number;
  baseTotal: number; // pharmaPrice * qty
  typeDiscountValue: number;
  afterTypeDiscount: number;
  extraDiscountValue: number;
  taxTotal: number;
  netTotalCost: number; // The final bill amount for this line
  netUnitCost: number; // netTotalCost / totalUnits
  realDiscountPct: number; // 1 - (netUnitCost / publicPrice)
  
  // AI Insights
  historyComparison?: 'better' | 'worse' | 'same' | 'new';
  priceDifferencePct?: number;
  savingsVsHistory?: number;
  isFakeDiscount?: boolean;
}

export interface Invoice {
  id: string;
  date: string; // ISO String
  invoiceNumber?: string;
  supplierId?: string; // Link to Supplier
  supplierName?: string; // Denormalized name for history
  items: CalculatedItem[];
  totalValue: number;
  totalItems: number;
  totalUnits: number;
  
  // Resell Status
  isSold?: boolean;
  soldToClientId?: string;
  soldDate?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  discountNormal: 20,
  discountSpecial: 10,
  discountOther: 0,
  pharmacyName: 'صيدليتي الذكية'
};