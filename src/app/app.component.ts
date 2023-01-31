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
  totalDecimalHours = 0;
  trelloTotalDecimalHours = '0'; // Copy and paste the total time from trello to compare and ensure correctness.

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
  }

  private aggregateDecimalHoursPerCard(): void {
    const aggregatedData: Record<string, number> = {};
    this.csvData.forEach((row) => {
      const cardName = row[4];
      const decimalHours = row[row.length - 1];
      if (!aggregatedData[cardName]) {
        aggregatedData[cardName] = 0;
      }
      aggregatedData[cardName] += parseFloat(decimalHours);
    });
    this.jobData = aggregatedData;

    this.totalDecimalHours = Object.values(this.jobData).reduce((sum, current) => sum + current, 0);

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
