"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

export default function Home() {
  const [formData, setFormData] = useState({
    startupName: "",
    submitterName: "",
    files: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      <div className="min-h-screen gradient-bg-modern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Submission Successful!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-white/90 mb-8"
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
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
            >
              Submit Another Startup
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-modern relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10"
        />
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/10"
        />
        <motion.div
          animate={{
            y: [-20, 20, -20],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5"
        />
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
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6"
          >
            <Rocket className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
          >
            Our Big Company
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <p className="text-xl md:text-2xl text-white/90 font-light">
              Submit Your Startup for Review
            </p>
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
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
          <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl border border-white/20">
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
                  <Building2 className="w-5 h-5" />
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
                  className="h-14 text-lg bg-white/90 border-white/30 placeholder:text-gray-500 focus:bg-white focus:border-blue-400 transition-all duration-300"
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
                  <User className="w-5 h-5" />
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
                  className="h-14 text-lg bg-white/90 border-white/30 placeholder:text-gray-500 focus:bg-white focus:border-blue-400 transition-all duration-300"
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
                  <FileText className="w-5 h-5" />
                  Company Tear Sheet / Portfolio
                </Label>
                <div className="bg-white/90 rounded-xl p-1">
                  <FileUpload onFileSelect={handleFileSelect} />
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
                  className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                >
                  {isSubmitting ? (
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
                      Submit Your Startup
                      <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center mt-12"
        >
          <p className="text-white/60 text-sm">
            Secure • Confidential • Professional Review Process
          </p>
        </motion.div>
      </div>
    </div>
  );
}
