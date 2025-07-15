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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalysisResult {
  startup_name: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  financial_highlights: {
    revenue_model: string;
    funding_status: string;
    market_size: string;
  };
  recommendations: string[];
  risk_assessment: "Low" | "Medium" | "High";
  investment_score: number;
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

  return (
    <div className="min-h-screen gradient-bg-modern pt-20 px-4 pb-12">
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Startup Analysis
          </h1>

          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Get AI-powered insights and analysis of startup tear sheets. Enter a
            startup name to view comprehensive analysis and recommendations.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="glass rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-white/20">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="startup-search"
                  className="text-white text-lg font-medium flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Startup Name
                </Label>
                <Input
                  id="startup-search"
                  type="text"
                  placeholder="Enter startup name to analyze..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                  className="h-14 text-lg bg-white/90 border-white/30 placeholder:text-gray-500 focus:bg-white focus:border-blue-400 transition-all duration-300"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="w-full h-14 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
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
            className="space-y-6"
          >
            {/* Header with Score */}
            <div className="glass rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {analysisResult.startup_name}
                  </h2>
                  <p className="text-white/80">Comprehensive Analysis Report</p>
                </div>
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold ${getScoreColor(
                      analysisResult.investment_score
                    )}`}
                  >
                    {analysisResult.investment_score}/10
                  </div>
                  <p className="text-white/60 text-sm">Investment Score</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Executive Summary
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Revenue Model
                  </h3>
                </div>
                <p className="text-white/80">
                  {analysisResult.financial_highlights.revenue_model}
                </p>
              </div>

              <div className="glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Funding Status
                  </h3>
                </div>
                <p className="text-white/80">
                  {analysisResult.financial_highlights.funding_status}
                </p>
              </div>

              <div className="glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Market Size
                  </h3>
                </div>
                <p className="text-white/80">
                  {analysisResult.financial_highlights.market_size}
                </p>
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  Strengths
                </h3>
                <ul className="space-y-3">
                  {analysisResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-white/90">{strength}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-3">
                  {analysisResult.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-white/90">{weakness}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations and Risk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  Recommendations
                </h3>
                <ul className="space-y-3">
                  {analysisResult.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-white/90">{recommendation}</p>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="glass rounded-xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Risk Assessment
                </h3>
                <div className="text-center">
                  <div
                    className={`inline-flex px-4 py-2 rounded-full text-lg font-semibold ${getRiskColor(
                      analysisResult.risk_assessment
                    )}`}
                  >
                    {analysisResult.risk_assessment} Risk
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
