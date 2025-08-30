import { Component } from '@angular/core';
import { CsvService } from './services/csv.service';
import { CalculationService } from './services/calculation.service';
import { ConfigService } from './services/config.service';
import { TotalSummary, CustomItem, ParseResult } from './models/invoice.models';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'invoice-hours-generator';
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
  ) {}

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
    console.log('CSV processed in AppComponent:', result);
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

  // ASK CHATGPT!!!
  //   Given this function, can I loop over aggregatedData and ensure 3 decimal places?

  // private aggregateDecimalHoursPerCard(): void {
  //     const aggregatedData: Record<string, number> = {};
  //     this.csvData.forEach((row) => {
  //       const cardName = row[3];
  //       const decimalHours = row[7];
  //       if (!aggregatedData[cardName]) {
  //         aggregatedData[cardName] = 0;
  //       }
  //       aggregatedData[cardName] += parseFloat(decimalHours);
  //     });
  //     this.jobData = aggregatedData;

  //     this.totalDecimalHours = Object.values(this.jobData).reduce((sum, current) => sum + current, 0);

  //     console.log(this.jobData);
  //     console.log(Object.keys(this.jobData));
  //   }


}
