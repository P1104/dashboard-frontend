/* eslint-disable @typescript-eslint/no-explicit-any */

import { url } from "../api-url";
import { toast } from "sonner";
import { create } from "zustand";

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

export interface TaskStatus {
  task_id?: string; // Made optional since backend doesn't return it
  status: "pending" | "processing" | "completed" | "failed";
  result?: DashboardBackendResponse; // Backend returns result
  data?: DashboardBackendResponse; // Keep for backward compatibility
}

export class DashboardAPI {
  private baseUrl: string;
  private chatId: string;  // Changed to string
  private messageId: string; // Changed to string

  constructor(baseUrl: string = `${url.backendUrl}`, chatId: string = "1", messageId: string = "0") {
    this.baseUrl = baseUrl;
    this.chatId = chatId;
    this.messageId = messageId;
    console.log("🔧 DashboardAPI initialized with baseUrl:", this.baseUrl);
    console.log("🔧 Initial chatId:", this.chatId);
    console.log("🔧 Initial messageId:", this.messageId);
  }

  // Setter methods to update chat_id and message_id
  setChatId(chatId: string) {
    this.chatId = chatId;
    console.log("📝 Setting chat_id to:", chatId);
  }

  setMessageId(messageId: string) {
    this.messageId = messageId;
    console.log("📝 Setting message_id to:", messageId);
  }

  // Getter methods
  getChatId(): string {
    return this.chatId;
  }

  getMessageId(): string {
    return this.messageId;
  }

  // Helper method to format message_id as U_chatId_0000
  getFormattedMessageId(): string {
    // Parse messageId as number for padding, then convert back to string
    const messageIdNum = parseInt(this.messageId, 10);
    if (isNaN(messageIdNum)) {
      console.warn("⚠️ messageId is not a valid number:", this.messageId);
      return `U_${this.chatId}_${this.messageId}`;
    }
    
    // Format message_id with leading zeros (4 digits)
    const paddedMessageId = messageIdNum.toString().padStart(4, '0');
    return `U_${this.chatId}_${paddedMessageId}`;
  }

  // Increment message_id for new messages
  incrementMessageId() {
    // Parse as number, increment, then convert back to string
    const currentId = parseInt(this.messageId, 10);
    if (isNaN(currentId)) {
      console.warn("⚠️ messageId is not a valid number, resetting to 0:", this.messageId);
      this.messageId = "0";
    } else {
      this.messageId = (currentId + 1).toString();
    }
    console.log("📈 Incremented message_id to:", this.messageId);
    console.log("📊 Formatted message_id:", this.getFormattedMessageId());
  }

  /**
   * Fetch dashboard data from backend
   */
  async fetchDashboardData(
    message: string,
    file_name: string,
  ): Promise<DashboardBackendResponse> {
    console.group("📡 API Call: fetchDashboardData");
    console.log("📤 Request Details:");
    console.log("  - URL:", `${this.baseUrl}/llm/dashboard`);
    console.log("  - Method:", "POST");
    console.log("  - Message:", message);
    console.log("  - File Name:", file_name);
    console.log("  - Chat ID:", this.chatId);
    console.log("  - Raw Message ID:", this.messageId);
    console.log("  - Formatted Message ID:", this.getFormattedMessageId());
    console.log("  - Timestamp:", new Date().toISOString());

    try {
      // Increment message_id for new message
      this.incrementMessageId();
      
      const requestBody = { 
        message, 
        file_name,
        chat_id: this.chatId,
        message_id: this.getFormattedMessageId(), // Use formatted message_id
        title: `Dashboard Query - ${new Date().toLocaleDateString()}`
      };
      console.log("  - Request Body:", JSON.stringify(requestBody, null, 2));

      const startTime = performance.now();
      const getAuthToken = (): string | null => {
        return localStorage.getItem("auth_token");
      };

      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const response = await fetch(`${this.baseUrl}/llm/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log("📥 Response Received:");
      console.log("  - Status:", response.status);
      console.log("  - Status Text:", response.statusText);
      console.log("  - Duration:", `${duration}ms`);
      console.log("  - OK:", response.ok);

      if (!response.ok) {
        console.error("❌ HTTP Error:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      console.log("✅ Raw Response Data:", responseData);
      console.log("  - Type:", typeof responseData);
      console.log("  - Is Array:", Array.isArray(responseData));
      console.log(
        "  - Length:",
        Array.isArray(responseData) ? responseData.length : "N/A",
      );

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
        console.log(
          `📊 Backend returned ${kpis.length} KPIs, ${charts.length} charts`,
        );
      } else {
        console.error("❌ Unexpected response format:", responseData);
        throw new Error("Invalid response format");
      }

      // Log detailed KPI info
      console.log("📊 KPIs Details:");
      kpis.forEach((kpi: KPI, index: number) => {
        console.log(`  - KPI ${index + 1}:`, {
          title: kpi.title,
          value: kpi.value,
          description: kpi.description,
        });
      });

      // Log detailed chart info
      console.log("📈 Charts Details:");
      charts.forEach((chart: ChartOption, index: number) => {
        console.log(`  - Chart ${index + 1}:`, {
          title: chart.title?.text,
          type: chart.series?.[0]?.type,
          dataPoints: chart.series?.[0]?.data?.length || 0,
        });
      });

      console.groupEnd();

      // Return EXACTLY what backend provides (or transformed to our interface)
      return {
        kpis,
        charts,
      };
    } catch (error) {
      console.error("❌ API Call Failed:");
      console.error(
        "  - Error Type:",
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        "  - Error Message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error("  - Stack:", error instanceof Error ? error.stack : "N/A");
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Get task status (for polling)
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    console.group("📡 API Call: getTaskStatus");
    console.log("📤 Request Details:");
    console.log("  - URL:", `${this.baseUrl}/llm/dashboard/${taskId}`);
    console.log("  - Method:", "GET");
    console.log("  - Task ID:", taskId);
    console.log("  - Chat ID:", this.chatId);
    console.log("  - Formatted Message ID:", this.getFormattedMessageId());
    console.log("  - Timestamp:", new Date().toISOString());

    try {
      const startTime = performance.now();
      const getAuthToken = (): string | null => {
        return localStorage.getItem("auth_token");
      };

      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      // Add chat_id and formatted message_id as query parameters
      const urlWithParams = `${this.baseUrl}/llm/dashboard/${taskId}?chat_id=${this.chatId}&message_id=${this.getFormattedMessageId()}`;
      
      const response = await fetch(urlWithParams, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log("📥 Response Received:");
      console.log("  - Status:", response.status);
      console.log("  - Status Text:", response.statusText);
      console.log("  - Duration:", `${duration}ms`);
      console.log("  - OK:", response.ok);

      if (!response.ok) {
        console.error("❌ HTTP Error:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: TaskStatus = await response.json();

      console.log("✅ Task Status Response:", responseData);
      console.log("  - Task ID from response:", responseData.task_id);
      console.log("  - Status:", responseData.status);
      console.log("  - Has Result:", !!responseData.result);
      console.log("  - Has Data:", !!responseData.data);

      if (responseData.result) {
        console.log(
          "  - Result KPIs Count:",
          responseData.result.kpis?.length || 0,
        );
        console.log(
          "  - Result Charts Count:",
          responseData.result.charts?.length || 0,
        );
      }

      if (responseData.data) {
        console.log(
          "  - Data KPIs Count:",
          responseData.data.kpis?.length || 0,
        );
        console.log(
          "  - Data Charts Count:",
          responseData.data.charts?.length || 0,
        );
      }

      console.groupEnd();
      return responseData;
    } catch (error) {
      console.error("❌ API Call Failed:");
      console.error(
        "  - Error Type:",
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        "  - Error Message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error("  - Stack:", error instanceof Error ? error.stack : "N/A");
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Create dashboard task (initial request that returns task ID)
   */
  async createDashboardTask(
    message: string,
    file_name: string,
  ): Promise<{ task_id: string }> {
    console.group("📡 API Call: createDashboardTask");
    console.log("📤 Request Details:");
    console.log("  - URL:", `${this.baseUrl}/llm/dashboard`);
    console.log("  - Method:", "POST");
    console.log("  - Message:", message);
    console.log("  - File Name:", file_name);
    console.log("  - Chat ID:", this.chatId);
    console.log("  - Raw Message ID:", this.messageId);
    console.log("  - Formatted Message ID:", this.getFormattedMessageId());
    console.log("  - Timestamp:", new Date().toISOString());

    try {
      // Increment message_id for new message
      this.incrementMessageId();
      
      const requestBody = { 
        message, 
        file_name,
        chat_id: this.chatId,
        message_id: this.getFormattedMessageId(), // Use formatted message_id
        title: `Dashboard Query - ${new Date().toLocaleDateString()}`
      };
      console.log("  - Request Body:", JSON.stringify(requestBody, null, 2));

      const startTime = performance.now();
      const getAuthToken = (): string | null => {
        return localStorage.getItem("auth_token");
      };

      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const response = await fetch(`${this.baseUrl}/llm/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log("📥 Response Received:");
      console.log("  - Status:", response.status);
      console.log("  - Status Text:", response.statusText);
      console.log("  - Duration:", `${duration}ms`);
      console.log("  - OK:", response.ok);

      if (!response.ok) {
        console.error("❌ HTTP Error:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      console.log("✅ Task Created Response:", responseData);
      console.log("  - Task ID:", responseData.task_id);

      if (!responseData.task_id) {
        console.error("❌ No task_id in response:", responseData);
        throw new Error("No task_id received from server");
      }

      console.groupEnd();
      return { task_id: responseData.task_id };
    } catch (error) {
      console.error("❌ API Call Failed:");
      console.error(
        "  - Error Type:",
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        "  - Error Message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error("  - Stack:", error instanceof Error ? error.stack : "N/A");
      console.groupEnd();
      throw error;
    }
  }
}

export const dashboardAPI = new DashboardAPI();
console.log("✅ Dashboard API instance created");
console.log("📊 Initial formatted message ID:", dashboardAPI.getFormattedMessageId());

interface ChatMessage {
  id: string; // Changed to string
  chat_id: string; // Changed to string
  query: string;
  files: string[];
  response?: DashboardBackendResponse;
  timestamp: Date;
}

interface DashboardState {
  loading: boolean;
  hasData: boolean;
  dashboardData: DashboardBackendResponse;
  currentTaskId: string | null;
  polling: boolean;
  pollIntervalId: NodeJS.Timeout | null;
  currentChatId: string; // Changed to string
  currentMessageId: string; // Changed to string
  chatHistory: ChatMessage[];
  fetchDashboardData: (query: string, file_name: string) => Promise<void>;
  stopPolling: () => void;
  resetDashboard: () => void;
  pollTaskStatus: (taskId: string) => Promise<void>;
  addToChatHistory: (query: string, files: string[], response?: DashboardBackendResponse) => void;
  startNewChat: () => void;
  loadChat: (chatId: string) => void; // Changed to string
  getCurrentQuery: () => string;
  getCurrentFiles: () => string[];
  setCurrentQueryAndFiles: (query: string, files: string[]) => void;
}

const INITIAL_DASHBOARD_DATA: DashboardBackendResponse = {
  kpis: [],
  charts: [],
};

// Temporary storage for current query and files during polling
let currentQueryCache = "";
let currentFilesCache: string[] = [];

export const useDashboardStore = create<DashboardState>((set, get) => ({
  loading: false,
  hasData: false,
  dashboardData: INITIAL_DASHBOARD_DATA,
  currentTaskId: null,
  polling: false,
  pollIntervalId: null,
  currentChatId: "1", // Start with chat_id = "1" as string
  currentMessageId: "0", // Start with message_id = "0" as string
  chatHistory: [],

  fetchDashboardData: async (query: string, file_name: string) => {
    console.log("🔄 Starting to fetch dashboard data for query:", query);
    console.log("📁 File names being sent:", file_name);
    console.log("📊 Current formatted message ID:", dashboardAPI.getFormattedMessageId());
    
    // Store current query and files for chat history
    currentQueryCache = query;
    currentFilesCache = file_name.split(',');
    
    // Update the API instance with current chat_id and message_id
    dashboardAPI.setChatId(get().currentChatId);
    dashboardAPI.setMessageId(get().currentMessageId);
    
    set({ loading: true, hasData: false });

    try {
      // Step 1: Create task and get task ID
      console.log("📞 Creating dashboard task...");
      const { task_id } = await dashboardAPI.createDashboardTask(
        query,
        file_name,
      );

      console.log("✅ Task created with ID:", task_id);

      // Step 2: Store task ID and start polling
      set({
        currentTaskId: task_id,
        polling: true,
        loading: false, // We're not loading anymore, we're polling
      });

      // Step 3: Start polling for this task
      get().pollTaskStatus(task_id);
    } catch (error) {
      console.error("❌ Error creating dashboard task:", error);

      // NO FALLBACK DATA - just set empty state
      console.log("⚠️ Task creation failed, setting empty state");
      set({
        dashboardData: INITIAL_DASHBOARD_DATA,
        hasData: false,
        loading: false,
        polling: false,
        currentTaskId: null,
      });

      // Show error to user
      toast.error(
        error instanceof Error ? error.message : "Failed to create task",
        {
          duration: 3000,
          position: "top-center",
        },
      );
    }
  },

  pollTaskStatus: async (taskId: string) => {
    const poll = async () => {
      const { polling } = get();
      if (!polling) {
        console.log("🛑 Polling stopped for task:", taskId);
        return;
      }

      try {
        console.log("🔍 Polling task status for:", taskId);
        console.log("📊 Current formatted message ID:", dashboardAPI.getFormattedMessageId());
        const taskStatus = await dashboardAPI.getTaskStatus(taskId);

        console.log("📊 Task Status Update:", {
          taskId: taskId,
          status: taskStatus.status,
          hasResult: !!taskStatus.result,
          hasData: !!taskStatus.data,
        });

        switch (taskStatus.status) {
          case "completed":
            console.log("✅ Task completed successfully!");
            // Check both result and data fields
            const dashboardResult = taskStatus.result || taskStatus.data;
            
            if (dashboardResult) {
              console.log("📊 Dashboard data received:", {
                kpisCount: dashboardResult.kpis?.length || 0,
                chartsCount: dashboardResult.charts?.length || 0,
              });
              
              set({
                dashboardData: dashboardResult,
                hasData: true,
                loading: false,
                polling: false,
                currentTaskId: null,
              });
              
              // Add to chat history using cached query and files
              if (currentQueryCache && currentFilesCache.length > 0) {
                get().addToChatHistory(
                  currentQueryCache,
                  currentFilesCache,
                  dashboardResult
                );
              }
              
              toast.success("Dashboard generated successfully!", {
                duration: 3000,
                position: "top-center",
              });
            } else {
              console.error("❌ Task completed but no result/data found");
              console.error("Task status response:", taskStatus);
              
              set({
                dashboardData: INITIAL_DASHBOARD_DATA,
                hasData: false,
                loading: false,
                polling: false,
                currentTaskId: null,
              });
              toast.error("Task completed but no data received", {
                duration: 3000,
                position: "top-center",
              });
            }
            break;

          case "failed":
            console.error("❌ Task failed");
            set({
              dashboardData: INITIAL_DASHBOARD_DATA,
              hasData: false,
              loading: false,
              polling: false,
              currentTaskId: null,
            });
            toast.error("Task processing failed", {
              duration: 3000,
              position: "top-center",
            });
            break;

          case "pending":
          case "processing":
            console.log("⏳ Task still processing:", taskStatus.status);
            // Continue polling after 10 seconds
            setTimeout(() => {
              if (get().polling && get().currentTaskId === taskId) {
                get().pollTaskStatus(taskId);
              }
            }, 10000);
            break;

          default:
            console.warn("⚠️ Unknown task status:", taskStatus.status);
            // Continue polling after 10 seconds
            setTimeout(() => {
              if (get().polling && get().currentTaskId === taskId) {
                get().pollTaskStatus(taskId);
              }
            }, 10000);
            break;
        }
      } catch (error) {
        console.error("❌ Error polling task status:", error);
        set({
          dashboardData: INITIAL_DASHBOARD_DATA,
          hasData: false,
          loading: false,
          polling: false,
          currentTaskId: null,
        });
        toast.error("Failed to check task status", {
          duration: 3000,
          position: "top-center",
        });
      }
    };

    // Start polling
    poll();
  },

  // Add new message to chat history
  addToChatHistory: (query: string, files: string[], response?: DashboardBackendResponse) => {
    set((state) => {
      // Convert messageId to number, increment, then back to string
      const currentId = parseInt(state.currentMessageId, 10);
      const newMessageId = isNaN(currentId) ? "1" : (currentId + 1).toString();
      
      const newMessage: ChatMessage = {
        id: newMessageId,
        chat_id: state.currentChatId,
        query,
        files,
        response,
        timestamp: new Date(),
      };

      console.log("💾 Adding to chat history:", {
        chat_id: state.currentChatId,
        message_id: newMessageId,
        formatted_message_id: dashboardAPI.getFormattedMessageId(),
        query,
        files: files.length,
        hasResponse: !!response
      });

      return {
        currentMessageId: newMessageId,
        chatHistory: [...state.chatHistory, newMessage],
      };
    });
  },

  // Start a new chat session
  startNewChat: () => {
    set((state) => {
      // Convert chatId to number, increment, then back to string
      const currentChatId = parseInt(state.currentChatId, 10);
      const newChatId = isNaN(currentChatId) ? "2" : (currentChatId + 1).toString();
      
      // Reset message counter for new chat
      dashboardAPI.setChatId(newChatId);
      dashboardAPI.setMessageId("0");
      
      console.log("🆕 Starting new chat session:", {
        old_chat_id: state.currentChatId,
        new_chat_id: newChatId,
        old_formatted_message_id: dashboardAPI.getFormattedMessageId(),
        new_formatted_message_id: `U_${newChatId}_0000`
      });

      return {
        currentChatId: newChatId,
        currentMessageId: "0",
        chatHistory: [],
        hasData: false,
        dashboardData: INITIAL_DASHBOARD_DATA,
        loading: false,
        polling: false,
        currentTaskId: null,
      };
    });
    
    // Clear cache
    currentQueryCache = "";
    currentFilesCache = [];
    
    toast.success("Started new chat session", {
      duration: 2000,
      position: "top-center",
    });
  },

  // Load a specific chat from history
  loadChat: (chatId: string) => {
    const state = get();
    const chatMessages = state.chatHistory.filter(msg => msg.chat_id === chatId);
    
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      
      // Update API instance
      dashboardAPI.setChatId(chatId);
      dashboardAPI.setMessageId(lastMessage.id);
      
      console.log("📂 Loading chat:", {
        chat_id: chatId,
        message_id: lastMessage.id,
        formatted_message_id: dashboardAPI.getFormattedMessageId(),
        total_messages: chatMessages.length
      });

      set({
        currentChatId: chatId,
        currentMessageId: lastMessage.id,
        dashboardData: lastMessage.response || INITIAL_DASHBOARD_DATA,
        hasData: !!lastMessage.response,
      });
      
      toast.success(`Loaded chat #${chatId}`, {
        duration: 2000,
        position: "top-center",
      });
    } else {
      console.warn("No messages found for chat_id:", chatId);
    }
  },

  // Get current query (for debugging)
  getCurrentQuery: () => currentQueryCache,
  
  // Get current files (for debugging)
  getCurrentFiles: () => currentFilesCache,
  
  // Set current query and files (for manual updates)
  setCurrentQueryAndFiles: (query: string, files: string[]) => {
    currentQueryCache = query;
    currentFilesCache = files;
  },

  stopPolling: () => {
    console.log("🛑 Stopping polling");
    set({
      polling: false,
      currentTaskId: null,
      loading: false,
    });
    toast.info("Polling stopped", {
      duration: 2000,
      position: "top-center",
    });
  },

  resetDashboard: () => {
    console.log("🔄 Resetting dashboard state");
    set({
      hasData: false,
      dashboardData: INITIAL_DASHBOARD_DATA,
      loading: false,
      polling: false,
      currentTaskId: null,
    });
  },
}));