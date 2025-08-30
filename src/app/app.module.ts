import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';

// Import components
import { CsvUploadComponent } from './components/csv-upload/csv-upload.component';
import { RateConfigurationComponent } from './components/rate-configuration/rate-configuration.component';
import { TrelloConverterComponent } from './components/trello-converter/trello-converter.component';
import { CustomItemFormComponent } from './components/custom-item-form/custom-item-form.component';
import { NavigationComponent } from './components/navigation/navigation.component';

// Import page components
import { InvoiceGeneratorPageComponent } from './pages/invoice-generator/invoice-generator-page.component';
import { InvoicesPageComponent } from './pages/invoices/invoices-page.component';

const routes: Routes = [
  { path: '', component: InvoiceGeneratorPageComponent },
  { path: 'invoices', component: InvoicesPageComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    CsvUploadComponent,
    RateConfigurationComponent,
    TrelloConverterComponent,
    CustomItemFormComponent,
    NavigationComponent,
    InvoiceGeneratorPageComponent,
    InvoicesPageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
