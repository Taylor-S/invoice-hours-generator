import { Component } from '@angular/core';
import { CsvService } from './services/csv.service';
import { CalculationService } from './services/calculation.service';
import { ConfigService } from './services/config.service';
import { TotalSummary, CustomItem } from './models/invoice.models';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'invoice-hours-generator';
  csvHeaders: string[] = [];
  csvData: string[][] = [];
  dragOver = false;
  jobData: Record<string, number> = {};
  totals: TotalSummary | null = null;
  trelloTotalDecimalHours = '0'; // Copy and paste the total time from trello to compare and ensure correctness.

  clickedJobs: { [key: string]: boolean } = {};
  customItems: Record<string, number> = {};
  fixedPriceItems: Record<string, number> = {};
  newCustomItemName = '';
  newCustomItemHours = 0;
  newFixedPriceItemName = '';
  newFixedPriceAmount = 0;
  itemType: 'hourly' | 'fixed' = 'hourly';

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

  addCustomItem(): void {
    if (this.itemType === 'hourly') {
      if (this.newCustomItemName.trim() && this.newCustomItemHours > 0) {
        this.customItems[this.newCustomItemName.trim()] = this.newCustomItemHours;
        this.newCustomItemName = '';
        this.newCustomItemHours = 0;
        this.updateTotals();
      }
    } else {
      if (this.newFixedPriceItemName.trim() && this.newFixedPriceAmount > 0) {
        this.fixedPriceItems[this.newFixedPriceItemName.trim()] = this.newFixedPriceAmount;
        this.newFixedPriceItemName = '';
        this.newFixedPriceAmount = 0;
        this.updateTotals();
      }
    }
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

  dragOverHandler(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    this.dragOver = true;
  }

  dropHandler(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    if (event.dataTransfer) {
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const dummyEvent = {
          target: {
            files
          }
        }
        this.uploadFile(dummyEvent);
      }
    }
  }


  convertTrelloTime(timeString: string) {
    this.trelloTotalDecimalHours = this.csvService.convertTimeToDecimal(timeString);
  }


  uploadFile(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.csvService.parseFile(file).subscribe({
      next: (result) => {
        this.csvHeaders = result.headers;
        this.csvData = this.csvService.addTotalRowToData(result.data, result.headers);
        this.jobData = result.jobData;
        this.updateTotals();
        console.log('CSV processed:', result);
      },
      error: (error) => {
        alert(error.message);
      }
    });
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
