import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // This is including 10% GST
  rate = 77;

  // I'm holding back 35% for tax - This should more than cover it.
  percentTaxWithheld = 0.35;

  gstRate = 0.1;

  get rateExcludingGST(): number {
    return Math.round(this.rate / 1.1);
  }

  updateRate(newRate: number): void {
    this.rate = newRate;
  }

  updateTaxWithheldPercent(newPercent: number): void {
    this.percentTaxWithheld = newPercent;
  }
}
