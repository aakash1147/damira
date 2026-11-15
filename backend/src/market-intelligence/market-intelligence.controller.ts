import {
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { MarketIntelligenceService } from './market-intelligence.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@ApiTags('Market Intelligence & Geographical Analytics')
@ApiBearerAuth('bearer-jwt')
@Controller('analytics')
export class MarketIntelligenceController {
  constructor(
    private readonly analyticsService: MarketIntelligenceService,
  ) {}

  // 1. Overview / KPIs
  @Get('geography/overview')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Geographical commercial overview & core KPI summary' })
  async getGeographyOverview(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getGeographyOverview(filter);
  }

  @Get('kpis')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Overall KPI card metrics with geo, date, and channel filters (alias)' })
  async getKpis(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getGeographyOverview(filter);
  }

  // 2. Map Data
  @Get('geography/map')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'State-level choropleth intensity data for India Map' })
  async getMapData(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getStatePerformance(filter);
  }

  // 3. States & State Detail
  @Get('geography/states')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'State-wise commercial performance, top 10 charts, and monthly trends' })
  async getStates(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getStatePerformance(filter);
  }

  @Get('states')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'State performance (alias)' })
  async getStatesAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getStatePerformance(filter);
  }

  @Get('geography/states/:stateId')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Detailed state profile drilldown with cities, pincodes, and trends' })
  async getStateDetail(
    @Param('stateId') stateId: string,
    @Query() filter: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getStateDetail(stateId, filter);
  }

  // 4. Cities & City Detail
  @Get('geography/cities')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'City-level commercial performance, top 20 charts, and monthly trends' })
  async getCities(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getCityPerformance(filter);
  }

  @Get('cities')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'City performance (alias)' })
  async getCitiesAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getCityPerformance(filter);
  }

  @Get('geography/cities/:cityId')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Detailed city profile drilldown with pincodes, channels, and SKU velocity' })
  async getCityDetail(
    @Param('cityId') cityId: string,
    @Query() filter: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getCityDetail(cityId, filter);
  }

  // 5. Pincodes
  @Get('geography/pincodes')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Pincode / Locality business density, repeat stats, and geo coordinates' })
  async getPincodes(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getPincodePerformance(filter);
  }

  @Get('pincodes')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Pincode performance (alias)' })
  async getPincodesAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getPincodePerformance(filter);
  }

  // 6. Customer vs Order Conversion
  @Get('geography/customer-order-analysis')
  @RequirePermissions('ANALYTICS:VIEW_CUSTOMERS')
  @ApiOperation({ summary: 'Customer concentration vs actual purchasing activity with 5 chart datasets' })
  async getCustomerOrderAnalysis(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getCustomerOrderAnalysis(filter);
  }

  @Get('customer-vs-orders')
  @RequirePermissions('ANALYTICS:VIEW_CUSTOMERS')
  @ApiOperation({ summary: 'Customer vs orders analysis (alias)' })
  async getCustomerVsOrdersAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getCustomerOrderAnalysis(filter);
  }

  // 7. Revenue & Profit Analysis
  @Get('geography/revenue-profit')
  @RequirePermissions('ANALYTICS:VIEW_FINANCIAL')
  @ApiOperation({ summary: 'Comprehensive gross-to-net waterfall revenue & profit with 7 chart datasets' })
  async getRevenueProfitAnalysis(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getRevenueProfitAnalysis(filter);
  }

  @Get('revenue-profit')
  @RequirePermissions('ANALYTICS:VIEW_FINANCIAL')
  @ApiOperation({ summary: 'Revenue profit analysis (alias)' })
  async getRevenueProfitAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getRevenueProfitAnalysis(filter);
  }

  // 8. Product Demand
  @Get('geography/product-demand')
  @RequirePermissions('ANALYTICS:VIEW_PRODUCTS')
  @ApiOperation({ summary: 'Geographical product demand and SKU/variant sales velocity' })
  async getProductDemand(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getProductDemand(filter);
  }

  @Get('product-demand')
  @RequirePermissions('ANALYTICS:VIEW_PRODUCTS')
  @ApiOperation({ summary: 'Product demand (alias)' })
  async getProductDemandAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getProductDemand(filter);
  }

  // 9. Sales Channels
  @Get('geography/sales-channels')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Sales channel performance breakdown across Indian states' })
  async getSalesChannels(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getSalesChannels(filter);
  }

  @Get('sales-channels')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Sales channels (alias)' })
  async getSalesChannelsAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getSalesChannels(filter);
  }

  // 10. Growth Trends
  @Get('geography/trends')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Time-series growth trends (MoM customer acquisition & revenue)' })
  async getTrends(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getGrowthTrends(filter);
  }

  @Get('trends')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Trends (alias)' })
  async getTrendsAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getGrowthTrends(filter);
  }

  // 11. Market Opportunities
  @Get('geography/market-opportunities')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Automated decision support recommendations for management' })
  async getOpportunities(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getMarketOpportunities(filter);
  }

  @Get('market-opportunities')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Market opportunities (alias)' })
  async getOpportunitiesAlias(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getMarketOpportunities(filter);
  }

  // 12. Dynamic Filter Master Data
  @Get('geography/filters-metadata')
  @RequirePermissions('ANALYTICS:VIEW_GEO')
  @ApiOperation({ summary: 'Dynamic dropdown options for global filter drawer' })
  async getFilterMetadata() {
    return this.analyticsService.getFilterMasterData();
  }

  // 13. Multi-Tab Excel Export
  @Get('geography/export/excel')
  @RequirePermissions('ANALYTICS:EXPORT')
  @ApiOperation({ summary: 'Export full 6-tab geographic & product intelligence report to Excel (.xlsx)' })
  async exportExcel(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    const buffer = await this.analyticsService.exportToExcel(filter);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DAMIRA_Geographical_Intelligence_${Date.now()}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('export/excel')
  @RequirePermissions('ANALYTICS:EXPORT')
  @ApiOperation({ summary: 'Excel export (alias)' })
  async exportExcelAlias(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    return this.exportExcel(filter, res);
  }

  // 14. CSV Export
  @Get('geography/export/csv')
  @RequirePermissions('ANALYTICS:EXPORT')
  @ApiOperation({ summary: 'Export state performance report to CSV' })
  async exportCsv(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    const csv = await this.analyticsService.exportToCsv(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DAMIRA_State_Performance_${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Get('export/csv')
  @RequirePermissions('ANALYTICS:EXPORT')
  @ApiOperation({ summary: 'CSV export (alias)' })
  async exportCsvAlias(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    return this.exportCsv(filter, res);
  }
}
