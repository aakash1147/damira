import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrendPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trend-chart.component.html',
  styleUrl: './trend-chart.component.scss',
})
export class TrendChartComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() points: TrendPoint[] = [];

  get renderedPoints(): { x: number; y: number }[] {
    if (!this.points || this.points.length === 0) return [];
    let max = 1;
    for (const p of this.points) {
      if (p.value > max) max = p.value;
    }

    const w = 500;
    const h = 130;
    const pad = 20;
    const step = (w - pad * 2) / Math.max(1, this.points.length - 1);

    return this.points.map((p, idx) => {
      const x = pad + idx * step;
      const ratio = p.value / max;
      const y = h - ratio * (h - 20) + 10;
      return { x, y };
    });
  }

  get linePath(): string {
    const pts = this.renderedPoints;
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
  }

  get areaPath(): string {
    const pts = this.renderedPoints;
    if (pts.length === 0) return '';
    const line = this.linePath;
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x},150 L ${first.x},150 Z`;
  }
}
