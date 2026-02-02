// src/components/dashboard/QueryInput.tsx

"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Loader2, Sparkles } from "lucide-react";
import { useDashboardStore } from "@/src/services/api/dashboard/dashboard-store";

export function QueryInput() {
  const [query, setQuery] = useState("");
  const { fetchDashboardData, loading } = useDashboardStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    await fetchDashboardData(query.trim());
    // Don't clear input so user can see what they asked
  };

  const quickQueries = [
    "Plot a sales Dashboard",
    "Show me product performance",
    "Analyze branch sales",
  ];

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    fetchDashboardData(quickQuery);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-6 space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask for a sales dashboard (e.g., 'Plot a sales Dashboard')"
          className="flex-1 text-base h-12 px-4 border-2 border-slate-200 focus:border-indigo-500"
          disabled={loading}
        />
        <Button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </form>

      {/* Quick Query Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-600 flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          Quick queries:
        </span>
        {quickQueries.map((q, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleQuickQuery(q)}
            disabled={loading}
            className="text-sm border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}