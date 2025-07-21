"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Brain,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Globe,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FinancialKPIs {
  revenue_model: string;
  funding_status: string;
  market_size: string;
  revenue_projection_y1?: string | number;
  revenue_projection_y3?: string | number;
  burn_rate?: string | number;
  runway_months?: string | number;
  customer_acquisition_cost?: string | number;
  lifetime_value?: string | number;
  monthly_recurring_revenue?: string | number;
  annual_recurring_revenue?: string | number;
}

interface BusinessKPIs {
  total_addressable_market?: string | number;
  target_market_segment?: string;
  competitive_advantage: string[];
  key_partnerships: string[];
  team_size?: string | number;
  founders_experience?: string;
}

interface TractionKPIs {
  current_customers?: string | number;
  paying_customers?: string | number;
  monthly_recurring_revenue?: string | number;
  growth_rate?: string | number;
  user_engagement_metrics?: string;
  product_development_stage?: string;
  market_validation?: string;
}

interface AnalysisResult {
  startup_name: string;
  executive_summary: string;
  financial_kpis: FinancialKPIs;
  business_kpis: BusinessKPIs;
  traction_kpis: TractionKPIs;
  recommendations: string[];
  risk_assessment: "Low" | "Medium" | "High";
  investment_score: number;
  market_opportunity_score: number;
  team_score: number;
  product_score: number;
  financial_health_score: number;
}

interface KPIMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function AnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/analyze/${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Startup not found. Please check the name and try again."
          );
        }
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze startup"
      );
      setAnalysisResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-400 bg-green-400/10";
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10";
      case "High":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  // Helper function to display KPI values with fallback
  const displayKPIValue = (
    value: string | number | undefined | null,
    fallback: string = "Not enough data"
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "NA" ||
      value === "null" ||
      value === "undefined"
    ) {
      return fallback;
    }
    // Convert numbers to strings for display
    if (typeof value === "number") {
      return value.toString();
    }
    return value;
  };

  // Helper function to check if KPI has valid data
  const hasKPIData = (value: string | number | undefined | null) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "NA" ||
      value === "null" ||
      value === "undefined"
    ) {
      return false;
    }
    // Numbers are valid data
    if (typeof value === "number") {
      return true;
    }
    // Non-empty strings are valid data
    return typeof value === "string" && value.trim().length > 0;
  };

  // Component for Investment Score Gauge
  const InvestmentScoreGauge = ({ score }: { score: number }) => {
    const percentage = (score / 10) * 100;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-xs text-white/60">/ 10</div>
          </div>
        </div>
      </div>
    );
  };

  // Component for KPI Cards
  const KPICard = ({ metric }: { metric: KPIMetric }) => (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4 shadow-xl shadow-black/25">
      <div className="flex items-center justify-between mb-2">
        <metric.icon className={`w-5 h-5 ${metric.color}`} />
        {metric.trend && (
          <div
            className={`flex items-center text-xs ${
              metric.trend === "up"
                ? "text-green-400"
                : metric.trend === "down"
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {metric.trend}
          </div>
        )}
      </div>
      <div className="text-lg font-semibold text-white mb-1">
        {metric.value}
      </div>
      <div className="text-sm text-gray-400">{metric.label}</div>
    </div>
  );

  // Generate KPI metrics from analysis result
  const generateKPIMetrics = (result: AnalysisResult): KPIMetric[] => {
    return [
      {
        label: "Investment Score",
        value: `${result.investment_score}/10`,
        icon: BarChart3,
        color: getScoreColor(result.investment_score),
        trend:
          result.investment_score >= 7
            ? "up"
            : result.investment_score >= 5
            ? "stable"
            : "down",
      },
      {
        label: "Market Opportunity",
        value: `${result.market_opportunity_score}/10`,
        icon: Globe,
        color: getScoreColor(result.market_opportunity_score),
        trend: result.market_opportunity_score >= 7 ? "up" : "stable",
      },
      {
        label: "Team Quality",
        value: `${result.team_score}/10`,
        icon: Users,
        color: getScoreColor(result.team_score),
      },
      {
        label: "Product Score",
        value: `${result.product_score}/10`,
        icon: Zap,
        color: getScoreColor(result.product_score),
      },
      {
        label: "Financial Health",
        value: `${result.financial_health_score}/10`,
        icon: DollarSign,
        color: getScoreColor(result.financial_health_score),
      },
      {
        label: "Risk Level",
        value: result.risk_assessment,
        icon: AlertTriangle,
        color:
          result.risk_assessment === "Low"
            ? "text-green-400"
            : result.risk_assessment === "Medium"
            ? "text-yellow-400"
            : "text-red-400",
      },
    ];
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 pt-20 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-6 shadow-lg shadow-blue-500/25"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 tracking-tight">
              Startup Analysis
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Get AI-powered insights and analysis of startup tear sheets. Enter
              a startup name to view comprehensive analysis and recommendations.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="startup-search"
                    className="text-white text-lg font-medium flex items-center gap-2"
                  >
                    <Search className="w-5 h-5 text-blue-400" />
                    Startup Name
                  </Label>
                  <Input
                    id="startup-search"
                    type="text"
                    placeholder="Enter startup name to analyze..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    required
                    className="h-14 text-lg bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:bg-gray-800 focus:border-blue-500 transition-all duration-300"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Brain className="w-6 h-6 mr-2" />
                      Analyze Startup
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-red-400">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Header with Enhanced Score Display */}
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mb-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                      {analysisResult.startup_name}
                    </h2>
                    <p className="text-gray-400 text-lg mb-4">
                      Comprehensive Analysis Report
                    </p>
                    <div className="flex items-center gap-4">
                      <div
                        className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(
                          analysisResult.risk_assessment
                        )} backdrop-blur-sm`}
                      >
                        {analysisResult.risk_assessment} Risk
                      </div>
                      <div className="text-gray-500 text-sm">
                        Generated on {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <InvestmentScoreGauge
                      score={analysisResult.investment_score}
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      Investment Potential
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Executive Summary
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {analysisResult.executive_summary}
                  </p>
                </div>
              </div>

              {/* Detailed KPI Breakdown Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Health KPI Details */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/25">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      Financial Health Analysis
                    </h3>
                    <div className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-green-400/30">
                      Score: {analysisResult.financial_health_score}/10
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm font-medium">
                          Revenue Model
                        </span>
                        <Activity className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-white text-sm">
                        {displayKPIValue(
                          analysisResult.financial_kpis.revenue_model
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">
                          Year 1 Revenue
                        </div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis
                                .revenue_projection_y1
                            )
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis.revenue_projection_y1,
                            "NA"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">
                          Year 3 Revenue
                        </div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis
                                .revenue_projection_y3
                            )
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis.revenue_projection_y3,
                            "NA"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unit Economics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">CAC</div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis
                                .customer_acquisition_cost
                            )
                              ? "text-blue-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis
                              .customer_acquisition_cost,
                            "NA"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">LTV</div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis.lifetime_value
                            )
                              ? "text-purple-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis.lifetime_value,
                            "NA"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cash Flow */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">
                          Burn Rate
                        </div>
                        <div
                          className={`font-bold ${
                            hasKPIData(analysisResult.financial_kpis.burn_rate)
                              ? "text-red-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis.burn_rate,
                            "NA"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">Runway</div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis.runway_months
                            )
                              ? "text-yellow-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis.runway_months,
                            "NA"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MRR and ARR */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">MRR</div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis
                                .monthly_recurring_revenue
                            )
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis
                              .monthly_recurring_revenue,
                            "NA"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">ARR</div>
                        <div
                          className={`font-bold ${
                            hasKPIData(
                              analysisResult.financial_kpis
                                .annual_recurring_revenue
                            )
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.financial_kpis
                              .annual_recurring_revenue,
                            "NA"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market & Team KPI Details */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/25">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      Market & Team Analysis
                    </h3>
                    <div className="flex gap-2">
                      <div className="bg-blue-400/20 text-blue-400 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm border border-blue-400/30">
                        Market: {analysisResult.market_opportunity_score}/10
                      </div>
                      <div className="bg-purple-400/20 text-purple-400 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm border border-purple-400/30">
                        Team: {analysisResult.team_score}/10
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {/* Market Size */}
                    <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                      <div className="text-gray-400 text-xs mb-1">
                        Total Addressable Market
                      </div>
                      <div
                        className={`font-bold ${
                          hasKPIData(
                            analysisResult.business_kpis
                              .total_addressable_market
                          )
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {displayKPIValue(
                          analysisResult.business_kpis.total_addressable_market,
                          "NA"
                        )}
                      </div>
                    </div>

                    {/* Target Market */}
                    <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                      <div className="text-gray-400 text-xs mb-1">
                        Target Market Segment
                      </div>
                      <div className="text-white text-sm">
                        {displayKPIValue(
                          analysisResult.business_kpis.target_market_segment
                        )}
                      </div>
                    </div>

                    {/* Team Information */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">
                          Team Size
                        </div>
                        <div
                          className={`font-bold ${
                            hasKPIData(analysisResult.business_kpis.team_size)
                              ? "text-purple-400"
                              : "text-gray-500"
                          }`}
                        >
                          {displayKPIValue(
                            analysisResult.business_kpis.team_size,
                            "NA"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">
                          Founder Experience
                        </div>
                        <div className="text-purple-400 text-sm">
                          {displayKPIValue(
                            analysisResult.business_kpis.founders_experience,
                            "NA"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Competitive Advantages */}
                    <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                      <div className="text-gray-400 text-xs mb-2">
                        Competitive Advantages
                      </div>
                      <div className="space-y-1">
                        {analysisResult.business_kpis.competitive_advantage &&
                        analysisResult.business_kpis.competitive_advantage
                          .length > 0 &&
                        !analysisResult.business_kpis.competitive_advantage.includes(
                          "NA"
                        ) ? (
                          analysisResult.business_kpis.competitive_advantage
                            .slice(0, 3)
                            .map((advantage, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Zap className="w-3 h-3 text-yellow-400" />
                                <span className="text-white text-sm">
                                  {advantage}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="text-gray-500 text-sm">
                            Not enough data
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traction & Product KPIs */}
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/25">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Traction & Product Analysis
                  </h3>
                  <div className="bg-orange-400/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-orange-400/30">
                    Product Score: {analysisResult.product_score}/10
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Customer Metrics */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-400 text-sm">
                        Total Customers
                      </span>
                    </div>
                    <div
                      className={`font-bold text-lg ${
                        hasKPIData(
                          analysisResult.traction_kpis.current_customers
                        )
                          ? "text-orange-400"
                          : "text-gray-500"
                      }`}
                    >
                      {displayKPIValue(
                        analysisResult.traction_kpis.current_customers,
                        "NA"
                      )}
                    </div>
                  </div>

                  {/* Paying Customers */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400 text-sm">
                        Paying Customers
                      </span>
                    </div>
                    <div
                      className={`font-bold text-lg ${
                        hasKPIData(
                          analysisResult.traction_kpis.paying_customers
                        )
                          ? "text-green-400"
                          : "text-gray-500"
                      }`}
                    >
                      {displayKPIValue(
                        analysisResult.traction_kpis.paying_customers,
                        "NA"
                      )}
                    </div>
                  </div>

                  {/* Growth Rate */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400 text-sm">Growth Rate</span>
                    </div>
                    <div
                      className={`font-bold text-lg ${
                        hasKPIData(analysisResult.traction_kpis.growth_rate)
                          ? "text-green-400"
                          : "text-gray-500"
                      }`}
                    >
                      {displayKPIValue(
                        analysisResult.traction_kpis.growth_rate,
                        "NA"
                      )}
                    </div>
                  </div>

                  {/* MRR */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">
                        Monthly Recurring Revenue
                      </span>
                    </div>
                    <div
                      className={`font-bold text-lg ${
                        hasKPIData(
                          analysisResult.traction_kpis.monthly_recurring_revenue
                        )
                          ? "text-blue-400"
                          : "text-gray-500"
                      }`}
                    >
                      {displayKPIValue(
                        analysisResult.traction_kpis.monthly_recurring_revenue,
                        "NA"
                      )}
                    </div>
                  </div>

                  {/* Product Stage */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">
                        Product Development Stage
                      </span>
                    </div>
                    <div className="text-white text-sm">
                      {displayKPIValue(
                        analysisResult.traction_kpis.product_development_stage
                      )}
                    </div>
                  </div>

                  {/* User Engagement */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">
                        User Engagement
                      </span>
                    </div>
                    <div className="text-white text-sm">
                      {displayKPIValue(
                        analysisResult.traction_kpis.user_engagement_metrics
                      )}
                    </div>
                  </div>

                  {/* Market Validation */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-400 text-sm">
                        Market Validation
                      </span>
                    </div>
                    <div className="text-white text-sm">
                      {displayKPIValue(
                        analysisResult.traction_kpis.market_validation
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Recommendations Section */}
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-8 shadow-xl shadow-black/25">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <Brain className="w-6 h-6 text-blue-400" />
                    Strategic Recommendations
                  </h3>
                  <div className="bg-blue-400/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-400/30">
                    {analysisResult.recommendations.length} Action Items
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.recommendations.map(
                    (recommendation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="flex items-start gap-3 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg"
                      >
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {recommendation}
                        </p>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
