import { Component } from '@angular/core';
import { CsvService } from '../../services/csv.service';

@Component({
  selector: 'app-trello-converter',
  templateUrl: './trello-converter.component.html',
  styleUrls: ['./trello-converter.component.scss']
})
export class TrelloConverterComponent {
  trelloTotalDecimalHours = '0';
  trelloTimeInput = '';

  constructor(private csvService: CsvService) {}

  convertTrelloTime(timeString: string): void {
    if (timeString.trim()) {
      this.trelloTotalDecimalHours = this.csvService.convertTimeToDecimal(timeString);
    } else {
      this.trelloTotalDecimalHours = '0';
    }
  }

  clearConversion(): void {
    this.trelloTimeInput = '';
    this.trelloTotalDecimalHours = '0';
  }
}
