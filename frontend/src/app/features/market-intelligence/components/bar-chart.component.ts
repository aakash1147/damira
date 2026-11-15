import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartItem {
  label: string;
  sublabel?: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
  sharePct?: number;
  color?: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
})
export class BarChartComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() items: BarChartItem[] = [];
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() defaultColor = '#7C3AED';
  @Input() showRank = false;

  calcPercentage(val: number): number {
    if (!this.items || this.items.length === 0) return 0;
    let max = 1;
    for (const item of this.items) {
      if (item.value > max) max = item.value;
      if (item.secondaryValue && item.secondaryValue > max) max = item.secondaryValue;
    }
    return Math.max(3, Math.min(100, Math.round((val / max) * 100)));
  }
}
