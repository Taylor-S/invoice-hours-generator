import { Component, Output, EventEmitter } from '@angular/core';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-rate-configuration',
  templateUrl: './rate-configuration.component.html',
  styleUrls: ['./rate-configuration.component.scss']
})
export class RateConfigurationComponent {
  @Output() rateChanged = new EventEmitter<number>();

  constructor(public configService: ConfigService) {}

  onRateChange(): void {
    this.rateChanged.emit(this.configService.rate);
  }

  get rate(): number {
    return this.configService.rate;
  }

  set rate(value: number) {
    this.configService.updateRate(value);
    this.onRateChange();
  }
}
