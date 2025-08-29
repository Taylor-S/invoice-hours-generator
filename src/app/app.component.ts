import { Component } from '@angular/core';
import * as Papa from 'papaparse';


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
  totalHoursCost = 0;
  totalHoursCostExcludingGST = 0;
  totalDecimalHours = 0;
  trelloTotalDecimalHours = '0'; // Copy and paste the total time from trello to compare and ensure correctness.

  // This is including 10% GST
  rate = 77;

  get rateExcludingGST(): number {
    return Math.round(this.rate / 1.1);
  }

  // I'm holding back 32.5% for tax - This should more than cover it.
  percentTaxWithheld = 0.35;

  clickedJobs: { [key: string]: boolean } = {};
  customItems: Record<string, number> = {};
  fixedPriceItems: Record<string, number> = {};
  newCustomItemName = '';
  newCustomItemHours = 0;
  newFixedPriceItemName = '';
  newFixedPriceAmount = 0;
  itemType: 'hourly' | 'fixed' = 'hourly';
  private jobArray: {
    key: string;
    value: number;
  }[] = [
  ];

  getAmountAfterTax(amount: number): number {
    return amount * (1 - this.percentTaxWithheld);
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
    return Object.values(this.fixedPriceItems).reduce((sum, current) => sum + current, 0);
  }

  getTotalFixedPriceAmountAfterTax(): number {
    return this.getAmountAfterTax(this.getTotalFixedPriceAmount());
  }

  getGrandTotalIncGST(): number {
    return this.totalHoursCost + (this.getTotalFixedPriceAmount() * 1.1);
  }

  getGrandTotalExcGST(): number {
    return this.totalHoursCostExcludingGST + this.getTotalFixedPriceAmount();
  }

  getGrandTotalAfterTax(): number {
    return this.getAmountAfterTax(this.totalHoursCostExcludingGST) + this.getTotalFixedPriceAmountAfterTax();
  }

  private updateTotals(): void {
    const csvTotal = Object.values(this.jobData).reduce((sum, current) => sum + current, 0);
    const customTotal = Object.values(this.customItems).reduce((sum, current) => sum + current, 0);
    this.totalDecimalHours = csvTotal + customTotal;
    this.calcTotalHoursCost();
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
    this.trelloTotalDecimalHours = this.convertTimeToDecimal(timeString);
  }


  uploadFile(event: any): void {
    const file = event.target.files[0];
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<unknown>) => {
          this.csvHeaders = results.meta.fields as string[];
          this.csvData = results.data.map(row => this.processRow(row));
          this.csvHeaders.splice(this.csvHeaders.length, 0, 'Decimal Hours');
          this.aggregateDecimalHoursPerCard()
          this.addTotalRow();
          console.log(this.csvData);
        }
      });
    } else {
      // Show an error message or alert
      alert("Invalid file type. Please upload a CSV file.");
    }
  }

  reCalc() {
    this.calcTotalHoursCost();
  }


  createJobsArray() {
    this.jobArray = Object.entries(this.jobData).map(([key, value]) => ({ key, value }));
  }

  private convertTimeToDecimal(time: string) {
    const timeArray = time.split(' ');
    let hours = 0;
    let minutes = 0;
    for (let i = 0; i < timeArray.length; i++) {
      if (timeArray[i].endsWith('h')) {
        hours = parseInt(timeArray[i].substring(0, timeArray[i].length - 1));
      } else if (timeArray[i].endsWith('m')) {
        minutes = parseInt(timeArray[i].substring(0, timeArray[i].length - 1));
      }
    }
    return (hours + minutes / 60).toFixed(3);
  }

  private processRow(row: any): string[] {
    const values = Object.values(row);
    let decimalHours: string = '';
    for (let i = 0; i < values.length; i++) {
      if (i === 1) {
        decimalHours = this.convertTimeToDecimal(values[i] as string);
      }
    }
    values.push(decimalHours);
    return values as string[];
  }

  private getTotalDecimalHours(): number {
    let totalDecimalHours = 0;
    this.csvData.forEach(row => {
      totalDecimalHours += parseFloat(row[row.length - 1]);
    });
    return totalDecimalHours;
  }

  private addTotalRow() {
    const totalRow = new Array(this.csvHeaders.length).fill('');
    totalRow[this.csvHeaders.length - 1] = this.getTotalDecimalHours().toString();
    totalRow[0] = 'Total';
    this.csvData.push(totalRow);

    this.calcTotalHoursCost();
  }

  private calcTotalHoursCost() {
    this.totalHoursCost = this.totalDecimalHours * this.rate;
    this.totalHoursCostExcludingGST = this.totalDecimalHours * this.rateExcludingGST;
  }

  private aggregateDecimalHoursPerCard(): void {
    const aggregatedData: Record<string, number> = {};
    this.csvData.forEach((row) => {
      const cardName = row[6];
      const decimalHours = row[row.length - 1];
      if (!aggregatedData[cardName]) {
        aggregatedData[cardName] = 0;
      }
      aggregatedData[cardName] += parseFloat(decimalHours);
    });
    this.jobData = aggregatedData;

    this.updateTotals();

    console.log(this.jobData);
    console.log(Object.keys(this.jobData));
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
