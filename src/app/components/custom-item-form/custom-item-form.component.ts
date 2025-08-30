import { Component, Output, EventEmitter } from '@angular/core';
import { CustomItem } from '../../models/invoice.models';

@Component({
  selector: 'app-custom-item-form',
  templateUrl: './custom-item-form.component.html',
  styleUrls: ['./custom-item-form.component.scss']
})
export class CustomItemFormComponent {
  @Output() itemAdded = new EventEmitter<CustomItem>();

  itemType: 'hourly' | 'fixed' = 'hourly';
  newCustomItemName = '';
  newCustomItemHours = 0;
  newFixedPriceItemName = '';
  newFixedPriceAmount = 0;

  addCustomItem(): void {
    if (this.itemType === 'hourly' && this.isHourlyItemValid()) {
      this.itemAdded.emit({
        name: this.newCustomItemName.trim(),
        value: this.newCustomItemHours,
        type: 'hourly'
      });
      this.resetHourlyForm();
    } else if (this.itemType === 'fixed' && this.isFixedItemValid()) {
      this.itemAdded.emit({
        name: this.newFixedPriceItemName.trim(),
        value: this.newFixedPriceAmount,
        type: 'fixed'
      });
      this.resetFixedForm();
    }
  }

  private isHourlyItemValid(): boolean {
    return this.newCustomItemName.trim().length > 0 && this.newCustomItemHours > 0;
  }

  private isFixedItemValid(): boolean {
    return this.newFixedPriceItemName.trim().length > 0 && this.newFixedPriceAmount > 0;
  }

  get isAddButtonDisabled(): boolean {
    if (this.itemType === 'hourly') {
      return !this.isHourlyItemValid();
    } else {
      return !this.isFixedItemValid();
    }
  }

  private resetHourlyForm(): void {
    this.newCustomItemName = '';
    this.newCustomItemHours = 0;
  }

  private resetFixedForm(): void {
    this.newFixedPriceItemName = '';
    this.newFixedPriceAmount = 0;
  }
}
