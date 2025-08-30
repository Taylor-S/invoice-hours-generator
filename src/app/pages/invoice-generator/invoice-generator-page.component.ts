import { Component, OnInit } from '@angular/core';
import { CsvService } from '../../services/csv.service';
import { CalculationService } from '../../services/calculation.service';
import { ConfigService } from '../../services/config.service';
import { TotalSummary, CustomItem, ParseResult } from '../../models/invoice.models';

@Component({
  selector: 'app-invoice-generator-page',
  templateUrl: './invoice-generator-page.component.html',
  styleUrls: ['./invoice-generator-page.component.scss']
})
export class InvoiceGeneratorPageComponent implements OnInit {
  csvHeaders: string[] = [];
  csvData: string[][] = [];
  jobData: Record<string, number> = {};
  totals: TotalSummary | null = null;

  clickedJobs: { [key: string]: boolean } = {};
  customItems: Record<string, number> = {};
  fixedPriceItems: Record<string, number> = {};

  constructor(
    private csvService: CsvService,
    private calculationService: CalculationService,
    public configService: ConfigService
  ) { }

  ngOnInit(): void {
  }

  // Computed properties using the services
  get rate(): number {
    return this.configService.rate;
  }

  set rate(value: number) {
    this.configService.updateRate(value);
    this.updateTotals();
  }

  get rateExcludingGST(): number {
    return this.configService.rateExcludingGST;
  }

  get totalDecimalHours(): number {
    return this.totals?.totalHours || 0;
  }

  get totalHoursCost(): number {
    return this.totals?.totalIncGST || 0;
  }

  get totalHoursCostExcludingGST(): number {
    return this.totals?.totalExcGST || 0;
  }

  getAmountAfterTax(amount: number): number {
    return this.calculationService.calculateAfterTax(amount);
  }

  copyToClipboard(value: string, updateRow: boolean = false): void {
    navigator.clipboard.writeText(value).then(() => {
      console.log('Copied to clipboard successfully!');

      if (updateRow) {
        // Set the clicked job to true I color the row green
        this.clickedJobs[value] = true;
      }
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  // Event handlers for child components
  onCsvProcessed(result: ParseResult): void {
    this.csvHeaders = result.headers;
    this.csvData = this.csvService.addTotalRowToData(result.data, result.headers);
    this.jobData = result.jobData;
    this.updateTotals();
    console.log('CSV processed in InvoiceGeneratorPageComponent:', result);
  }

  onCsvUploadError(error: string): void {
    alert(error);
  }

  onRateChanged(): void {
    this.updateTotals();
  }

  onCustomItemAdded(item: CustomItem): void {
    if (item.type === 'hourly') {
      this.customItems[item.name] = item.value;
    } else if (item.type === 'fixed') {
      this.fixedPriceItems[item.name] = item.value;
    }
    this.updateTotals();
  }

  removeCustomItem(itemName: string): void {
    delete this.customItems[itemName];
    this.updateTotals();
  }

  removeFixedPriceItem(itemName: string): void {
    delete this.fixedPriceItems[itemName];
    this.updateTotals();
  }

  getAllJobData(): Record<string, number> {
    return { ...this.jobData, ...this.customItems };
  }

  getTotalFixedPriceAmount(): number {
    return this.totals?.fixedPriceTotal || 0;
  }

  getTotalFixedPriceAmountAfterTax(): number {
    const excGST = this.totals?.fixedPriceTotalExcGST || 0;
    return this.calculationService.calculateAfterTax(excGST);
  }

  getGrandTotalIncGST(): number {
    return this.totals?.grandTotalIncGST || 0;
  }

  getGrandTotalExcGST(): number {
    return this.totals?.grandTotalExcGST || 0;
  }

  getGrandTotalAfterTax(): number {
    return this.totals?.grandTotalAfterTax || 0;
  }

  private updateTotals(): void {
    this.totals = this.calculationService.calculateTotals(
      this.jobData,
      this.customItems,
      this.fixedPriceItems
    );
  }

  reCalc() {
    this.updateTotals();
  }
}
