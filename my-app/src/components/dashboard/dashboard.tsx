/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";
import React, { useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Toaster } from "../ui/sonner";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  BarChart,
  FileText,
  Printer,
  Download,
  Upload,
  FileSpreadsheet,
  Globe,
  X,
  File,
  ArrowLeft,
} from "lucide-react";

import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useDashboardStore } from "@/src/services/api/dashboard/dashboard-store";
import { QueryInput } from "@/src/components/dashboard/QueryInput";

const SequentialLoader = () => {
  const messages = [
    "Preparing dashboard...",
    "Loading data...",
    "Almost there...",
    "Please wait ⏳",
  ];
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="text-slate-500 text-sm font-medium">{messages[step]}</p>
    </div>
  );
};

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export function SalesDashboard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { loading, hasData, dashboardData, fetchDashboardData, resetDashboard } = useDashboardStore();

  console.log('📊 Dashboard State:', {
    loading,
    hasData,
    kpisCount: dashboardData.kpis?.length || 0,
    chartsCount: dashboardData.charts?.length || 0,
    dashboardData: dashboardData
  });

  // Dynamic chart rendering function - ALL CONTENT FROM BACKEND
 // Update the renderChart function to handle doughnut charts
const renderChart = (chartOption: any, index: number) => {
  console.log(`📈 Rendering chart ${index}:`, {
    title: chartOption.title?.text,
    seriesType: chartOption.series?.[0]?.type,
    dataLength: chartOption.series?.[0]?.data?.length
  });
  
  // Fix chart option if it has doughnut type (ECharts uses pie with radius)
  const fixedChartOption = { ...chartOption };
  
  if (fixedChartOption.series) {
    fixedChartOption.series = fixedChartOption.series.map((series: any) => {
      if (series.type === 'doughnut') {
        return {
          ...series,
          type: 'pie',
          radius: ['40%', '70%'] // This creates a doughnut effect
        };
      }
      return series;
    });
  }
  
  return (
    <Card key={index} className="shadow-sm chart-container">
      <CardHeader>
        {/* Chart Title from backend */}
        <CardTitle>{fixedChartOption.title?.text || `Chart ${index + 1}`}</CardTitle>
        {/* Chart Description can be derived from tooltip or other properties */}
        <CardDescription>
          {fixedChartOption.tooltip?.formatter 
            ? `Interactive chart showing ${fixedChartOption.title?.text?.toLowerCase() || 'data'}`
            : "Data visualization"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts 
          option={fixedChartOption} 
          style={{ height: "400px" }} 
          opts={{ renderer: 'canvas' }}
        />
      </CardContent>
    </Card>
  );
};

  // Dynamic KPI card rendering - ALL CONTENT FROM BACKEND
  const renderKPICard = (kpi: any, index: number) => {
    console.log(`📊 Rendering KPI ${index}:`, kpi);
    
    // Determine badge based on KPI title from backend
    let badgeVariant: "secondary" | "outline" | "default" | "destructive" = "secondary";
    let badgeIcon = "📊";
    
    if (kpi.title.includes("Sales") || kpi.title.includes("Revenue")) {
      badgeVariant = "secondary";
      badgeIcon = "₹";
    } else if (kpi.title.includes("Transaction") || kpi.title.includes("Count")) {
      badgeVariant = "outline";
      badgeIcon = "#";
    } else if (kpi.title.includes("Rating") || kpi.title.includes("Score")) {
      badgeVariant = "default";
      badgeIcon = "⭐";
    } else if (kpi.title.includes("Profit") || kpi.title.includes("Income") || kpi.title.includes("Margin")) {
      badgeVariant = "destructive";
      badgeIcon = "💰";
    }

    return (
      <Card key={index} className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* KPI Title from backend */}
          <CardTitle className="text-sm font-medium text-slate-600">{kpi.title}</CardTitle>
          <Badge variant={badgeVariant}>{badgeIcon}</Badge>
        </CardHeader>
        <CardContent>
          {/* KPI Value from backend */}
          <div className="text-2xl font-bold text-black">{kpi.value}</div>
          {/* KPI Description from backend */}
          <p className="text-xs text-muted-foreground">{kpi.description}</p>
        </CardContent>
      </Card>
    );
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const showSuccessMessage = (format: string) => {
    toast.success(`${format} downloaded successfully!`, {
      duration: 3000,
      position: "top-center",
    });
  };

  const handleHTMLExport = () => {
    try {
      const { kpis, charts } = dashboardData;
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supermarket Sales Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      padding: 20px;
      color: #1e293b;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 2.5rem; text-align: center; margin-bottom: 10px; color: #1e293b; }
    .subtitle { text-align: center; color: #64748b; margin-bottom: 30px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .kpi-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .kpi-title { font-size: 0.875rem; color: #64748b; margin-bottom: 8px; }
    .kpi-value { font-size: 1.875rem; font-weight: bold; color: #1e293b; }
    .section { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 15px; color: #1e293b; }
    .chart-container { 
      margin: 20px 0; 
      padding: 20px; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
    }
    .chart-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 10px; color: #1e293b; }
    .footer { text-align: center; color: #94a3b8; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Supermarket Sales Dashboard</h1>
    <p class="subtitle">Comprehensive sales analytics and performance insights</p>
    
    <div class="kpi-grid">
      ${kpis.map(kpi => `
        <div class="kpi-card">
          <div class="kpi-title">${kpi.title}</div>
          <div class="kpi-value">${kpi.value}</div>
          <p class="kpi-description">${kpi.description}</p>
        </div>
      `).join('')}
    </div>

    ${charts.map((chart, index) => `
      <div class="section">
        <h2 class="section-title">${chart.title?.text || `Chart ${index + 1}`}</h2>
        <div class="chart-container">
          <!-- Chart ${index + 1}: ${chart.title?.text} -->
          <p><em>Note: Charts are rendered dynamically in the application. This HTML export contains data summaries only.</em></p>
          ${chart.series && chart.series[0] && chart.series[0].data ? `
            <p>Data Points: ${JSON.stringify(chart.series[0].data)}</p>
          ` : ''}
        </div>
      </div>
    `).join('')}

    <div class="footer">
      Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    </div>
  </div>
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: "text/html" });
      downloadFile(blob, `Supermarket-Sales-Dashboard-${Date.now()}.html`);
      showSuccessMessage("HTML");
    } catch (error) {
      console.error("HTML export failed:", error);
      toast.error("Failed to export HTML. Please try again.", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  const handleExcelExport = async () => {
    try {
      setIsExporting(true);
      
      const { kpis, charts } = dashboardData;
      
      const wb = XLSX.utils.book_new();
      
      // Dashboard Summary Sheet
      const summaryData = [
        ["SUPERMARKET SALES DASHBOARD"],
        [],
        ["KEY PERFORMANCE INDICATORS"],
        ...kpis.map(kpi => [kpi.title, kpi.value, kpi.description]),
        [],
        ["CHART SUMMARIES"],
      ];
      
      charts.forEach((chart, index) => {
        summaryData.push([]);
        summaryData.push([chart.title?.text || `Chart ${index + 1}`]);
        
        if (chart.series && chart.series[0] && chart.series[0].data) {
          summaryData.push(["Data Points:"]);
          chart.series[0].data.forEach((item: any) => {
            if (typeof item === 'object') {
              summaryData.push([item.name || 'Item', item.value || 'Value']);
            } else {
              summaryData.push([`Data Point`, item]);
            }
          });
        }
      });
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Style the summary sheet
      summarySheet['!cols'] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 40 }
      ];
      
      XLSX.utils.book_append_sheet(wb, summarySheet, "Dashboard Summary");
      
      XLSX.writeFile(wb, `Supermarket-Sales-Dashboard-${Date.now()}.xlsx`);
      showSuccessMessage("Excel");
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to export Excel. Please try again.", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async (format: "jpeg" | "png" | "pdf" | "print" | "excel" | "html") => {
    if (!cardRef.current) return;

    if (format === "excel") {
      handleExcelExport();
      setShowDownloadMenu(false);
      return;
    }

    if (format === "html") {
      handleHTMLExport();
      setShowDownloadMenu(false);
      return;
    }

    setIsExporting(true);
    setShowDownloadMenu(false);

    try {
      switch (format) {
        case "jpeg":
        case "png": {
          const dataUrl =
            format === "png"
              ? await htmlToImage.toPng(cardRef.current, {
                  quality: 0.95,
                  backgroundColor: "#ffffff",
                  pixelRatio: 2,
                })
              : await htmlToImage.toJpeg(cardRef.current, {
                  quality: 0.95,
                  backgroundColor: "#ffffff",
                  pixelRatio: 2,
                });

          const blob = await (await fetch(dataUrl)).blob();
          const filename = `Supermarket-Dashboard-${Date.now()}.${format === "png" ? "png" : "jpg"}`;

          downloadFile(blob, filename);
          showSuccessMessage(format.toUpperCase());
          break;
        }

        case "pdf": {
          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
          });

          const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
            quality: 0.9,
            backgroundColor: "#ffffff",
            pixelRatio: 1.5,
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Supermarket-Dashboard-${Date.now()}.pdf`);
          showSuccessMessage("PDF");
          break;
        }

        case "print": {
          const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
            quality: 0.95,
            backgroundColor: "#ffffff",
            pixelRatio: 2,
          });

          const printWindow = window.open("", "_blank");
          if (!printWindow) {
            toast.error("Please allow popups to print", {
              duration: 3000,
              position: "top-center",
            });
            break;
          }

          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Supermarket Sales Dashboard</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: white;
                }
                .print-header { 
                  text-align: center; 
                  margin-bottom: 20px;
                  padding-bottom: 15px;
                  border-bottom: 2px solid #e5e7eb;
                }
                .print-title { 
                  font-size: 24px; 
                  font-weight: bold; 
                  margin-bottom: 10px;
                  color: #1e293b;
                }
                .print-image { 
                  width: 100%; 
                  max-width: 100%;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                }
                .print-footer {
                  margin-top: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #94a3b8;
                  padding-top: 15px;
                  border-top: 1px solid #e5e7eb;
                }
                .no-print { 
                  margin-top: 20px; 
                  text-align: center;
                }
                .print-btn {
                  padding: 10px 20px;
                  background: #4f46e5;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                }
                .print-btn:hover { background: #4338ca; }
                .close-btn {
                  padding: 10px 20px;
                  background: #6b7280;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  margin-left: 10px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                }
                .close-btn:hover { background: #4b5563; }
                @media print {
                  body { margin: 0; padding: 10mm; }
                  .no-print { display: none; }
                  .print-image { border: none; }
                }
              </style>
            </head>
            <body>
              <div class="print-header">
                <div class="print-title">Supermarket Sales Dashboard</div>
              </div>
              <img src="${dataUrl}" class="print-image" alt="Dashboard" />
              <div class="print-footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
              </div>
              <div class="no-print">
                <button onclick="window.print()" class="print-btn">Print Now</button>
                <button onclick="window.close()" class="close-btn">Close</button>
              </div>
              <script>
                window.onload = function() {
                  setTimeout(() => window.print(), 500);
                }
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
          break;
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export. Please try again.", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    toast.success(`${files.length} file(s) uploaded successfully!`, {
      duration: 3000,
      position: "top-center",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success("File removed", {
      duration: 2000,
      position: "top-center",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleNewQuery = () => {
    console.log('🔄 Starting new query, resetting dashboard');
    resetDashboard();
    setUploadedFiles([]);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <Toaster />
        <SequentialLoader />
      </div>
    );
  }

  // Show initial query input (no dashboard yet)
  if (!hasData) {
    return (
      <div className="w-full min-h-screen bg-gray-50 p-6">
        <Toaster />
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
          multiple
        />

        {/* Welcome Section */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              AI-Powered Dashboard Generator
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Describe what kind of dashboard you want, and our AI will generate it for you with interactive charts and insights.
            </p>
          </div>

          <QueryInput />

          {/* Quick Start Examples */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Try these examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => fetchDashboardData("Plot a sales Dashboard")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <CardTitle className="text-base">Sales Dashboard</CardTitle>
                  </div>
                  <p className="text-sm text-slate-600">Generate a complete sales performance dashboard with charts and KPIs.</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => fetchDashboardData("Show me product performance")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <BarChart className="w-5 h-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-base">Product Analysis</CardTitle>
                  </div>
                  <p className="text-sm text-slate-600">Analyze product performance across different categories and metrics.</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => fetchDashboardData("Analyze branch sales")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-base">Branch Comparison</CardTitle>
                  </div>
                  <p className="text-sm text-slate-600">Compare performance across different branches and locations.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Uploaded Files Section */}
          {uploadedFiles.length > 0 && (
            <Card className="w-full shadow-lg bg-white mt-8">
              <CardHeader className="border-b bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-600 shadow-lg">
                      <FileSpreadsheet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Uploaded Files ({uploadedFiles.length})
                      </CardTitle>
                      <p className="text-sm text-slate-600">Your data files are ready for analysis</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-100">
                          <File className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">
                              {file.uploadedAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 p-1 hover:bg-red-100 rounded-md transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Show dashboard with data
  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <Toaster />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />

      {/* New Query Button */}
      <div className="max-w-7xl mx-auto mb-4">
        <Button
          onClick={handleNewQuery}
          variant="outline"
          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          New Query
        </Button>
      </div>

      {/* Query Input (still visible when dashboard is shown) */}
      <div className="max-w-7xl mx-auto mb-6">
        <QueryInput />
      </div>

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <Card className="w-full max-w-7xl mx-auto shadow-lg bg-white mb-6">
          <CardHeader className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-600 shadow-lg">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">
                    Uploaded Files ({uploadedFiles.length})
                  </CardTitle>
                  <p className="text-sm text-slate-600">Manage your uploaded data files</p>
                </div>
              </div>
              <Button
                onClick={() => setUploadedFiles([])}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <File className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {file.uploadedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 hover:bg-red-100 rounded-md transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card ref={cardRef} className="w-full max-w-7xl mx-auto shadow-2xl bg-white overflow-hidden">
        <CardHeader className="border-b bg-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 shadow-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                {/* Dashboard Title - Hardcoded header only */}
                <CardTitle className="text-xl font-bold text-slate-800">
                  AI-Generated Dashboard
                </CardTitle>
                {/* Dashboard Subtitle - Hardcoded header only */}
                <p className="text-sm text-slate-600">Interactive analytics dashboard generated from your query</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Badge>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </Button>

              <div className="relative">
                <Button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isExporting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {isExporting ? (
                    <>
                      <Download className="w-4 h-4 mr-2 animate-bounce" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>

                {showDownloadMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-50 bg-black/10"
                      onClick={() => setShowDownloadMenu(false)}
                    />
                    <div className="fixed right-4 top-20 w-80 bg-white rounded-2xl shadow-2xl border z-[60]">
                      <div className="p-4 border-b bg-slate-50">
                        <div className="text-base font-semibold text-slate-800">Export Dashboard</div>
                        <div className="text-sm text-slate-500 mt-1">Choose your export format</div>
                      </div>

                      <div className="p-3">
                        <button
                          onClick={() => handleDownload("excel")}
                          className="flex items-center w-full px-4 py-3.5 hover:bg-green-50 rounded-xl group mb-2"
                        >
                          <div className="p-2.5 bg-green-100 rounded-xl mr-4 group-hover:bg-green-200">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800">Export as Excel</div>
                            <div className="text-xs text-slate-500 mt-0.5">Complete data in spreadsheet</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDownload("html")}
                          className="flex items-center w-full px-4 py-3.5 hover:bg-orange-50 rounded-xl group mb-2"
                        >
                          <div className="p-2.5 bg-orange-100 rounded-xl mr-4 group-hover:bg-orange-200">
                            <Globe className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800">Export as HTML</div>
                            <div className="text-xs text-slate-500 mt-0.5">Standalone web page</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDownload("jpeg")}
                          className="flex items-center w-full px-4 py-3.5 hover:bg-blue-50 rounded-xl group mb-2"
                        >
                          <div className="p-2.5 bg-blue-100 rounded-xl mr-4 group-hover:bg-blue-200">
                            <Download className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800">Download as JPEG</div>
                            <div className="text-xs text-slate-500 mt-0.5">Compressed format</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDownload("png")}
                          className="flex items-center w-full px-4 py-3.5 hover:bg-purple-50 rounded-xl group mb-2"
                        >
                          <div className="p-2.5 bg-purple-100 rounded-xl mr-4 group-hover:bg-purple-200">
                            <Download className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800">Download as PNG</div>
                            <div className="text-xs text-slate-500 mt-0.5">High quality</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDownload("pdf")}
                          className="flex items-center w-full px-4 py-3.5 hover:bg-red-50 rounded-xl group mb-2"
                        >
                          <div className="p-2.5 bg-red-100 rounded-xl mr-4 group-hover:bg-red-200">
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800">Download as PDF</div>
                            <div className="text-xs text-slate-500 mt-0.5">Professional document</div>
                          </div>
                        </button>

                        <div className="h-px bg-slate-200 my-3"></div>

                        <button
                          onClick={() => handleDownload("print")}
                          className="flex items-center w-full px-4 py-3.5 hover:bg-gray-50 rounded-xl group"
                        >
                          <div className="p-2.5 bg-gray-100 rounded-xl mr-4 group-hover:bg-gray-200">
                            <Printer className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800">Print</div>
                            <div className="text-xs text-slate-500 mt-0.5">Send to printer</div>
                          </div>
                        </button>
                      </div>

                      <div className="px-4 py-3 border-t bg-slate-50">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Generated {new Date().toLocaleDateString()}</span>
                          <button
                            onClick={() => setShowDownloadMenu(false)}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="min-h-[600px] flex items-center justify-center">
              <SequentialLoader />
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION 1: KPI Cards - Header Hardcoded, Content Dynamic */}
              {dashboardData.kpis && dashboardData.kpis.length > 0 && (
                <div>
                  {/* HARDCODED SECTION HEADER */}
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Key Performance Indicators
                  </h3>
                  
                  {/* DYNAMIC CONTENT FROM BACKEND */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dashboardData.kpis.map((kpi, index) => renderKPICard(kpi, index))}
                  </div>
                </div>
              )}

              {/* SECTION 2: Charts - Header Hardcoded, Content Dynamic */}
              {dashboardData.charts && dashboardData.charts.length > 0 && (
                <div>
                  {/* HARDCODED SECTION HEADER */}
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-indigo-600" />
                    Visualizations
                  </h3>
                  
                  {/* DYNAMIC CONTENT FROM BACKEND */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {dashboardData.charts.map((chart, index) => renderChart(chart, index))}
                  </div>
                </div>
              )}

              {/* SECTION 3: Key Insights - Header Hardcoded, Content Dynamic */}
              <div>
                {/* HARDCODED SECTION HEADER */}
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Key Insights
                </h3>
                
                {/* DYNAMIC CONTENT FROM BACKEND */}
                <Card className="shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    {dashboardData.kpis && dashboardData.kpis.length > 0 ? (
                      dashboardData.kpis.slice(0, 3).map((kpi, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Badge variant={index === 0 ? "default" : index === 1 ? "outline" : "secondary"}>
                            {index === 0 ? "Top" : index === 1 ? "Important" : "Notable"}
                          </Badge>
                          <span className="text-sm">
                            <strong>{kpi.title}:</strong> {kpi.value} - {kpi.description}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No insights available</p>
                    )}
                    
                    {dashboardData.charts && dashboardData.charts.length > 0 && (
                      <div className="flex items-center space-x-3 pt-2 border-t">
                        <Badge variant="destructive">Charts</Badge>
                        <span className="text-sm">
                          Dashboard contains {dashboardData.charts.length} interactive charts with detailed analytics
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}