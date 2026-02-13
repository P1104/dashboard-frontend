/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */

"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowLeft, Settings, Key, User, Shield, Bell, Globe,Wallet,ToggleLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {url } from "@/src/services/api/api-url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import ReactECharts from "echarts-for-react";





export function SettingsPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  // const [totalTokens, setTotalTokens] = useState<number>(500);
  // const [remainingTokens, setRemainingTokens] = useState<number>(100);
const [credits, setCredits] = useState(1);
const [availableCredits, setAvailableCredits] = useState(500);
const [loading, setLoading] = useState(false);


const [showAnalytics, setShowAnalytics] = useState(false);
const [chartType, setChartType] = useState<"bar" | "line">("bar");

const [selectedFile] = useState("sales_data_2026.csv");

const [cleanOptions, setCleanOptions] = useState({
  keepNulls: false,
  removeDuplicates: false,
  normalizeColumns: false,
  trimWhitespace: false,
});

  useEffect(() => {
    // Get user email from localStorage
    const email = localStorage.getItem("user_email") || "Not logged in";
    setUserEmail(email);
    const name = localStorage.getItem("user_name") || "User";
    setUserName(name);
    
    // TODO: Fetch token info from backend when available
    // For now, using hardcoded values
  }, []);
const purchaseCredits = async () => {
  if (credits < 1) return;

  setLoading(true);

  try {
    const orderResponse = await fetch(
      `${url}/payment/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits,
          user_id: "current_user_id",
        }),
      }
    );

    const order = await orderResponse.json();

    const options = {
      key: "rzp_test_SE0YAyn0Zv15Qy",
      amount: order.amount,
      currency: order.currency,
      name: "ADRO",
      description: `Purchase ${credits} credits`,
      order_id: order.id,

      handler: async function (response: any) {
        const verifyResponse = await fetch(
          `${url}/payment/verify-payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          }
        );

        const result = await verifyResponse.json();

        if (result.status === "success") {
          setAvailableCredits((prev) => prev + credits);
        }

        setLoading(false);
      },

      theme: {
        color: "#4f46e5",
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();

    paymentObject.on("payment.failed", function () {
      setLoading(false);
    });

  } catch (error) {
    console.error("Payment error:", error);
    setLoading(false);
  }
};

  const handleBack = () => {
    router.back();
  };

  const getChartOption = () => {
  if (chartType === "bar") {
    return {
      xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: [
            120,
            {
              value: 200,
              itemStyle: {
                color: "#505372",
              },
            },
            150,
            80,
            70,
            110,
            130,
          ],
          type: "bar",
        },
      ],
    };
  }

  return {
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: "line",
        smooth: true,
      },
    ],
  };
};
const handleCheckboxChange = (key: string) => {
  setCleanOptions((prev) => ({
    ...prev,
    [key]: !prev[key as keyof typeof prev],
  }));
};

const handleCleanSubmit = () => {
  console.log("Selected cleaning options:", cleanOptions);
};

  return (
    <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className=" p-6">
      <div className="w-full h-fullmx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
        </div>

        {/* Settings Cards */}
        <div className=" w-150m h-150 flex gap-5 flex-wrap">
          {/* User Profile Card */}
          <div className="w-100 h-110">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-600">Logged in as</p>
                  <p className="text-lg font-semibold text-slate-800">{userEmail}</p>
                  <p className="text-lg font-semibold text-slate-800">{userName}</p>
                </div>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Data Cleaning Card */}
<div className="w-100 mt-6">
  <Card className="shadow-sm rounded-2xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        🧹 Data Cleaning
      </CardTitle>
      <CardDescription>
        Prepare your dataset before running analytics
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">

      {/* Current File */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">Current File</p>
        <p className="font-medium text-slate-800 mt-1">
          {selectedFile}
        </p>
      </div>

      {/* Cleaning Options */}
      <div className="space-y-4 text-sm">

        <label className="flex items-center justify-between">
          <span>Keep null values</span>
          <input
            type="checkbox"
            checked={cleanOptions.keepNulls}
            onChange={() => handleCheckboxChange("keepNulls")}
          />
        </label>

        <label className="flex items-center justify-between">
          <span>Remove duplicate rows</span>
          <input
            type="checkbox"
            checked={cleanOptions.removeDuplicates}
            onChange={() => handleCheckboxChange("removeDuplicates")}
          />
        </label>

        <label className="flex items-center justify-between">
          <span>Normalize column names</span>
          <input
            type="checkbox"
            checked={cleanOptions.normalizeColumns}
            onChange={() => handleCheckboxChange("normalizeColumns")}
          />
        </label>

        <label className="flex items-center justify-between">
          <span>Trim whitespace from cells</span>
          <input
            type="checkbox"
            checked={cleanOptions.trimWhitespace}
            onChange={() => handleCheckboxChange("trimWhitespace")}
          />
        </label>

      </div>

      {/* Submit Button */}
      <Button
        onClick={handleCleanSubmit}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
      >
        Apply Cleaning
      </Button>

    </CardContent>
  </Card>
</div>


          </div>

          
{/* {credits card} */}
<div className="w-full max-w-4xl">
  <Card className="rounded-3xl border border-slate-200 shadow-xl bg-white overflow-hidden">

    {/* Top Accent */}
   

    <CardContent className="pt-5 pb-8 px-8">

      <div className="grid grid-cols-2 gap-10 items-start">

        {/* LEFT SIDE – Credits Summary */}
        <div className="space-y-6">
          <div className="space-y-1">
  <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
    <Wallet className="w-5 h-5 text-slate-600" />
    Credits
  </div>

  <p className="text-sm text-slate-500 leading-relaxed max-w-md">
    Credits are used to run data queries, generate dashboards, and perform predictive analytics.Pay as you Use!
  </p>
</div>


          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-slate-500">Available Credits</p>
            <p className="text-5xl font-bold text-slate-900 mt-2">
              {availableCredits}
            </p>
          </div>
<Dialog>
  <DialogTrigger asChild>
    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 shadow-md">
      Add Credits
    </Button>
  </DialogTrigger>

  <DialogContent className="rounded-2xl max-w-md">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">
        Purchase Credits
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-6 mt-4">

      {/* Increment Field */}
      <div className="flex items-center justify-between border rounded-xl px-4 py-3">
        <Button
          variant="ghost"
          onClick={() => setCredits((prev) => Math.max(1, prev - 1))}
          className="text-xl"
        >
          -
        </Button>

        <Input
          type="number"
          min="1"
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          className="text-center border-none focus-visible:ring-0 text-lg font-semibold"
        />

        <Button
          variant="ghost"
          onClick={() => setCredits((prev) => prev + 1)}
          className="text-xl"
        >
          +
        </Button>
      </div>

      {/* Purchase Button */}
      <Button
        onClick={purchaseCredits}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 shadow-md"
      >
        {loading ? "Processing..." : `Purchase ₹${credits}`}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Secure payment powered by Razorpay
      </p>

    </div>
  </DialogContent>
</Dialog>

        </div>

        {/* RIGHT SIDE – History + Analytics */}
        <div className="space-y-6">

          <div>
            <p className="text-sm font-semibold text-slate-800 mb-4">
              Recent Activity
            </p>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex justify-between border-b pb-2">
                <span>Jan 24, 2026</span>
                <span className="text-red-500 font-medium">-50</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span>Feb 12, 2026</span>
                <span className="text-red-500 font-medium">-400</span>
              </div>

              <div className="flex justify-between">
                <span>Mar 03, 2026</span>
                <span className="text-red-500 font-medium">-120</span>
              </div>
            </div>
          </div>

         <Button
  variant="outline"
  className="rounded-xl border-slate-300 hover:bg-slate-50"
  onClick={() => setShowAnalytics((prev) => !prev)}
>
  {showAnalytics ? "Hide Usage Analytics" : "View Usage Analytics"}
</Button>


        </div>

      </div>

    </CardContent>
  </Card>
  {showAnalytics && (
  <Card className="mt-5 rounded-3xl border border-slate-200 shadow-lg bg-white shadow-xl overflow-hidden h-120">
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Usage Analytics</CardTitle>
        <CardDescription>
          usage trends for your credit consumption
        </CardDescription>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={chartType === "bar" ? "default" : "outline"}
          onClick={() => setChartType("bar")}
        >
          Bar
        </Button>
        <Button
          size="sm"
          variant={chartType === "line" ? "default" : "outline"}
          onClick={() => setChartType("line")}
        >
          Line
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <ReactECharts
        option={getChartOption()}
        style={{ height: "350px", width: "100%" }}
      />
    </CardContent>
  </Card>
)}

</div>


{/* 
          Preferences Card */}
          {/* <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Email Notifications</p>
                  <p className="text-sm text-slate-600">Receive updates about your dashboard</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Dark Mode</p>
                  <p className="text-sm text-slate-600">Switch to dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </CardContent>
          </Card> */}

          {/* System Card */}
          {/* <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System
              </CardTitle>
              <CardDescription>Application information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Version</p>
                  <p className="font-semibold text-slate-800">1.0.0</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Last Updated</p>
                  <p className="font-semibold text-slate-800">March 2024</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-slate-300">
                  <Globe className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" className="flex-1 border-slate-300">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Policy
                </Button>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
    </>
  );
}
