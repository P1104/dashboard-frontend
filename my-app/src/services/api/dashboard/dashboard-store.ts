import { create } from "zustand";
import { dashboardAPI, DashboardBackendResponse } from "./dashboard-api";

interface DashboardState {
  loading: boolean;
  hasData: boolean;
  dashboardData: DashboardBackendResponse;
  fetchDashboardData: (query: string) => Promise<void>;
  resetDashboard: () => void;
}

const INITIAL_DASHBOARD_DATA: DashboardBackendResponse = {
  kpis: [],
  charts: []
};

export const useDashboardStore = create<DashboardState>((set) => ({
  loading: false,
  hasData: false,
  dashboardData: INITIAL_DASHBOARD_DATA,

  fetchDashboardData: async (query: string) => {
    console.log('🔄 Starting to fetch dashboard data for query:', query);
    set({ loading: true, hasData: false });
    
    try {
      // Call actual API - NO FALLBACK DATA
      console.log('📞 Calling backend API...');
      const data = await dashboardAPI.fetchDashboardData(query);
      
      console.log('✅ API call successful, updating store with data');
      set({ 
        dashboardData: data,
        hasData: true,
        loading: false 
      });
      
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      
      // NO FALLBACK DATA - just set empty state
      console.log('⚠️ API call failed, setting empty state');
      set({ 
        dashboardData: INITIAL_DASHBOARD_DATA,
        hasData: false,
        loading: false 
      });
      
      // Show error to user
      throw error;
    }
  },

  resetDashboard: () => {
    console.log('🔄 Resetting dashboard state');
    set({
      hasData: false,
      dashboardData: INITIAL_DASHBOARD_DATA,
      loading: false
    });
  }
}));