import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TotalSummary } from '../models/invoice.models';
import { ConfigService } from './config.service';
import { environment } from '../../environments/environment';

export interface BillduDocument {
  id?: number;
  custom_id?: string;
  currency?: string;
  vs?: string;
  cs?: string;
  ss?: string;
  status?: string;
  payment?: string;
  delivery_type?: string;
  note?: string;
  order_number?: string;
  delivery_note?: string;
  discount?: number;
  discountType?: string;
  sconto_days?: number;
  created?: string;
  modified?: string;
  issue_date?: string;
  delivery_date?: string;
  execution_date?: string;
  maturity_date?: number;
  total_price?: number;
  price?: number;
  tax?: number;
  serial_number?: string;
  client?: any;
  supplier?: any;
  items?: BillduDocumentItem[];
}

export interface BillduDocumentItem {
  label: string;
  description?: string;
  price: number;
  tax?: number;
  count: number;
  unit?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillduApiService {
  private readonly apiBaseUrl = environment.billdu.baseUrl;
  private apiKey = environment.billdu.apiKey;
  private apiSecret = environment.billdu.apiSecret;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    // Warn if API credentials are not configured
    if (!this.apiKey || !this.apiSecret) {
      console.warn('Billdu API credentials not configured. Please set them in environment.ts or use setApiCredentials()');
    }
  }

  /**
   * Create a new invoice document in Billdu
   */
  createDocument(
    jobData: Record<string, number>,
    customItems: Record<string, number>,
    fixedPriceItems: Record<string, number>,
    totals: TotalSummary,
    clientInfo?: { company?: string; fullname?: string; email?: string; }
  ): Observable<BillduDocument> {
    // Check if API credentials are configured
    if (!this.apiKey || !this.apiSecret) {
      return throwError(() => new Error('Billdu API credentials not configured. Please set them in environment.ts'));
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const documentData = this.buildDocumentPayload(
      jobData, 
      customItems, 
      fixedPriceItems, 
      totals, 
      clientInfo
    );

    const signature = this.generateSignature(documentData, timestamp);
    
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('signature', signature)
      .set('timestamp', timestamp.toString());

    return this.http.post<BillduDocument>(
      `${this.apiBaseUrl}/documents`,
      documentData,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Build document payload for Billdu API
   */
  private buildDocumentPayload(
    jobData: Record<string, number>,
    customItems: Record<string, number>,
    fixedPriceItems: Record<string, number>,
    totals: TotalSummary,
    clientInfo?: { company?: string; fullname?: string; email?: string; }
  ): any {
    const items: BillduDocumentItem[] = [];

    // Add CSV job data as hourly items
    Object.entries(jobData).forEach(([name, hours]) => {
      items.push({
        label: name,
        description: `Hours worked on ${name}`,
        price: this.configService.rate,
        tax: 10, // 10% GST
        count: hours,
        unit: 'hour'
      });
    });

    // Add custom hourly items
    Object.entries(customItems).forEach(([name, hours]) => {
      items.push({
        label: name,
        description: `Custom hourly work: ${name}`,
        price: this.configService.rate,
        tax: 10,
        count: hours,
        unit: 'hour'
      });
    });

    // Add fixed price items
    Object.entries(fixedPriceItems).forEach(([name, amount]) => {
      items.push({
        label: name,
        description: `Fixed price item: ${name}`,
        price: amount,
        tax: 10,
        count: 1,
        unit: 'item'
      });
    });

    return {
      type: 'invoice',
      currency: 'AUD', // TODO: Make configurable
      payment: 'transfer',
      status: 'exposed',
      issue_date: new Date().toISOString(),
      maturity_date: 30, // 30 days payment terms
      client: {
        company: clientInfo?.company || 'Client Company',
        fullname: clientInfo?.fullname || 'Client Name',
        email: clientInfo?.email || ''
      },
      items: items,
      note: 'Generated from Invoice Hours Generator'
    };
  }

  /**
   * Generate HMAC signature for Billdu API authentication
   */
  private generateSignature(data: any, timestamp: number): string {
    const toSign: any = { ...data };
    toSign.timestamp = timestamp;
    toSign.apiKey = this.apiKey;

    // Sort object keys
    const sortedKeys = Object.keys(toSign).sort();
    const sortedData: any = {};
    sortedKeys.forEach(key => {
      sortedData[key] = toSign[key];
    });

    const json = JSON.stringify(sortedData);
    
    // TODO: Implement proper HMAC-SHA512 signature generation
    // For now, return a placeholder - this needs crypto library
    console.log('JSON to sign:', json);
    return 'placeholder_signature';
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Billdu API Error:', error);
    
    let errorMessage = 'An error occurred while creating invoice in Billdu';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized - Please check your API credentials';
          break;
        case 403:
          errorMessage = 'Forbidden - Access denied';
          break;
        case 422:
          errorMessage = 'Validation error - Please check the invoice data';
          break;
        default:
          errorMessage = `HTTP Error ${error.status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Configure API credentials
   */
  setApiCredentials(apiKey: string, apiSecret: string): void {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }
}
