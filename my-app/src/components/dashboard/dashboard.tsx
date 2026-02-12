/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import React, { useRef, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Toaster } from "../ui/sonner";
import { toast } from "sonner";
import {
  LayoutDashboard,
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
  User,
  Settings,
  LogOut,
  Trash2,
  Plus,
  Check,
  Database,
  ChevronDown,
  Copy,
  ArrowUp,
  RotateCcw,
  Clock,
  Brain,
  Calendar,
  DownloadCloud,
  Image,
  FileJson,
  Mic,
  CircleStop,
} from "lucide-react";

import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  useDashboardStore,
} from "@/src/services/api/dashboard/dashboard-api-store";

import { useUploadStore } from "@/src/services/api/dashboard/upload-store";
import { useDeleteFileStore } from "@/src/services/api/dashboard/delete-store";
import { useRouter } from "next/navigation";

import { fetchDataSources } from "@/src/services/api/dashboard/data-source";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

// ==================== SEQUENTIAL LOADER ====================

const SequentialLoader = () => {
  const messages = [
    'Preparing dashboard...',
    'Loading data...',
    'Almost there...',
    'Please wait ⏳',
  ];
  const [step, setStep] = React.useState(0);

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

// ==================== ROTATING TEXT LOADER ====================

const RotatingTextLoader = () => {
  const texts = [
    "Thinking...",
    "Generating response...",
    "Analyzing data...",
    "Please Wait...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="text-md italic text-gray-600"
    >
      {texts[step]}
    </motion.div>
  );
};

// ==================== QUICK QUERIES COMPONENT ====================

const QuickQueries = ({ onSelectQuery }: { onSelectQuery: (query: string) => void }) => {
  const quickQueries = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "Plot a sales Dashboard",
      description: "Visualize sales trends and performance"
    },
    {
      icon: <BarChart className="w-4 h-4" />,
      text: "Show me product performance",
      description: "Analyze top products and categories"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      text: "Analyze branch sales",
      description: "Compare sales across different branches"
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      text: "Monthly revenue analysis",
      description: "View revenue trends by month"
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-6 max-w-3xl mx-auto">
      {quickQueries.map((query, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectQuery(query.text)}
          className="flex items-start gap-3 p-4 bg-white/70 border border-white/20 rounded-xl hover:bg-white/90 hover:border-indigo-200 transition-all text-left group shadow-sm hover:shadow-md"
        >
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            {query.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">{query.text}</p>
            <p className="text-xs text-slate-500 mt-0.5">{query.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// ==================== CHART DOWNLOAD BUTTON (FIXED WHITE BACKGROUND) ====================

const ChartDownloadButton = ({ chartOption, chartTitle }: { chartOption: any; chartTitle: string }) => {
  const [showMenu, setShowMenu] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const echartRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadChart = async (format: string) => {
    if (!chartRef.current) return;

    try {
      let canvas;
      
      if (format === 'png' || format === 'jpg') {
        if (echartRef.current && echartRef.current.getEchartsInstance) {
          const instance = echartRef.current.getEchartsInstance();
          canvas = instance.getRenderedCanvas({
            backgroundColor: '#fff',
            pixelRatio: 2,
          });
        } else {
          canvas = await htmlToImage.toCanvas(chartRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            pixelRatio: 2,
          });
        }

        if (format === 'png') {
          const link = document.createElement('a');
          link.download = `${chartTitle || 'chart'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast.success('Chart downloaded as PNG');
        } else if (format === 'jpg') {
          const link = document.createElement('a');
          link.download = `${chartTitle || 'chart'}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.click();
          toast.success('Chart downloaded as JPG');
        }
      }
    } catch (error) {
      console.error('Failed to download chart:', error);
      toast.error('Failed to download chart');
    }

    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-slate-100"
        onClick={() => setShowMenu(!showMenu)}
        title="Download options"
      >
        <DownloadCloud className="w-4 h-4" />
      </Button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => downloadChart('png')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Image className="w-4 h-4" />
                Download as PNG
              </button>
              <button
                onClick={() => downloadChart('jpg')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Image className="w-4 h-4" />
                Download as JPG
              </button>
            </div>
          </div>
        </>
      )}
      
      <div ref={chartRef} className="absolute -left-[9999px] top-0 w-[800px] h-[400px] bg-white p-4">
        <ReactECharts
          ref={echartRef}
          option={chartOption}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
};

// ==================== DASHBOARD CARD WITH EXPORT (UPDATED WITH MORE OPTIONS) ====================

interface DashboardCardProps {
  dashboardData: any;
  timestamp: Date;
  cardRef?: React.RefObject<HTMLDivElement>;
  showLoader?: boolean;
}

const DashboardCard = ({ dashboardData, timestamp, cardRef, showLoader }: DashboardCardProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const dashboardCardRef = useRef<HTMLDivElement>(null);

  const renderChart = (chartOption: any, index: number) => {
    const fixedChartOption = { ...chartOption };
    const chartTitle = fixedChartOption.title?.text || `Chart ${index + 1}`;

    if (fixedChartOption.series) {
      fixedChartOption.series = fixedChartOption.series.map((series: any) => {
        if (series.type === "doughnut") {
          return {
            ...series,
            type: "pie",
            radius: ["40%", "70%"],
          };
        }
        return series;
      });
    }

    return (
      <Card key={index} className="shadow-sm chart-container relative group">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{chartTitle}</CardTitle>
          <ChartDownloadButton chartOption={fixedChartOption} chartTitle={chartTitle} />
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ReactECharts
              option={fixedChartOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKPICard = (kpi: any, index: number) => {
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
          <CardTitle className="text-sm font-medium text-slate-600">
            {kpi.title}
          </CardTitle>
          <Badge variant={badgeVariant}>{badgeIcon}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{kpi.value}</div>
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

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      if (dashboardData.kpis && dashboardData.kpis.length > 0) {
        const kpiData = dashboardData.kpis.map((kpi: any) => ({
          'Metric': kpi.title,
          'Value': kpi.value,
          'Description': kpi.description || ''
        }));
        const kpiWs = XLSX.utils.json_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(wb, kpiWs, 'KPIs');
      }
      
      if (dashboardData.charts && dashboardData.charts.length > 0) {
        const chartData: any[] = [];
        dashboardData.charts.forEach((chart: any, idx: number) => {
          const chartTitle = chart.title?.text || `Chart ${idx + 1}`;
          
          if (chart.series && chart.series.length > 0) {
            chart.series.forEach((series: any) => {
              if (series.data && Array.isArray(series.data)) {
                series.data.forEach((item: any, dataIdx: number) => {
                  chartData.push({
                    'Chart': chartTitle,
                    'Series': series.name || `Series ${dataIdx + 1}`,
                    'Category': item.name || `Item ${dataIdx + 1}`,
                    'Value': item.value || item
                  });
                });
              }
            });
          }
        });
        
        if (chartData.length > 0) {
          const chartWs = XLSX.utils.json_to_sheet(chartData);
          XLSX.utils.book_append_sheet(wb, chartWs, 'Chart Data');
        }
      }
      
      XLSX.writeFile(wb, `dashboard-${Date.now()}.xlsx`);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export as Excel');
    }
  };

  const exportToHTML = async () => {
    if (!dashboardCardRef.current) return;
    
    try {
      const dashboardHTML = dashboardCardRef.current.outerHTML;
      const fullHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Dashboard Export - ${new Date().toLocaleDateString()}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              padding: 20px;
              background: white;
              color: #1e293b;
            }
            .dashboard-container {
              max-width: 1400px;
              margin: 0 auto;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin-bottom: 24px;
            }
            .chart-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
              gap: 20px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="dashboard-container">
            ${dashboardHTML}
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([fullHTML], { type: 'text/html' });
      downloadFile(blob, `dashboard-${Date.now()}.html`);
      toast.success('HTML file downloaded successfully!');
    } catch (error) {
      console.error('HTML export failed:', error);
      toast.error('Failed to export as HTML');
    }
  };

  const handleDownload = async (format: string) => {
    if (!dashboardCardRef.current) return;
    
    setIsExporting(true);
    setShowDownloadMenu(false);
    
    try {
      if (format === 'png') {
        const canvas = await htmlToImage.toCanvas(dashboardCardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        const image = canvas.toDataURL('image/png');
        const blob = await (await fetch(image)).blob();
        downloadFile(blob, `dashboard-${Date.now()}.png`);
        toast.success('PNG downloaded successfully!');
      } else if (format === 'jpg') {
        const canvas = await htmlToImage.toCanvas(dashboardCardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const blob = await (await fetch(image)).blob();
        downloadFile(blob, `dashboard-${Date.now()}.jpg`);
        toast.success('JPG downloaded successfully!');
      } else if (format === 'pdf') {
        const canvas = await htmlToImage.toCanvas(dashboardCardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        const image = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`dashboard-${Date.now()}.pdf`);
        toast.success('PDF downloaded successfully!');
      } else if (format === 'excel') {
        exportToExcel();
      } else if (format === 'html') {
        await exportToHTML();
      } else if (format === 'print') {
        const canvas = await htmlToImage.toCanvas(dashboardCardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        const image = canvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Dashboard Report</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                img { width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${image}" />
              <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full shadow-2xl bg-white overflow-hidden">
      <CardHeader className="border-b bg-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 shadow-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">
                AI-Generated Dashboard
              </CardTitle>
              <p className="text-sm text-slate-600">Complete Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {timestamp && (
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                <Calendar className="w-3 h-3 mr-1" />
                {timestamp.toLocaleDateString()}
              </Badge>
            )}
            
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
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDownloadMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-slate-500 px-4 pt-2 pb-1">IMAGE</div>
                      <button
                        onClick={() => handleDownload('png')}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                          <Image className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">PNG</div>
                          <div className="text-xs text-slate-500">High quality image</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleDownload('jpg')}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                          <Image className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">JPG</div>
                          <div className="text-xs text-slate-500">Compressed image</div>
                        </div>
                      </button>
                      
                      <div className="h-px bg-slate-200 my-2"></div>
                      
                      <div className="text-xs font-semibold text-slate-500 px-4 pt-1 pb-1">DOCUMENT</div>
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-red-100 rounded-lg mr-3">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">PDF</div>
                          <div className="text-xs text-slate-500">Professional document</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleDownload('html')}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-orange-100 rounded-lg mr-3">
                          <FileJson className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">HTML</div>
                          <div className="text-xs text-slate-500">Web page format</div>
                        </div>
                      </button>
                      
                      <div className="h-px bg-slate-200 my-2"></div>
                      
                      <div className="text-xs font-semibold text-slate-500 px-4 pt-1 pb-1">DATA</div>
                      <button
                        onClick={() => handleDownload('excel')}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-green-100 rounded-lg mr-3">
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">Excel</div>
                          <div className="text-xs text-slate-500">Spreadsheet data</div>
                        </div>
                      </button>
                      
                      <div className="h-px bg-slate-200 my-2"></div>
                      
                      <button
                        onClick={() => handleDownload('print')}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-gray-100 rounded-lg mr-3">
                          <Printer className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">Print</div>
                          <div className="text-xs text-slate-500">Send to printer</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent ref={dashboardCardRef} className="p-6">
        {showLoader ? (
          <div className="min-h-[600px] flex items-center justify-center">
            <SequentialLoader />
          </div>
        ) : dashboardData ? (
          <div className="space-y-6">
            {dashboardData.kpis && dashboardData.kpis.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Key Performance Indicators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardData.kpis.map((kpi: any, i: number) => renderKPICard(kpi, i))}
                </div>
              </div>
            )}

            {dashboardData.charts && dashboardData.charts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-indigo-600" />
                  Visualizations
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardData.charts.map((chart: any, i: number) => renderChart(chart, i))}
                </div>
              </div>
            )}

            {(!dashboardData.kpis || dashboardData.kpis.length === 0) && 
             (!dashboardData.charts || dashboardData.charts.length === 0) && (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400">
                <div className="p-4 rounded-full bg-slate-200 mb-4">
                  <BarChart className="w-12 h-12" />
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-1">
                  No Dashboard Data Available
                </p>
                <p className="text-xs text-slate-500">
                  Generate a dashboard to see all components
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400">
            <div className="p-4 rounded-full bg-slate-200 mb-4">
              <BarChart className="w-12 h-12" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">
              No Dashboard Data Available
            </p>
            <p className="text-xs text-slate-500">
              Generate a dashboard to see all components
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== INTERFACES ====================

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  isExisting?: boolean;
}

interface DatabaseFile {
  id: string;
  name: string;
  icon: string;
}

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  files?: string[];
  dashboardData?: any;
  visualRendered?: boolean;
}

// ==================== NAVIGATION BAR COMPONENT ====================

const NavigationBar = ({ userEmail, showUserMenu, setShowUserMenu, handleLogout, handleSettings }: any) => {
  return (
    <div className="border-b bg-white p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-600 shadow-lg">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800">AI Dashboard Generator</h1>
          <p className="text-sm text-slate-500">Powered by AI</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {userEmail && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors shadow-sm"
            >
              <User className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-800">
                {userEmail.split("@")[0]}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleSettings();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export function SalesDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toastShownRef = useRef<string | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [recentlyUploadedFile, setRecentlyUploadedFile] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<DatabaseFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [hasShownNoFileToast, setHasShownNoFileToast] = useState(false);

  const {
    loading,
    hasData,
    dashboardData,
    fetchDashboardData,
    resetDashboard,
  } = useDashboardStore();

  const { uploading, uploadAndGenerate } = useUploadStore();
  const { deleteFile } = useDeleteFileStore();
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const email = localStorage.getItem("user_email") || "";
    setUserEmail(email);
    loadExistingFiles();
  }, []);

  useEffect(() => {
    if (hasData && dashboardData && isLoading && pendingQuery) {
      console.log("✅ Dashboard data is ready! Adding bot message with data:", dashboardData);
      
      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        type: "bot",
        content: "Dashboard generated successfully! ✨",
        timestamp: new Date(),
        dashboardData: dashboardData,
        visualRendered: true,
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setPendingQuery(null);
      setIsLoading(false);
      toast.success("Dashboard ready!");
      toastShownRef.current = null;
    }
  }, [hasData, dashboardData, isLoading, pendingQuery]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => prev + (prev ? " " : "") + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Speech recognition failed. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    async function loadDataSources() {
      try {
        const data = await fetchDataSources();
        const filesWithIcons = Array.isArray(data) ? data.map((ds: any) => {
          const fileName = typeof ds === 'string' ? ds : ds.name || 'Unknown';
          return {
            id: fileName,
            name: fileName,
            icon: fileName.endsWith('.csv') ? '📄' : 
                  fileName.endsWith('.xlsx') ? '📊' : 
                  fileName.endsWith('.json') ? '📋' : '📁',
          };
        }) : [];
        setAvailableFiles(filesWithIcons);
      } catch (error) {
        console.error("Failed to load data sources:", error);
      }
    }
    loadDataSources();
  }, [uploadedFiles]);

  const loadExistingFiles = async () => {
    try {
      const existingFiles = await fetchDataSources();

      if (!Array.isArray(existingFiles)) {
        setUploadedFiles([]);
        return;
      }

      const formattedFiles: UploadedFile[] = existingFiles.map((file: any) => {
        if (typeof file === "string") {
          return {
            name: file,
            size: 0,
            type: getFileTypeFromName(file),
            uploadedAt: new Date(),
            isExisting: true,
          };
        }

        return {
          name: file.name || file.filename || file.originalname || "Unknown file",
          size: file.size || file.fileSize || 0,
          type:
            file.type ||
            file.mimetype ||
            getFileTypeFromName(file.name || file.filename || ""),
          uploadedAt:
            file.uploadedAt || file.createdAt || file.uploadDate
              ? new Date(file.uploadedAt || file.createdAt || file.uploadDate)
              : new Date(),
          isExisting: true,
        };
      });

      setUploadedFiles(formattedFiles);
      
      const filesWithIcons = formattedFiles.map((file) => ({
        id: file.name,
        name: file.name,
        icon: file.name.endsWith('.csv') ? '📄' : 
              file.name.endsWith('.xlsx') ? '📊' : 
              file.name.endsWith('.json') ? '📋' : '📁',
      }));
      setAvailableFiles(filesWithIcons);
      
    } catch (error: any) {
      console.error("Failed to load existing files:", error);
    }
  };

  const getFileTypeFromName = (filename: string): string => {
    if (!filename) return "application/octet-stream";
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "csv": return "text/csv";
      case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "xls": return "application/vnd.ms-excel";
      case "json": return "application/json";
      default: return "application/octet-stream";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_email");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token_type");
    router.push("/");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleStopRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setPendingQuery(null);
      toast.info("Request cancelled");
      toastShownRef.current = null;
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening... Speak now.");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Failed to start speech recognition.");
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) {
      toast.error("Please login first");
      return;
    }

    try {
      await uploadAndGenerate(userEmail, Array.from(files));
      
      const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      }));
      
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      
      const newAvailableFiles = Array.from(files).map((file) => ({
        id: file.name,
        name: file.name,
        icon: file.name.endsWith('.csv') ? '📄' : 
              file.name.endsWith('.xlsx') ? '📊' : 
              file.name.endsWith('.json') ? '📋' : '📁',
      }));
      
      setAvailableFiles((prev) => [...prev, ...newAvailableFiles]);
      
      const fileNames = Array.from(files).map(f => f.name);
      setSelectedFiles((prev) => [...prev, ...fileNames]);
      
      setRecentlyUploadedFile(files[0].name);
      setUploadSuccess(true);
      toast.success(`Uploaded ${files.length} file(s) successfully!`);

      setTimeout(() => {
        setShowFileUploadModal(false);
        setRecentlyUploadedFile(null);
        setUploadSuccess(false);
      }, 3000);
      
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      await deleteFile(filename);
      setUploadedFiles((prev) => prev.filter((file) => file.name !== filename));
      setAvailableFiles((prev) => prev.filter((file) => file.id !== filename));
      setSelectedFiles((prev) => prev.filter((file) => file !== filename));
      toast.success(`File "${filename}" deleted successfully!`);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete file: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileNames = () => {
    if (selectedFiles.length === 0) {
      return "";
    }
    return selectedFiles.join(",");
  };

  const handleQuickQuery = (query: string) => {
    setInputValue(query);
    
    if (selectedFiles.length === 0) {
      if (!hasShownNoFileToast) {
        toast.warning("Please select files before sending a query");
        setHasShownNoFileToast(true);
        setTimeout(() => setHasShownNoFileToast(false), 2000);
      }
      return;
    }
    
    setTimeout(() => {
      handleSendMessageWithQuery(query);
    }, 100);
  };

  const handleSendMessageWithQuery = async (queryText: string) => {
    if (!queryText.trim()) {
      toast.error("Please enter a query");
      return;
    }

    const fileNames = getFileNames();
    if (!fileNames) {
      if (!hasShownNoFileToast) {
        toast.warning("Please select files before sending a query");
        setHasShownNoFileToast(true);
        setTimeout(() => setHasShownNoFileToast(false), 2000);
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: queryText.trim(),
      timestamp: new Date(),
      files: selectedFiles,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLastQuery(queryText.trim());
    setPendingQuery(queryText.trim());
    setIsLoading(true);
    setInputValue("");

    abortControllerRef.current = new AbortController();

    const cleanFileNames = selectedFiles
      .map((file) => file.replace(/\.csv$/i, ""))
      .join(",");

    try {
      await fetchDashboardData(queryText.trim(), cleanFileNames);
    } catch (error) {
      console.error("Error fetching dashboard:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Failed to generate dashboard. Please try again.",
        timestamp: new Date(),
        visualRendered: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setPendingQuery(null);
      setIsLoading(false);
      toast.error("Failed to generate dashboard.");
      abortControllerRef.current = null;
      toastShownRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a query");
      return;
    }

    const fileNames = getFileNames();
    if (!fileNames) {
      if (!hasShownNoFileToast) {
        toast.warning("Please select files before sending a query");
        setHasShownNoFileToast(true);
        setTimeout(() => setHasShownNoFileToast(false), 2000);
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
      files: selectedFiles,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLastQuery(inputValue.trim());
    setPendingQuery(inputValue.trim());
    setIsLoading(true);
    setInputValue("");

    abortControllerRef.current = new AbortController();

    const cleanFileNames = selectedFiles
      .map((file) => file.replace(/\.csv$/i, ""))
      .join(",");

    try {
      await fetchDashboardData(inputValue.trim(), cleanFileNames);
    } catch (error) {
      console.error("Error fetching dashboard:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Failed to generate dashboard. Please try again.",
        timestamp: new Date(),
        visualRendered: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setPendingQuery(null);
      setIsLoading(false);
      toast.error("Failed to generate dashboard.");
      abortControllerRef.current = null;
      toastShownRef.current = null;
    }
  };

  const handleRetry = async () => {
    if (!lastQuery) return;
    if (selectedFiles.length === 0) {
      if (!hasShownNoFileToast) {
        toast.warning("Please select files before retrying");
        setHasShownNoFileToast(true);
        setTimeout(() => setHasShownNoFileToast(false), 2000);
      }
      return;
    }
    await handleSendMessageWithQuery(lastQuery);
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles((prev) => {
      if (prev.includes(fileName)) {
        return prev.filter((f) => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-white min-h-screen">
      <Toaster />
      
      <NavigationBar 
        userEmail={userEmail}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        handleLogout={handleLogout}
        handleSettings={handleSettings}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white backdrop-blur-xl">
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-6">
            <div className="mb-8 w-20 h-20 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 200 200"
                width="100%"
                height="100%"
                className="w-full h-full"
              >
                <g clipPath="url(#cs_clip_1_ellipse-12)">
                  <mask
                    id="cs_mask_1_ellipse-12"
                    style={{ maskType: "alpha" }}
                    width="200"
                    height="200"
                    x="0"
                    y="0"
                    maskUnits="userSpaceOnUse"
                  >
                    <path
                      fill="#fff"
                      fillRule="evenodd"
                      d="M100 150c27.614 0 50-22.386 50-50s-22.386-50-50-50-50 22.386-50 50 22.386 50 50 50zm0 50c55.228 0 100-44.772 100-100S155.228 0 100 0 0 44.772 0 100s44.772 100 100 100z"
                      clipRule="evenodd"
                    ></path>
                  </mask>
                  <g mask="url(#cs_mask_1_ellipse-12)">
                    <path fill="#fff" d="M200 0H0v200h200V0z"></path>
                    <path
                      fill="#0066FF"
                      fillOpacity="0.33"
                      d="M200 0H0v200h200V0z"
                    ></path>
                    <g
                      filter="url(#filter0_f_844_2811)"
                      className="animate-gradient"
                    >
                      <path fill="#0066FF" d="M110 32H18v68h92V32z"></path>
                      <path fill="#0044FF" d="M188-24H15v98h173v-98z"></path>
                      <path fill="#0099FF" d="M175 70H5v156h170V70z"></path>
                      <path fill="#00CCFF" d="M230 51H100v103h130V51z"></path>
                    </g>
                  </g>
                </g>
                <defs>
                  <filter
                    id="filter0_f_844_2811"
                    width="385"
                    height="410"
                    x="-75"
                    y="-104"
                    colorInterpolationFilters="sRGB"
                    filterUnits="userSpaceOnUse"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                    <feBlend
                      in="SourceGraphic"
                      in2="BackgroundImageFix"
                      result="shape"
                    ></feBlend>
                    <feGaussianBlur
                      result="effect1_foregroundBlur_844_2811"
                      stdDeviation="40"
                    ></feGaussianBlur>
                  </filter>
                  <clipPath id="cs_clip_1_ellipse-12">
                    <path fill="#fff" d="M0 0H200V200H0z"></path>
                  </clipPath>
                </defs>
                <g
                  style={{ mixBlendMode: "overlay" }}
                  mask="url(#cs_mask_1_ellipse-12)"
                >
                  <path
                    fill="gray"
                    stroke="transparent"
                    d="M200 0H0v200h200V0z"
                    filter="url(#cs_noise_1_ellipse-12)"
                  ></path>
                </g>
                <defs>
                  <filter
                    id="cs_noise_1_ellipse-12"
                    width="100%"
                    height="100%"
                    x="0%"
                    y="0%"
                    filterUnits="objectBoundingBox"
                  >
                    <feTurbulence
                      baseFrequency="0.6"
                      numOctaves="5"
                      result="out1"
                      seed="4"
                    ></feTurbulence>
                    <feComposite
                      in="out1"
                      in2="SourceGraphic"
                      operator="in"
                      result="out2"
                    ></feComposite>
                    <feBlend
                      in="SourceGraphic"
                      in2="out2"
                      mode="overlay"
                      result="out3"
                    ></feBlend>
                  </filter>
                </defs>
              </svg>
            </div>

            <div className="mb-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 mb-2">
                  Adro is here to assist you
                </h1>
                <p className="text-gray-500 max-w-md">
                  Ask me anything or try one of the suggestions below
                </p>
              </motion.div>
            </div>

            <div className="w-full bg-white/70 border border-white/20 rounded-2xl shadow-2xl overflow-hidden mb-4">
              <div className="p-4 pb-0 relative">
                <textarea
                  ref={inputRef}
                  placeholder="Ask me anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full text-gray-700 bg-transparent text-base outline-none placeholder:text-gray-400 pr-20 resize-none"
                  rows={3}
                />
              </div>

              <div className="px-4 py-3 flex items-center gap-3 border-t border-white/30">
                <button
                  onClick={() => setShowFileDialog(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors flex-shrink-0"
                  title="Attach files"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {selectedFiles.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    {selectedFiles.map((fileId) => {
                      const file = availableFiles.find((f) => f.id === fileId);
                      return (
                        <div
                          key={fileId}
                          className="flex items-center gap-2 bg-gray-50/70 py-1 px-2 rounded-md border border-gray-200/50 flex-shrink-0"
                        >
                          <span className="text-md">{file?.icon}</span>
                          <span className="text-xs text-gray-700 whitespace-nowrap">
                            {file?.name}
                          </span>
                          <button
                            onClick={() => toggleFileSelection(fileId)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedFiles.length === 0 && <div className="flex-1" />}

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleSpeechRecognition}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                    }`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  {isLoading ? (
                    <button
                      onClick={handleStopRequest}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                      title="Stop generation"
                    >
                      <CircleStop className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        inputValue.trim()
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100/70 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <QuickQueries onSelectQuery={handleQuickQuery} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-full mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {message.type === "user" ? (
                    <>
                      <div className="flex justify-end">
                        <div className="inline-block max-w-[80%] rounded-2xl px-5 py-3 bg-gray-900 text-white shadow-sm">
                          <p className="text-md leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 px-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-gray-800"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-300" />
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full rounded-2xl px-5 py-3 bg-gray-100 text-gray-900 shadow-sm">
                        <p className="text-md">{message.content}</p>
                        
                        {message.visualRendered && message.dashboardData && (
                          <div className="mt-4 w-full">
                            <DashboardCard 
                              dashboardData={message.dashboardData}
                              timestamp={message.timestamp}
                              showLoader={false}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 px-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-gray-200"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && !hasData && (
                <div className="space-y-2">
                  <div className="inline-block rounded-2xl px-5 py-3">
                    <div className="flex items-center gap-2 italic text-gray-600">
                      <div className="text-emerald-400">
                        <Brain className="w-5 h-5" />
                      </div>
                      <RotatingTextLoader />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="bg-transparent sticky bottom-0 mt-auto">
            <div className="w-full mx-auto px-6 py-3 backdrop-blur-sm">
              <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-w-3xl mx-auto">
                <div className="p-4 pb-0 relative">
                  <textarea
                    ref={inputRef}
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full text-gray-700 bg-transparent text-base outline-none placeholder:text-gray-400 pr-20 resize-none"
                    rows={2}
                  />
                </div>

                <div className="px-4 py-3 flex items-center gap-3 border-t border-white/30">
                  <button
                    onClick={() => setShowFileDialog(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors flex-shrink-0"
                    title="Attach files"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {selectedFiles.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      {selectedFiles.map((fileId) => {
                        const file = availableFiles.find((f) => f.id === fileId);
                        return (
                          <div
                            key={fileId}
                            className="flex items-center gap-2 bg-gray-50/70 py-1 px-2 rounded-md border border-gray-200/50 flex-shrink-0"
                          >
                            <span className="text-md">{file?.icon}</span>
                            <span className="text-xs text-gray-700 whitespace-nowrap">
                              {file?.name}
                            </span>
                            <button
                              onClick={() => toggleFileSelection(fileId)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedFiles.length === 0 && <div className="flex-1" />}

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={toggleSpeechRecognition}
                      className={`p-2 rounded-lg transition-colors ${
                        isListening
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                      }`}
                      title={isListening ? "Stop listening" : "Start voice input"}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    {!isLoading && lastQuery && (
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Retry last query"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-sm font-medium">Retry</span>
                      </button>
                    )}
                    {isLoading ? (
                      <button
                        onClick={handleStopRequest}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Stop generation"
                      >
                        <CircleStop className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          inputValue.trim()
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100/70 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFileDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowFileDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[80vh] bg-white rounded-lg shadow-xl z-50 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Select Data Sources
                  </h3>
                </div>
                <button
                  onClick={() => setShowFileDialog(false)}
                  className="p-2 hover:bg-slate-100 rounded-md"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex gap-6 p-6 overflow-hidden">
              <div className="flex-1 flex flex-col border border-slate-200 rounded-lg">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">
                      Available Files
                    </h4>
                    <Badge variant="secondary">
                      {availableFiles.filter(f => !selectedFiles.includes(f.id)).length} available
                    </Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    {availableFiles
                      .filter((file) => !selectedFiles.includes(file.id))
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-lg">{file.icon}</span>
                            <span className="text-sm text-slate-700 font-medium truncate">
                              {file.name}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleFileSelection(file.id)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <button
                    onClick={() => {
                      setShowFileDialog(false);
                      setShowFileUploadModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload New File</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col border border-slate-200 rounded-lg">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">
                      Selected Files
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {selectedFiles.length} selected
                      </Badge>
                      {selectedFiles.length > 0 && (
                        <button
                          onClick={() => setSelectedFiles([])}
                          className="text-xs text-slate-500 hover:text-red-600 font-medium px-2 py-1 rounded-md hover:bg-red-50"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {selectedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Database className="w-16 h-16 text-slate-300 mb-3" />
                      <p className="text-base text-slate-500 font-medium">
                        No files selected
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Choose from available files on the left
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedFiles.map((fileId) => {
                        const file = availableFiles.find((f) => f.id === fileId);
                        return (
                          <div
                            key={fileId}
                            className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-lg">{file?.icon}</span>
                              <span className="text-sm text-indigo-700 font-medium truncate">
                                {file?.name}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleFileSelection(fileId)}
                              className="p-1.5 text-slate-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFileDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowFileDialog(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            </div>
          </div>
        </>
      )}

      {showFileUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowFileUploadModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Upload New File
              </h3>
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="p-1 hover:bg-slate-100 rounded-md"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {uploadSuccess && recentlyUploadedFile ? (
              <div className="border-2 border-green-500 rounded-lg p-8 text-center bg-green-50">
                <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-green-700 mb-2">
                  Upload Successful!
                </h4>
                <p className="text-green-600">{recentlyUploadedFile}</p>
              </div>
            ) : (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500"
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">
                    Click to upload files
                  </p>
                  <p className="text-sm text-slate-500">
                    CSV, Excel, JSON
                  </p>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-sm text-slate-600">
                      Uploading...
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowFileUploadModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}