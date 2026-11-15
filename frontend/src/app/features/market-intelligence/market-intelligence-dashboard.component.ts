import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MarketIntelligenceService } from './services/market-intelligence.service';
import { IndiaChoroplethMapComponent } from './components/india-choropleth-map.component';
import { BarChartComponent, TrendChartComponent, BarChartItem, TrendPoint } from './components/analytics-charts.component';
import {
  AnalyticsFilter,
  KpiSummary,
  StatePerformance,
  StatePerformanceResponse,
  StateDetailResponse,
  CityPerformance,
  CityPerformanceResponse,
  CityDetailResponse,
  PincodePerformance,
  PincodePerformanceResponse,
  CustomerVsOrdersItem,
  CustomerVsOrdersResponse,
  RevenueProfitResponse,
  FinancialLedgerRow,
  ProductDemandItem,
  SalesChannelItem,
  GrowthTrendItem,
  FilterMetadata,
} from './models/market-intelligence.model';

@Component({
  selector: 'app-market-intelligence-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    IndiaChoroplethMapComponent,
    BarChartComponent,
    TrendChartComponent,
  ],
  templateUrl: './market-intelligence-dashboard.component.html',
  styleUrl: './market-intelligence-dashboard.component.scss',
})
export class MarketIntelligenceDashboardComponent implements OnInit {
  private analyticsService = inject(MarketIntelligenceService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  selectedTabIndex = 0;
  isLoading = signal<boolean>(false);
  isFilterOpen = signal<boolean>(false);

  // Filter Form (All 10 Global Filters from Prompt Section 3)
  filterForm: FormGroup = this.fb.group({
    startDate: [''],
    endDate: [''],
    countryId: [''],
    stateId: [''],
    cityId: [''],
    postalCode: [''],
    customerTypeId: [''],
    channelCode: [''],
    productId: [''],
    orderStatus: [''],
  });

  // Dynamic Master Data for Global Filters
  filterMeta = signal<FilterMetadata | null>(null);

  // Active Detail Drawers
  activeStateDetail = signal<StateDetailResponse | null>(null);
  activeCityDetail = signal<CityDetailResponse | null>(null);

  // Tab 1 & Overview Data
  overview = signal<KpiSummary | null>(null);
  statesList = signal<StatePerformance[]>([]);

  // Tab 2: State Data
  stateData = signal<StatePerformanceResponse | null>(null);
  stateSearchTerm = '';
  stateSortColumn = 'totalRevenue';
  stateSortAsc = false;

  // Tab 3: City Data
  cityData = signal<CityPerformanceResponse | null>(null);
  citySearchTerm = '';
  citySortColumn = 'totalRevenue';
  citySortAsc = false;

  // Tab 4: Pincode Data
  pincodeData = signal<PincodePerformanceResponse | null>(null);
  pincodeSearchTerm = '';

  // Tab 5: Customer vs Orders Data
  custVsOrdersData = signal<CustomerVsOrdersResponse | null>(null);

  // Tab 6: Revenue & Profit Data
  revProfitData = signal<RevenueProfitResponse | null>(null);

  ngOnInit(): void {
    this.loadFilterMetadata();
    this.loadAllData();
  }

  loadFilterMetadata(): void {
    this.analyticsService.getFilterMetadata().subscribe({
      next: (meta) => this.filterMeta.set(meta),
      error: () => console.warn('Could not load filter metadata'),
    });
  }

  toggleFilterDrawer(): void {
    this.isFilterOpen.update((v) => !v);
  }

  hasActiveFilters(): boolean {
    const v = this.filterForm.value;
    return Boolean(
      v.startDate || v.endDate || v.countryId || v.stateId || v.cityId ||
      v.postalCode || v.customerTypeId || v.channelCode || v.productId || v.orderStatus
    );
  }

  availableCitiesForFilter() {
    const selectedStateId = this.filterForm.value.stateId;
    const cities = this.filterMeta()?.cities || [];
    if (!selectedStateId) return cities;
    return cities.filter((c) => c.stateId === selectedStateId);
  }

  onFilterStateChange(stateId: string): void {
    this.filterForm.patchValue({ cityId: '' });
  }

  getStateNameById(stateId: string): string {
    const s = this.filterMeta()?.states.find((item) => item.id === stateId);
    return s ? s.name : stateId;
  }

  getCityNameById(cityId: string): string {
    const c = this.filterMeta()?.cities.find((item) => item.id === cityId);
    return c ? c.name : cityId;
  }

  clearFilterField(field: string): void {
    this.filterForm.patchValue({ [field]: '' });
    this.loadAllData();
  }

  resetFilters(): void {
    this.filterForm.reset({
      startDate: '',
      endDate: '',
      countryId: '',
      stateId: '',
      cityId: '',
      postalCode: '',
      customerTypeId: '',
      channelCode: '',
      productId: '',
      orderStatus: '',
    });
    this.loadAllData();
  }

  applyFilters(): void {
    this.loadAllData();
  }

  private getCurrentFilter(): AnalyticsFilter {
    return { ...this.filterForm.value };
  }

  loadAllData(): void {
    this.isLoading.set(true);
    const filter = this.getCurrentFilter();

    // 1. Overview KPIs
    this.analyticsService.getGeographyOverview(filter).subscribe({
      next: (res) => this.overview.set(res),
      error: () => this.snackBar.open('Error loading overview KPIs', 'Dismiss', { duration: 3000 }),
    });

    // 2. State Performance
    this.analyticsService.getStatePerformance(filter).subscribe({
      next: (res) => {
        this.stateData.set(res);
        this.statesList.set(res.states);
      },
      error: () => this.snackBar.open('Error loading state data', 'Dismiss', { duration: 3000 }),
    });

    // 3. City Performance
    this.analyticsService.getCityPerformance(filter).subscribe({
      next: (res) => this.cityData.set(res),
      error: () => this.snackBar.open('Error loading city data', 'Dismiss', { duration: 3000 }),
    });

    // 4. Pincode Performance
    this.analyticsService.getPincodePerformance(filter).subscribe({
      next: (res) => this.pincodeData.set(res),
      error: () => this.snackBar.open('Error loading pincode data', 'Dismiss', { duration: 3000 }),
    });

    // 5. Customer vs Orders
    this.analyticsService.getCustomerOrderAnalysis(filter).subscribe({
      next: (res) => this.custVsOrdersData.set(res),
      error: () => this.snackBar.open('Error loading customer conversion data', 'Dismiss', { duration: 3000 }),
    });

    // 6. Revenue & Profit
    this.analyticsService.getRevenueProfitAnalysis(filter).subscribe({
      next: (res) => {
        this.revProfitData.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Error loading financial analytics', 'Dismiss', { duration: 3000 });
        this.isLoading.set(false);
      },
    });
  }

  // --- TAB 1 & 2 STATE HELPERS ---
  onStateSelectedFromMap(state: StatePerformance): void {
    this.openStateDetail(state.stateId);
  }

  openStateDetail(stateId: string): void {
    this.analyticsService.getStateDetail(stateId, this.getCurrentFilter()).subscribe({
      next: (res) => this.activeStateDetail.set(res),
      error: () => this.snackBar.open('Could not load state details', 'Dismiss', { duration: 3000 }),
    });
  }

  closeStateDetail(): void {
    this.activeStateDetail.set(null);
  }

  sortStates(col: string): void {
    if (this.stateSortColumn === col) {
      this.stateSortAsc = !this.stateSortAsc;
    } else {
      this.stateSortColumn = col;
      this.stateSortAsc = false;
    }
  }

  sortedStates(): StatePerformance[] {
    const list = [...this.statesList()];
    list.sort((a: any, b: any) => {
      const vA = a[this.stateSortColumn];
      const vB = b[this.stateSortColumn];
      if (typeof vA === 'string') {
        return this.stateSortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return this.stateSortAsc ? (vA - vB) : (vB - vA);
    });
    return list;
  }

  filteredStatesList(): StatePerformance[] {
    const term = this.stateSearchTerm.trim().toLowerCase();
    if (!term) return this.statesList();
    return this.statesList().filter(
      (s) => s.stateName.toLowerCase().includes(term) || s.stateCode.toLowerCase().includes(term)
    );
  }

  // Charts for Tab 2
  topStatesByRevenueChartItems(): BarChartItem[] {
    const items = this.stateData()?.charts?.top10ByRevenue || [];
    return items.map((s) => ({
      label: s.stateName,
      sublabel: s.stateCode,
      value: s.totalRevenue,
      formattedValue: '₹' + s.totalRevenue.toLocaleString('en-IN'),
      sharePct: s.revenueContributionPct,
    }));
  }

  topStatesByOrdersChartItems(): BarChartItem[] {
    const items = this.stateData()?.charts?.top10ByOrders || [];
    return items.map((s) => ({
      label: s.stateName,
      sublabel: s.stateCode,
      value: s.totalOrders,
      formattedValue: s.totalOrders + ' orders',
    }));
  }

  topStatesByCustomersChartItems(): BarChartItem[] {
    const items = this.stateData()?.charts?.top10ByCustomers || [];
    return items.map((s) => ({
      label: s.stateName,
      sublabel: s.stateCode,
      value: s.totalCustomers,
      formattedValue: s.totalCustomers + ' accounts',
    }));
  }

  topStatesByProfitChartItems(): BarChartItem[] {
    const items = this.stateData()?.charts?.top10ByProfit || [];
    return items.map((s) => ({
      label: s.stateName,
      sublabel: s.stateCode,
      value: s.totalProfit,
      formattedValue: '₹' + s.totalProfit.toLocaleString('en-IN'),
    }));
  }

  stateMonthlyTrendPoints(): TrendPoint[] {
    const trends = this.stateData()?.charts?.monthlyTrendsByState?.[0]?.trends || [];
    return trends.map((t) => ({
      label: t.period,
      value: t.revenue,
      formattedValue: '₹' + t.revenue.toLocaleString('en-IN'),
    }));
  }

  // --- TAB 3 CITY HELPERS ---
  openCityDetail(cityId: string): void {
    this.analyticsService.getCityDetail(cityId, this.getCurrentFilter()).subscribe({
      next: (res) => this.activeCityDetail.set(res),
      error: () => this.snackBar.open('Could not load city details', 'Dismiss', { duration: 3000 }),
    });
  }

  closeCityDetail(): void {
    this.activeCityDetail.set(null);
  }

  sortCities(col: string): void {
    if (this.citySortColumn === col) {
      this.citySortAsc = !this.citySortAsc;
    } else {
      this.citySortColumn = col;
      this.citySortAsc = false;
    }
  }

  filteredCities(): CityPerformance[] {
    const list = [...(this.cityData()?.cities || [])];
    const term = this.citySearchTerm.trim().toLowerCase();
    const filtered = term
      ? list.filter((c) => c.cityName.toLowerCase().includes(term) || c.stateName.toLowerCase().includes(term))
      : list;

    filtered.sort((a: any, b: any) => {
      const vA = a[this.citySortColumn];
      const vB = b[this.citySortColumn];
      if (typeof vA === 'string') {
        return this.citySortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return this.citySortAsc ? (vA - vB) : (vB - vA);
    });
    return filtered;
  }

  topCitiesByRevenueChartItems(): BarChartItem[] {
    const items = this.cityData()?.charts?.top20ByRevenue || [];
    return items.slice(0, 10).map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.totalRevenue,
      formattedValue: '₹' + c.totalRevenue.toLocaleString('en-IN'),
      sharePct: c.revenueContributionPct,
    }));
  }

  topCitiesByOrdersChartItems(): BarChartItem[] {
    const items = this.cityData()?.charts?.top20ByOrders || [];
    return items.slice(0, 10).map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.totalOrders,
      formattedValue: c.totalOrders + ' orders',
    }));
  }

  topCitiesByCustomersChartItems(): BarChartItem[] {
    const items = this.cityData()?.charts?.top20ByCustomers || [];
    return items.slice(0, 10).map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.totalCustomers,
      formattedValue: c.totalCustomers + ' accounts',
    }));
  }

  topCitiesByProfitChartItems(): BarChartItem[] {
    const items = this.cityData()?.charts?.top20ByProfit || [];
    return items.slice(0, 10).map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.totalProfit,
      formattedValue: '₹' + c.totalProfit.toLocaleString('en-IN'),
    }));
  }

  cityMonthlyTrendPoints(): TrendPoint[] {
    const trends = this.cityData()?.charts?.monthlyTrendsByCity?.[0]?.trends || [];
    return trends.map((t) => ({
      label: t.period,
      value: t.revenue,
      formattedValue: '₹' + t.revenue.toLocaleString('en-IN'),
    }));
  }

  // --- TAB 4 PINCODE HELPERS ---
  top20Pincodes(): PincodePerformance[] {
    return this.pincodeData()?.top20Pincodes || [];
  }

  filteredPincodes(): PincodePerformance[] {
    const list = this.pincodeData()?.pincodes || [];
    const term = this.pincodeSearchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (p) =>
        p.postalCode.toLowerCase().includes(term) ||
        p.cityName.toLowerCase().includes(term) ||
        p.stateName.toLowerCase().includes(term)
    );
  }

  // --- TAB 5 CUSTOMER VS ORDER HELPERS ---
  custVsOrdersTable(): CustomerVsOrdersItem[] {
    return this.custVsOrdersData()?.cityComparisonTable || [];
  }

  custVsOrdersByStateChartItems(): BarChartItem[] {
    const items = this.custVsOrdersData()?.charts?.customersVsOrdersByState || [];
    return items.map((s) => ({
      label: s.stateName,
      value: s.customers,
      secondaryValue: s.orders,
      formattedValue: `${s.customers} cust / ${s.orders} ord`,
    }));
  }

  custVsOrdersByCityChartItems(): BarChartItem[] {
    const items = this.custVsOrdersData()?.charts?.customersVsOrdersByCity || [];
    return items.map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.customers,
      secondaryValue: c.orders,
      formattedValue: `${c.customers} cust / ${c.orders} ord`,
    }));
  }

  customerLoyaltyChartItems(): BarChartItem[] {
    const d = this.custVsOrdersData()?.charts?.customerLoyaltyDistribution;
    if (!d) return [];
    return [
      { label: 'Repeat Customers (>= 2 Orders)', value: d.repeatCustomers, color: '#10B981', formattedValue: `${d.repeatCustomers} accounts` },
      { label: 'First-Time Customers (1 Order)', value: d.firstTimeCustomers, color: '#7C3AED', formattedValue: `${d.firstTimeCustomers} accounts` },
      { label: 'Registered Untransacted (0 Orders)', value: d.customersWithoutOrders, color: '#F59E0B', formattedValue: `${d.customersWithoutOrders} accounts` },
    ];
  }

  customersWithoutOrdersChartItems(): BarChartItem[] {
    const items = this.custVsOrdersData()?.charts?.customersWithoutOrdersByCity || [];
    return items.map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.customersWithoutOrders,
      formattedValue: `${c.customersWithoutOrders} untransacted`,
    }));
  }

  repeatPurchaseTrendPoints(): TrendPoint[] {
    const items = this.custVsOrdersData()?.charts?.repeatPurchaseTrends || [];
    return items.map((t) => ({
      label: t.period,
      value: t.estimatedRepeatOrders,
      formattedValue: `${t.estimatedRepeatOrders} repeat orders`,
    }));
  }

  getQuadrantLabel(quadrant: string): string {
    switch (quadrant) {
      case 'HIGH_CUSTOMERS_HIGH_ORDERS': return 'Powerhouse (High Cust + High Ord)';
      case 'HIGH_CUSTOMERS_LOW_ORDERS': return 'Untapped (High Cust + Low Ord)';
      case 'LOW_CUSTOMERS_HIGH_ORDERS': return 'Loyal (Low Cust + High Ord)';
      case 'LOW_CUSTOMERS_LOW_ORDERS': return 'Nascent (Low Cust + Low Ord)';
      default: return quadrant;
    }
  }

  // --- TAB 6 REVENUE & PROFIT HELPERS ---
  financialLedgerRows(): FinancialLedgerRow[] {
    return this.revProfitData()?.financialLedger || [];
  }

  revenueByStateChartItems(): BarChartItem[] {
    const items = this.revProfitData()?.charts?.revenueByState || [];
    return items.map((s) => ({
      label: s.stateName,
      value: s.revenue,
      formattedValue: '₹' + s.revenue.toLocaleString('en-IN'),
      sharePct: s.sharePct,
    }));
  }

  revenueByCityChartItems(): BarChartItem[] {
    const items = this.revProfitData()?.charts?.revenueByCity || [];
    return items.map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.revenue,
      formattedValue: '₹' + c.revenue.toLocaleString('en-IN'),
      sharePct: c.sharePct,
    }));
  }

  profitByStateChartItems(): BarChartItem[] {
    const items = this.revProfitData()?.charts?.profitByState || [];
    return items.map((s) => ({
      label: s.stateName,
      value: s.profit,
      formattedValue: '₹' + s.profit.toLocaleString('en-IN'),
      sharePct: s.marginPct,
    }));
  }

  profitByCityChartItems(): BarChartItem[] {
    const items = this.revProfitData()?.charts?.profitByCity || [];
    return items.map((c) => ({
      label: c.cityName,
      sublabel: c.stateName,
      value: c.profit,
      formattedValue: '₹' + c.profit.toLocaleString('en-IN'),
      sharePct: c.marginPct,
    }));
  }

  revenueContributionChartItems(): BarChartItem[] {
    const items = this.revProfitData()?.charts?.revenueContributionByLocation || [];
    return items.map((i) => ({
      label: i.name,
      value: i.revenue,
      formattedValue: '₹' + i.revenue.toLocaleString('en-IN'),
      sharePct: i.sharePct,
    }));
  }

  monthlyRevenueTrendPoints(): TrendPoint[] {
    const items = this.revProfitData()?.charts?.monthlyRevenueTrends || [];
    return items.map((t) => ({
      label: t.period,
      value: t.revenue,
      formattedValue: '₹' + t.revenue.toLocaleString('en-IN'),
    }));
  }

  monthlyProfitTrendPoints(): TrendPoint[] {
    const items = this.revProfitData()?.charts?.monthlyProfitTrends || [];
    return items.map((t) => ({
      label: t.period,
      value: t.profit,
      formattedValue: '₹' + t.profit.toLocaleString('en-IN'),
    }));
  }

  // --- EXPORT FUNCTIONALITY ---
  exportData(format: 'excel' | 'csv'): void {
    const filter = this.getCurrentFilter();
    this.snackBar.open(`Generating full ${format.toUpperCase()} report...`, 'OK', { duration: 2500 });

    if (format === 'excel') {
      this.analyticsService.downloadExcel(filter).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `DAMIRA_Geographical_Intelligence_${Date.now()}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Excel report downloaded successfully!', 'Dismiss', { duration: 3000 });
        },
        error: () => this.snackBar.open('Excel export failed', 'Dismiss', { duration: 3000 }),
      });
    } else {
      this.analyticsService.downloadCsv(filter).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `DAMIRA_State_Performance_${Date.now()}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('CSV export downloaded successfully!', 'Dismiss', { duration: 3000 });
        },
        error: () => this.snackBar.open('CSV export failed', 'Dismiss', { duration: 3000 }),
      });
    }
  }
}
