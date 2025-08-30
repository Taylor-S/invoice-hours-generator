import { Component, Output, EventEmitter } from '@angular/core';
import { CsvService } from '../../services/csv.service';
import { ParseResult } from '../../models/invoice.models';

@Component({
  selector: 'app-csv-upload',
  templateUrl: './csv-upload.component.html',
  styleUrls: ['./csv-upload.component.scss']
})
export class CsvUploadComponent {
  @Output() csvProcessed = new EventEmitter<ParseResult>();
  @Output() uploadError = new EventEmitter<string>();
  
  dragOver = false;

  constructor(private csvService: CsvService) {}

  dragOverHandler(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    this.dragOver = true;
  }

  dragLeaveHandler(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  dropHandler(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  uploadFile(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    this.csvService.parseFile(file).subscribe({
      next: (result) => {
        console.log('CSV processed successfully:', result);
        this.csvProcessed.emit(result);
      },
      error: (error) => {
        console.error('CSV processing error:', error);
        this.uploadError.emit(error.message);
      }
    });
  }
}
