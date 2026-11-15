import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AnalyticsFilter,
  KpiSummary,
  StatePerformanceResponse,
  StateDetailResponse,
  CityPerformanceResponse,
  CityDetailResponse,
  PincodePerformanceResponse,
  CustomerVsOrdersResponse,
  RevenueProfitResponse,
  ProductDemandResponse,
  SalesChannelItem,
  GrowthTrendItem,
  MarketOpportunitiesResponse,
  FilterMetadata,
} from '../models/market-intelligence.model';

@Injectable({
  providedIn: 'root',
})
export class MarketIntelligenceService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/analytics`;

  private buildParams(filter?: AnalyticsFilter): HttpParams {
    let params = new HttpParams();
    if (!filter) return params;

    Object.keys(filter).forEach((key) => {
      const val = (filter as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return params;
  }

  // 1. Overview / KPIs
  getGeographyOverview(filter?: AnalyticsFilter): Observable<KpiSummary> {
    return this.http.get<KpiSummary>(`${this.API_URL}/geography/overview`, {
      params: this.buildParams(filter),
    });
  }

  getKpis(filter?: AnalyticsFilter): Observable<KpiSummary> {
    return this.getGeographyOverview(filter);
  }

  // 2. State Performance & Detail
  getStatePerformance(filter?: AnalyticsFilter): Observable<StatePerformanceResponse> {
    return this.http.get<StatePerformanceResponse>(`${this.API_URL}/geography/states`, {
      params: this.buildParams(filter),
    });
  }

  getStateDetail(stateId: string, filter?: AnalyticsFilter): Observable<StateDetailResponse> {
    return this.http.get<StateDetailResponse>(`${this.API_URL}/geography/states/${stateId}`, {
      params: this.buildParams(filter),
    });
  }

  // 3. City Performance & Detail
  getCityPerformance(filter?: AnalyticsFilter): Observable<CityPerformanceResponse> {
    return this.http.get<CityPerformanceResponse>(`${this.API_URL}/geography/cities`, {
      params: this.buildParams(filter),
    });
  }

  getCityDetail(cityId: string, filter?: AnalyticsFilter): Observable<CityDetailResponse> {
    return this.http.get<CityDetailResponse>(`${this.API_URL}/geography/cities/${cityId}`, {
      params: this.buildParams(filter),
    });
  }

  // 4. Pincode / Area Analytics
  getPincodePerformance(filter?: AnalyticsFilter): Observable<PincodePerformanceResponse> {
    return this.http.get<PincodePerformanceResponse>(`${this.API_URL}/geography/pincodes`, {
      params: this.buildParams(filter),
    });
  }

  // 5. Customer vs Order Conversion
  getCustomerOrderAnalysis(filter?: AnalyticsFilter): Observable<CustomerVsOrdersResponse> {
    return this.http.get<CustomerVsOrdersResponse>(`${this.API_URL}/geography/customer-order-analysis`, {
      params: this.buildParams(filter),
    });
  }

  // 6. Revenue & Profit Analysis
  getRevenueProfitAnalysis(filter?: AnalyticsFilter): Observable<RevenueProfitResponse> {
    return this.http.get<RevenueProfitResponse>(`${this.API_URL}/geography/revenue-profit`, {
      params: this.buildParams(filter),
    });
  }

  // 7. Product Demand
  getProductDemand(filter?: AnalyticsFilter): Observable<ProductDemandResponse> {
    return this.http.get<ProductDemandResponse>(`${this.API_URL}/geography/product-demand`, {
      params: this.buildParams(filter),
    });
  }

  // 8. Sales Channels
  getSalesChannels(filter?: AnalyticsFilter): Observable<{ channels: SalesChannelItem[] }> {
    return this.http.get<{ channels: SalesChannelItem[] }>(`${this.API_URL}/geography/sales-channels`, {
      params: this.buildParams(filter),
    });
  }

  // 9. Growth Trends
  getGrowthTrends(filter?: AnalyticsFilter): Observable<{ trends: GrowthTrendItem[] }> {
    return this.http.get<{ trends: GrowthTrendItem[] }>(`${this.API_URL}/geography/trends`, {
      params: this.buildParams(filter),
    });
  }

  // 10. Market Opportunities
  getMarketOpportunities(filter?: AnalyticsFilter): Observable<MarketOpportunitiesResponse> {
    return this.http.get<MarketOpportunitiesResponse>(`${this.API_URL}/geography/market-opportunities`, {
      params: this.buildParams(filter),
    });
  }

  // 11. Global Filters Master Data
  getFilterMetadata(): Observable<FilterMetadata> {
    return this.http.get<FilterMetadata>(`${this.API_URL}/geography/filters-metadata`);
  }

  // 12. Export Excel (.xlsx)
  downloadExcel(filter?: AnalyticsFilter): Observable<Blob> {
    return this.http.get(`${this.API_URL}/geography/export/excel`, {
      params: this.buildParams(filter),
      responseType: 'blob',
    });
  }

  // 13. Export CSV
  downloadCsv(filter?: AnalyticsFilter): Observable<Blob> {
    return this.http.get(`${this.API_URL}/geography/export/csv`, {
      params: this.buildParams(filter),
      responseType: 'blob',
    });
  }
}
