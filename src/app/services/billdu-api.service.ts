import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TotalSummary } from '../models/invoice.models';
import { ConfigService } from './config.service';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';

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

export interface BillduClient {
  id: number;
  company?: string;
  fullname?: string;
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  created?: string;
  modified?: string;
}

export interface BillduApiListResponse<T> {
  page: number;
  limit: number;
  pages: number;
  total: number;
  _embedded?: {
    [key: string]: T[];
  };
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
    clientInfo?: { company?: string; fullname?: string; email?: string; },
    clientId?: number
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
      clientInfo,
      clientId
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
   * Get all clients from Billdu
   */
  getClients(): Observable<BillduClient[]> {
    // Check if API credentials are configured
    if (!this.apiKey || !this.apiSecret) {
      return throwError(() => new Error('Billdu API credentials not configured. Please set them in environment.ts'));
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const emptyData: any[] = []; // Empty array for GET request as per API documentation
    const signature = this.generateSignature(emptyData, timestamp);
    
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('signature', signature)
      .set('timestamp', timestamp.toString());

    console.log('Making GET request to:', `${this.apiBaseUrl}/clients`);
    console.log('Request params:', {
      apiKey: this.apiKey,
      signature: signature,
      timestamp: timestamp
    });

    return this.http.get<BillduApiListResponse<BillduClient>>(
      `${this.apiBaseUrl}/clients`,
      { params }
    ).pipe(
      map(response => {
        console.log('Full API response:', response);
        // Extract clients from the embedded response structure
        // According to API docs, clients are in _embedded.items
        if (response._embedded && response._embedded['items']) {
          return response._embedded['items'];
        }
        return [];
      }),
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
    clientInfo?: { company?: string; fullname?: string; email?: string; },
    clientId?: number
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

    const documentPayload: any = {
      type: 'invoice',
      currency: 'AUD', // TODO: Make configurable
      payment: 'transfer',
      status: 'exposed',
      issue_date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
      maturity_date: 30, // 30 days payment terms
      items: items,
      note: 'Generated from Invoice Hours Generator'
    };

    // Use client ID if provided (for existing clients), otherwise use client info
    if (clientId) {
      documentPayload.client = clientId;
    } else if (clientInfo) {
      documentPayload.client = {
        company: clientInfo.company || 'Client Company',
        fullname: clientInfo.fullname || 'Client Name',
        email: clientInfo.email || ''
      };
    }

    return documentPayload;
  }

  /**
   * Generate HMAC signature for Billdu API authentication
   * Based on Billdu API documentation:
   * 1. Create data object/array with timestamp and apiKey
   * 2. Sort keys alphabetically (ksort)
   * 3. JSON encode
   * 4. Generate HMAC-SHA512 hash (raw bytes)
   * 5. Base64 encode
   * 6. URL encode
   */
  private generateSignature(data: any, timestamp: number): string {
    let toSign: any;
    
    // Handle both arrays (for GET) and objects (for POST)
    if (Array.isArray(data)) {
      // For GET requests with empty array
      toSign = {
        timestamp: timestamp,
        apiKey: this.apiKey
      };
    } else {
      // For POST requests with data object
      toSign = { ...data };
      toSign.timestamp = timestamp;
      toSign.apiKey = this.apiKey;
    }

    // Sort object keys alphabetically (ksort equivalent)
    const sortedKeys = Object.keys(toSign).sort();
    const sortedData: any = {};
    sortedKeys.forEach(key => {
      sortedData[key] = toSign[key];
    });

    // JSON encode the sorted data
    const json = JSON.stringify(sortedData);
    
    // Generate HMAC-SHA512 hash with the API secret (raw = true)
    const hash = CryptoJS.HmacSHA512(json, this.apiSecret);
    
    // Base64 encode the raw hash
    const base64Hash = hash.toString(CryptoJS.enc.Base64);
    
    // URL encode the signature
    const signature = encodeURIComponent(base64Hash);
    
    console.log('Signing JSON:', json);
    console.log('Base64 hash:', base64Hash);
    console.log('URL encoded signature:', signature);
    
    return signature;
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
