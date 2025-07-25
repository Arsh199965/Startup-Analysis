import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "./button";

interface ValidationError {
  message: string;
  errors: string[];
  warnings: string[];
  file_analyses: Array<{
    filename: string;
    is_financial: boolean;
    detected_type: string;
    financial_score: number;
    startup_consistent: boolean;
    startup_score: number;
    red_flags: string[];
  }>;
}

interface ValidationErrorModalProps {
  validationError: ValidationError | null;
  onClose: () => void;
}

export function ValidationErrorModal({
  validationError,
  onClose,
}: ValidationErrorModalProps) {
  if (!validationError) return null;

  const getScoreColor = (score: number, isFinancial: boolean) => {
    if (!isFinancial) return "text-red-400";
    if (score >= 5) return "text-green-400";
    if (score >= 3) return "text-yellow-400";
    return "text-red-400";
  };

  const getDetectedTypeIcon = (detectedType: string) => {
    if (detectedType.includes("non_financial")) return "❌";
    if (detectedType.includes("financial")) return "✅";
    if (detectedType.includes("potentially")) return "⚠️";
    return "❓";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-red-500/30 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-red-500/10 border-b border-red-500/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <h3 className="text-xl font-bold text-white">
                File Validation Failed
              </h3>
              <p className="text-gray-300 text-sm">{validationError.message}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Errors */}
          {validationError.errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Errors ({validationError.errors.length})
              </h4>
              <ul className="space-y-2">
                {validationError.errors.map((error, index) => (
                  <li
                    key={index}
                    className="text-red-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-1">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationError.warnings.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Warnings ({validationError.warnings.length})
              </h4>
              <ul className="space-y-2">
                {validationError.warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="text-yellow-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* File Analysis */}
          {validationError.file_analyses.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Analysis ({validationError.file_analyses.length} files)
              </h4>

              <div className="space-y-4">
                {validationError.file_analyses.map((analysis, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getDetectedTypeIcon(analysis.detected_type)}
                        </span>
                        <div>
                          <h5 className="font-semibold text-white">
                            {analysis.filename}
                          </h5>
                          <p className="text-sm text-gray-400 capitalize">
                            {analysis.detected_type.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            analysis.is_financial
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {analysis.is_financial
                            ? "Financial"
                            : "Non-Financial"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Financial Score:</span>
                        <span
                          className={`ml-2 font-semibold ${getScoreColor(
                            analysis.financial_score,
                            analysis.is_financial
                          )}`}
                        >
                          {analysis.financial_score}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">
                          Startup Consistency:
                        </span>
                        <span
                          className={`ml-2 font-semibold ${
                            analysis.startup_consistent
                              ? "text-green-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {(analysis.startup_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {analysis.red_flags.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <span className="text-red-400 text-sm font-medium">
                          Red Flags:{" "}
                        </span>
                        <span className="text-red-300 text-sm">
                          {analysis.red_flags.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recommendations
            </h4>
            <ul className="space-y-2 text-green-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Upload financial documents such as balance sheets, income
                  statements, or cap tables
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Ensure all documents are related to the same startup and
                  contain the startup name
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Supported formats: PDF
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Avoid uploading personal documents, images, or non-business
                  related content
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2"
          >
            Try Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
