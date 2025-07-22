"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building2,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { ValidationErrorModal } from "@/components/ui/validation-error-modal";

export default function Home() {
  const [formData, setFormData] = useState({
    startupName: "",
    submitterName: "",
    files: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileSelect = (files: File[]) => {
    setFormData((prev) => ({
      ...prev,
      files,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create FormData object for file upload
    const formDataToSend = new FormData();
    formDataToSend.append("startup_name", formData.startupName);
    formDataToSend.append("submitter_name", formData.submitterName);

    // Append all files with the same field name 'files'
    formData.files.forEach((file) => {
      formDataToSend.append("files", file);
    });

    try {
      // Submit to FastAPI backend
      const response = await fetch("http://localhost:8000/api/submit-startup", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle file validation errors (422)
        if (
          response.status === 422 &&
          errorData.detail &&
          typeof errorData.detail === "object"
        ) {
          setValidationError(errorData.detail);
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Submission successful:", result);

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        "Failed to submit. Please make sure the backend server is running on port 8000."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 mb-6 shadow-lg shadow-green-500/25"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
          >
            Submission Successful!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gray-300 mb-8 leading-relaxed"
          >
            Thank you for submitting your startup information. We'll review your
            materials and get back to you soon!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({ startupName: "", submitterName: "", files: [] });
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300"
            >
              Submit Another Startup
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
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
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-6 shadow-lg shadow-blue-500/25"
          >
            <Rocket className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 tracking-tight"
          >
            Our Big Company
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <p className="text-xl md:text-2xl text-gray-300 font-light">
              Submit Your Startup for Review
            </p>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Join the next generation of innovative startups. Share your vision,
            upload your materials, and let us help accelerate your journey to
            success.
          </motion.p>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Startup Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="space-y-3"
              >
                <Label
                  htmlFor="startupName"
                  className="text-white text-lg font-medium flex items-center gap-2"
                >
                  <Building2 className="w-5 h-5 text-blue-400" />
                  Startup Name
                </Label>
                <Input
                  id="startupName"
                  name="startupName"
                  type="text"
                  placeholder="Enter your startup name"
                  value={formData.startupName}
                  onChange={handleInputChange}
                  required
                  className="h-14 text-lg bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:bg-gray-800 focus:border-blue-500 transition-all duration-300"
                />
              </motion.div>

              {/* Submitter Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
                className="space-y-3"
              >
                <Label
                  htmlFor="submitterName"
                  className="text-white text-lg font-medium flex items-center gap-2"
                >
                  <User className="w-5 h-5 text-purple-400" />
                  Your Name
                </Label>
                <Input
                  id="submitterName"
                  name="submitterName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.submitterName}
                  onChange={handleInputChange}
                  required
                  className="h-14 text-lg bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:bg-gray-800 focus:border-purple-500 transition-all duration-300"
                />
              </motion.div>

              {/* File Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
                className="space-y-3"
              >
                <Label className="text-white text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  Company Documents (Up to 3 files)
                </Label>
                <p className="text-sm text-gray-400 mb-3">
                  Upload your cap table, financial statements, tear sheet, pitch
                  deck, or other relevant documents
                </p>
                <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-1 backdrop-blur-sm">
                  <FileUpload onFileSelect={handleFileSelect} maxFiles={3} />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.startupName ||
                    !formData.submitterName
                  }
                  className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shadow-lg shadow-blue-500/25"
                >
                  {isSubmitting ? (
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
                      Submit Your Startup
                      <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Edit Startup Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm mb-2">
                Already submitted your startup?
              </p>
              <Link
                href="/add-files"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Edit startup & manage files
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm">
            Secure • Confidential • Professional Review Process
          </p>
        </motion.div>
      </div>

      {/* Validation Error Modal */}
      <ValidationErrorModal
        validationError={validationError}
        onClose={() => setValidationError(null)}
      />
    </div>
  );
}
