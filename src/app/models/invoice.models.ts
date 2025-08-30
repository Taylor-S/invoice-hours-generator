export interface CustomItem {
  name: string;
  value: number;
  type: 'hourly' | 'fixed';
}

export interface ProcessedCsvData {
  headers: string[];
  data: string[][];  
  jobData: Record<string, number>;
}

export interface TotalSummary {
  totalIncGST: number;
  totalExcGST: number;
  totalAfterTax: number;
  totalHours: number;
  fixedPriceTotal: number;
  fixedPriceTotalExcGST: number;
  grandTotalIncGST: number;
  grandTotalExcGST: number;
  grandTotalAfterTax: number;
}

export interface CopyableItem {
  name: string;
  value: number | string;
  type: 'csv' | 'custom' | 'fixed';
}

export interface ParseResult {
  headers: string[];
  data: string[][];
  jobData: Record<string, number>;
}
