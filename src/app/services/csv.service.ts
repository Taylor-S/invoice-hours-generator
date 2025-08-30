import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import * as Papa from 'papaparse';
import { ParseResult } from '../models/invoice.models';

@Injectable({
  providedIn: 'root'
})
export class CsvService {
  
  parseFile(file: File): Observable<ParseResult> {
    return from(new Promise<ParseResult>((resolve, reject) => {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        reject(new Error("Invalid file type. Please upload a CSV file."));
        return;
      }

      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<unknown>) => {
          try {
            const headers = results.meta.fields as string[];
            const processedData = results.data.map(row => this.processRow(row));
            
            // Add decimal hours header
            headers.push('Decimal Hours');
            
            // Aggregate data by card name
            const jobData = this.aggregateDecimalHoursPerCard(processedData);
            
            resolve({
              headers,
              data: processedData,
              jobData
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    }));
  }

  convertTimeToDecimal(time: string): string {
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
    let decimalHours = '';
    
    // Convert time at index 1 to decimal hours
    if (values[1]) {
      decimalHours = this.convertTimeToDecimal(values[1] as string);
    }
    
    values.push(decimalHours);
    return values as string[];
  }

  private aggregateDecimalHoursPerCard(csvData: string[][]): Record<string, number> {
    const aggregatedData: Record<string, number> = {};
    
    csvData.forEach((row) => {
      const cardName = row[6]; // Card name at index 6
      const decimalHours = parseFloat(row[row.length - 1]);
      
      if (!aggregatedData[cardName]) {
        aggregatedData[cardName] = 0;
      }
      aggregatedData[cardName] += decimalHours;
    });

    // Ensure 3 decimal places for all values
    Object.keys(aggregatedData).forEach(key => {
      aggregatedData[key] = parseFloat(aggregatedData[key].toFixed(3));
    });

    return aggregatedData;
  }

  addTotalRowToData(data: string[][], headers: string[]): string[][] {
    const totalDecimalHours = this.getTotalDecimalHours(data);
    const totalRow = new Array(headers.length).fill('');
    totalRow[headers.length - 1] = totalDecimalHours.toString();
    totalRow[0] = 'Total';
    
    return [...data, totalRow];
  }

  private getTotalDecimalHours(csvData: string[][]): number {
    let totalDecimalHours = 0;
    csvData.forEach(row => {
      const decimalHours = parseFloat(row[row.length - 1]);
      if (!isNaN(decimalHours)) {
        totalDecimalHours += decimalHours;
      }
    });
    return parseFloat(totalDecimalHours.toFixed(3));
  }
}
