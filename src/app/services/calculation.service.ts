import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { TotalSummary } from '../models/invoice.models';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor(private configService: ConfigService) {}

  calculateHourlyTotal(hours: number): { incGST: number, excGST: number } {
    return {
      incGST: hours * this.configService.rate,
      excGST: hours * this.configService.rateExcludingGST
    };
  }

  calculateGSTAmount(amountExcGST: number): number {
    return amountExcGST * this.configService.gstRate;
  }

  calculateAmountIncGST(amountExcGST: number): number {
    return amountExcGST * (1 + this.configService.gstRate);
  }

  calculateAfterTax(amount: number): number {
    return amount * (1 - this.configService.percentTaxWithheld);
  }

  calculateTotals(
    jobData: Record<string, number>, 
    customItems: Record<string, number>,
    fixedPriceItems: Record<string, number>
  ): TotalSummary {
    // Calculate total hours (CSV + custom hourly items)
    const csvHours = Object.values(jobData).reduce((sum, hours) => sum + hours, 0);
    const customHours = Object.values(customItems).reduce((sum, hours) => sum + hours, 0);
    const totalHours = csvHours + customHours;

    // Calculate hourly totals
    const hourlyTotals = this.calculateHourlyTotal(totalHours);

    // Calculate fixed price totals (stored as exc GST, need to add GST for display)
    const fixedPriceTotalExcGST = Object.values(fixedPriceItems).reduce((sum, amount) => sum + amount, 0);
    const fixedPriceTotalIncGST = this.calculateAmountIncGST(fixedPriceTotalExcGST);

    // Grand totals
    const grandTotalIncGST = hourlyTotals.incGST + fixedPriceTotalIncGST;
    const grandTotalExcGST = hourlyTotals.excGST + fixedPriceTotalExcGST;
    const grandTotalAfterTax = this.calculateAfterTax(hourlyTotals.excGST) + this.calculateAfterTax(fixedPriceTotalExcGST);

    return {
      totalIncGST: hourlyTotals.incGST,
      totalExcGST: hourlyTotals.excGST,
      totalAfterTax: this.calculateAfterTax(hourlyTotals.excGST),
      totalHours,
      fixedPriceTotal: fixedPriceTotalIncGST,
      fixedPriceTotalExcGST,
      grandTotalIncGST,
      grandTotalExcGST, 
      grandTotalAfterTax
    };
  }

  // Individual item calculations for display in tables
  calculateItemCostIncGST(hours: number): number {
    return hours * this.configService.rate;
  }

  calculateItemCostExcGST(hours: number): number {
    return hours * this.configService.rateExcludingGST;
  }

  calculateItemAfterTax(hours: number): number {
    const excGST = this.calculateItemCostExcGST(hours);
    return this.calculateAfterTax(excGST);
  }

  // Fixed price item calculations
  calculateFixedItemIncGST(amountExcGST: number): number {
    return this.calculateAmountIncGST(amountExcGST);
  }

  calculateFixedItemAfterTax(amountExcGST: number): number {
    return this.calculateAfterTax(amountExcGST);
  }
}
