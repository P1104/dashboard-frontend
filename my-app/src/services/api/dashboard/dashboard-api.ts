/* eslint-disable @typescript-eslint/no-explicit-any */

import { url } from "../api-url";

export interface KPI {
  title: string;
  value: string;
  description: string;
}

export interface ChartOption {
  title: { text: string; left: string };
  tooltip: any;
  legend?: any;
  xAxis?: any;
  yAxis?: any;
  series: any[];
  [key: string]: any;
}

export interface DashboardBackendResponse {
  kpis: KPI[];
  charts: ChartOption[];
}

export class DashboardAPI {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.117:8001' || `${url.backendUrl}`) {
    this.baseUrl = baseUrl;
    console.log('🔧 DashboardAPI initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Fetch dashboard data from backend
   */
  async fetchDashboardData(message: string): Promise<DashboardBackendResponse> {
    console.group('📡 API Call: fetchDashboardData');
    console.log('📤 Request Details:');
    console.log('  - URL:', `${this.baseUrl}/dashboard`);
    console.log('  - Method:', 'POST');
    console.log('  - Message:', message);
    console.log('  - Timestamp:', new Date().toISOString());
    
    try {
      const requestBody = { message };
      console.log('  - Request Body:', JSON.stringify(requestBody, null, 2));
      
      const startTime = performance.now();
      
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log('📥 Response Received:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Duration:', `${duration}ms`);
      console.log('  - OK:', response.ok);

      if (!response.ok) {
        console.error('❌ HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      console.log('✅ Raw Response Data:', responseData);
      console.log('  - Type:', typeof responseData);
      console.log('  - Is Array:', Array.isArray(responseData));
      console.log('  - Length:', Array.isArray(responseData) ? responseData.length : 'N/A');
      
      // Handle different response formats from backend
      let kpis: KPI[] = [];
      let charts: ChartOption[] = [];
      
      if (Array.isArray(responseData)) {
        // Backend returns array of KPIs (no charts yet)
        // We'll accept this and frontend will handle empty charts
        kpis = responseData;
        charts = []; // Empty charts array - frontend will handle this
        console.log(`📊 Backend returned ${kpis.length} KPIs, 0 charts`);
      } else if (responseData.kpis && responseData.charts) {
        // Backend returns structured object with both kpis and charts
        kpis = responseData.kpis;
        charts = responseData.charts;
        console.log(`📊 Backend returned ${kpis.length} KPIs, ${charts.length} charts`);
      } else {
        console.error('❌ Unexpected response format:', responseData);
        throw new Error('Invalid response format');
      }
      
      // Log detailed KPI info
      console.log('📊 KPIs Details:');
      kpis.forEach((kpi: KPI, index: number) => {
        console.log(`  - KPI ${index + 1}:`, {
          title: kpi.title,
          value: kpi.value,
          description: kpi.description
        });
      });
      
      // Log detailed chart info
      console.log('📈 Charts Details:');
      charts.forEach((chart: ChartOption, index: number) => {
        console.log(`  - Chart ${index + 1}:`, {
          title: chart.title?.text,
          type: chart.series?.[0]?.type,
          dataPoints: chart.series?.[0]?.data?.length || 0
        });
      });
      
      console.groupEnd();
      
      // Return EXACTLY what backend provides (or transformed to our interface)
      return {
        kpis,
        charts
      };
    } catch (error) {
      console.error('❌ API Call Failed:');
      console.error('  - Error Type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('  - Error Message:', error instanceof Error ? error.message : String(error));
      console.error('  - Stack:', error instanceof Error ? error.stack : 'N/A');
      console.groupEnd();
      throw error;
    }
  }
}

export const dashboardAPI = new DashboardAPI();
console.log('✅ Dashboard API instance created');