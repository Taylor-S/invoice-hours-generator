import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';

// Import new components
import { CsvUploadComponent } from './components/csv-upload/csv-upload.component';
import { RateConfigurationComponent } from './components/rate-configuration/rate-configuration.component';
import { TrelloConverterComponent } from './components/trello-converter/trello-converter.component';
import { CustomItemFormComponent } from './components/custom-item-form/custom-item-form.component';

@NgModule({
  declarations: [
    AppComponent,
    CsvUploadComponent,
    RateConfigurationComponent,
    TrelloConverterComponent,
    CustomItemFormComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
