import {
  Component,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  ElementRef,
  ViewChild,
  HostListener,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatePerformance } from '../models/market-intelligence.model';
import {
  INDIA_MAP_DATA,
  StateMapFeature,
  IndiaMapDataset,
} from '../data/india-map-data';

export type MetricType = 'revenue' | 'orders' | 'customers' | 'profit' | 'units';

@Component({
  selector: 'app-india-choropleth-map',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './india-choropleth-map.component.html',
  styleUrl: './india-choropleth-map.component.scss',
})
export class IndiaChoroplethMapComponent implements OnChanges {
  statesData = input<StatePerformance[]>([]);
  @Output() stateSelected = new EventEmitter<StatePerformance>();
  @Output() drilldownRequested = new EventEmitter<StatePerformance>();

  @ViewChild('mapSvgWrapper') mapSvgWrapper?: ElementRef<HTMLDivElement>;

  readonly mapData: IndiaMapDataset = INDIA_MAP_DATA;

  selectedMetric = signal<MetricType>('revenue');
  selectedStateCode = signal<string | null>(null);
  hoveredFeature = signal<StateMapFeature | null>(null);
  hoveredState = signal<StatePerformance | null>(null);

  // Zoom & Pan state
  zoomScale = signal<number>(1);
  panX = signal<number>(0);
  panY = signal<number>(0);
  isDragging = signal<boolean>(false);
  dragStart = { x: 0, y: 0 };

  // Display toggles
  showLabels = signal<boolean>(true);
  isFullscreen = signal<boolean>(false);

  // Tooltip coordinates relative to SVG container
  tooltipPos = { x: 0, y: 0 };

  // Normalized fast lookup map
  private stateDataMap = computed(() => {
    const map = new Map<string, StatePerformance>();
    for (const s of this.statesData()) {
      if (!s) continue;
      let code = (s.stateCode || '').toUpperCase().trim();
      if (code === 'OR') code = 'OD';
      if (code === 'DN') code = 'DNHDD';
      map.set(code, s);

      // Also map normalized name
      const normName = this.normalizeName(s.stateName);
      if (normName) map.set(normName, s);
    }
    return map;
  });

  // Active selected record
  activeStateRecord = computed(() => {
    const code = this.selectedStateCode();
    if (!code) return null;
    const map = this.stateDataMap();
    return map.get(code) || null;
  });

  // Selected Geo feature (even if no DB orders exist yet)
  selectedFeatureRecord = computed(() => {
    const code = this.selectedStateCode();
    if (!code) return null;
    return this.mapData.states.find((s) => s.code === code) || null;
  });

  // Calculate dynamic metric minimum and maximum
  metricExtremes = computed(() => {
    const metric = this.selectedMetric();
    const vals: number[] = [];
    for (const s of this.statesData()) {
      const v = this.extractMetricValue(s, metric);
      if (v > 0) vals.push(v);
    }
    const max = vals.length > 0 ? Math.max(...vals) : 100;
    const min = vals.length > 0 ? Math.min(...vals) : 0;
    return { min, max, count: vals.length };
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['statesData'] && this.statesData().length > 0) {
      const current = this.selectedStateCode();
      if (current) {
        // Re-trigger selection to ensure bound records refresh
        this.selectedStateCode.set(current);
      }
    }
  }

  // --- Map Interaction Handlers ---

  onMetricChange(metric: MetricType): void {
    this.selectedMetric.set(metric);
  }

  getStateRecord(feat: StateMapFeature): StatePerformance | null {
    const map = this.stateDataMap();
    return map.get(feat.code) || map.get(this.normalizeName(feat.name)) || null;
  }

  extractMetricValue(record: StatePerformance | null, metric: MetricType): number {
    if (!record) return 0;
    switch (metric) {
      case 'revenue':
        return record.totalRevenue || 0;
      case 'orders':
        return record.totalOrders || 0;
      case 'customers':
        return record.totalCustomers || 0;
      case 'profit':
        return record.totalProfit || 0;
      case 'units':
        return record.unitsSold || 0;
      default:
        return 0;
    }
  }

  getStateValue(feat: StateMapFeature): number {
    const record = this.getStateRecord(feat);
    return this.extractMetricValue(record, this.selectedMetric());
  }

  // 6-step gradient color scale: No Data -> Very Low -> Low -> Medium -> High -> Peak
  getStateFill(feat: StateMapFeature): string {
    const record = this.getStateRecord(feat);
    if (!record) {
      return '#f1f5f9'; // No Data / Not In DB
    }

    const val = this.extractMetricValue(record, this.selectedMetric());
    if (val <= 0) {
      return '#f8fafc'; // Zero value
    }

    const { min, max } = this.metricExtremes();
    const ratio = max > min ? (val - min) / (max - min) : 1;

    if (ratio < 0.15) return '#ede9fe'; // Very Low (Light Lavender)
    if (ratio < 0.35) return '#c4b5fd'; // Low (Soft Purple)
    if (ratio < 0.60) return '#8b5cf6'; // Medium (Medium Purple)
    if (ratio < 0.85) return '#6d28d9'; // High (Dark Purple)
    return '#4c1d95';                   // Peak (Deep DAMIRA Purple)
  }

  getLabelColor(feat: StateMapFeature): string {
    const record = this.getStateRecord(feat);
    if (!record) return '#64748b';
    const val = this.extractMetricValue(record, this.selectedMetric());
    if (val <= 0) return '#64748b';

    const { min, max } = this.metricExtremes();
    const ratio = max > min ? (val - min) / (max - min) : 1;
    return ratio >= 0.60 ? '#ffffff' : '#4c1d95';
  }

  onStateHover(feat: StateMapFeature, event: MouseEvent): void {
    const record = this.getStateRecord(feat);
    this.hoveredFeature.set(feat);
    this.hoveredState.set(
      record || {
        stateId: '',
        stateName: feat.name,
        stateCode: feat.code,
        totalCustomers: 0,
        newCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        unitsSold: 0,
        averageOrderValue: 0,
        repeatCustomers: 0,
        repeatPurchaseRate: 0,
        revenueContributionPct: 0,
      }
    );

    this.updateTooltipPos(event);
  }

  onStateMouseMove(event: MouseEvent): void {
    if (this.hoveredState()) {
      this.updateTooltipPos(event);
    }
  }

  onStateLeave(): void {
    this.hoveredFeature.set(null);
    this.hoveredState.set(null);
  }

  private updateTooltipPos(event: MouseEvent): void {
    if (!this.mapSvgWrapper) return;
    const rect = this.mapSvgWrapper.nativeElement.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    // Boundary check so tooltip does not overflow right/bottom
    const tooltipWidth = 260;
    const tooltipHeight = 220;
    const maxX = rect.width - tooltipWidth - 10;
    const maxY = rect.height - tooltipHeight - 10;

    this.tooltipPos = {
      x: Math.min(Math.max(10, rawX + 16), maxX),
      y: Math.min(Math.max(10, rawY + 16), maxY),
    };
  }

  onStateClick(feat: StateMapFeature): void {
    const record = this.getStateRecord(feat);
    this.selectedStateCode.set(feat.code);

    if (record) {
      this.stateSelected.emit(record);
    }
  }

  clearStateSelection(): void {
    this.selectedStateCode.set(null);
  }

  drillDownToCities(): void {
    const record = this.activeStateRecord();
    if (record) {
      this.drilldownRequested.emit(record);
    }
  }

  // --- Zoom, Pan & Controls ---

  zoomIn(): void {
    this.zoomScale.update((s) => Math.min(3.5, Number((s * 1.25).toFixed(2))));
  }

  zoomOut(): void {
    this.zoomScale.update((s) => Math.max(0.75, Number((s / 1.25).toFixed(2))));
  }

  resetZoom(): void {
    this.zoomScale.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  toggleLabels(): void {
    this.showLabels.update((v) => !v);
  }

  toggleFullscreen(): void {
    this.isFullscreen.update((v) => !v);
  }

  onMouseDown(event: MouseEvent): void {
    // Only drag with left mouse button when not clicking a path directly
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'svg' || target.classList.contains('map-bg')) {
      this.isDragging.set(true);
      this.dragStart = { x: event.clientX - this.panX(), y: event.clientY - this.panY() };
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging()) {
      this.panX.set(event.clientX - this.dragStart.x);
      this.panY.set(event.clientY - this.dragStart.y);
    }
  }

  onMouseUp(): void {
    this.isDragging.set(false);
  }

  get transformString(): string {
    return `translate(${this.panX()}, ${this.panY()}) scale(${this.zoomScale()})`;
  }

  // --- Helpers ---

  getMetricLabel(): string {
    switch (this.selectedMetric()) {
      case 'revenue': return 'Revenue';
      case 'orders': return 'Orders';
      case 'customers': return 'Customers';
      case 'profit': return 'Gross Profit';
      case 'units': return 'Units Sold';
    }
  }

  formatMetricValue(val: number): string {
    const metric = this.selectedMetric();
    if (metric === 'revenue' || metric === 'profit') {
      return '₹' + (val || 0).toLocaleString('en-IN');
    }
    return (val || 0).toLocaleString('en-IN');
  }

  formatLegendVal(val: number): string {
    const metric = this.selectedMetric();
    if (val >= 10000000) return '₹' + (val / 10000000).toFixed(1) + ' Cr';
    if (val >= 100000) return '₹' + (val / 100000).toFixed(1) + ' L';
    if (val >= 1000) return (metric === 'revenue' || metric === 'profit' ? '₹' : '') + (val / 1000).toFixed(0) + 'k';
    return (metric === 'revenue' || metric === 'profit' ? '₹' : '') + val.toLocaleString('en-IN');
  }

  private normalizeName(name?: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '')
      .replace(/islands?/g, '')
      .replace(/territory/g, '')
      .replace(/orissa/g, 'odisha')
      .replace(/uttaranchal/g, 'uttarakhand');
  }
}
