"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  FileText,
  Building2,
  CheckCircle,
  ArrowLeft,
  Upload,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";

interface StartupSearchResult {
  startup_name: string;
  submitter_name: string;
  submission_id: string;
  current_files: number;
  can_add_more: boolean;
  created_at: string;
}

interface FileDetail {
  id: number;
  original_name: string;
  file_size: number;
  file_size_mb: number;
  content_type: string;
  created_at: string;
}

interface StartupDetails {
  startup_id: number;
  submission_id: string;
  startup_name: string;
  submitter_name: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  total_files: number;
  files: FileDetail[];
  can_add_more: boolean;
  can_delete: boolean;
}

export default function EditStartupPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStartup, setSelectedStartup] = useState<StartupSearchResult | null>(null);
  const [startupDetails, setStartupDetails] = useState<StartupDetails | null>(null);
  const [searchResults, setSearchResults] = useState<StartupSearchResult[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError("");
    setSelectedStartup(null);
    setStartupDetails(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/search-startups/${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const results = await response.json();
      setSearchResults(results);
      
      if (results.length === 0) {
        setError("No startups found matching your search. Please check the name and try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search startups"
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStartup = async (startup: StartupSearchResult) => {
    setSelectedStartup(startup);
    setIsLoadingDetails(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/startup/${encodeURIComponent(startup.startup_name)}/details`
      );

      if (!response.ok) {
        throw new Error(`Failed to load startup details: ${response.status}`);
      }

      const details = await response.json();
      setStartupDetails(details);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load startup details"
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!selectedStartup || !startupDetails) return;
    
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(fileId);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/startup/${encodeURIComponent(selectedStartup.startup_name)}/file/${fileId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Delete failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh startup details after deletion
      await handleSelectStartup(selectedStartup);
      
      // Show success message briefly
      setSubmissionResult({
        success: true,
        message: result.message,
        action: "delete"
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmissionResult(null);
      }, 3000);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete file"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartup || files.length === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        `http://localhost:8000/api/add-files/${encodeURIComponent(selectedStartup.startup_name)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setSubmissionResult(result);
      setIsSubmitted(true);
      
      // Refresh startup details after adding files
      await handleSelectStartup(selectedStartup);
      
      // Clear files after successful upload
      setFiles([]);
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload files"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedStartup(null);
    setStartupDetails(null);
    setSearchResults([]);
    setFiles([]);
    setIsSubmitted(false);
    setSubmissionResult(null);
    setError("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (contentType: string) => {
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('word') || contentType?.includes('doc')) return '📝';
    if (contentType?.includes('powerpoint') || contentType?.includes('ppt')) return '📊';
    if (contentType?.includes('text')) return '📋';
    return '📁';
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!isSubmitted || !submissionResult) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Files Added Successfully!</h3>
            <p className="text-gray-300 mb-4">
              Added {submissionResult.newly_added_files} file(s) to{" "}
              <span className="text-blue-400 font-semibold">
                {submissionResult.startup_name}
              </span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Total files: {submissionResult.total_files} / 3
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2"
            >
              Continue Editing
            </Button>
          </div>
        </motion.div>
      </div>
    );
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

      <SuccessModal />

      <div className="relative z-10 container mx-auto px-4 py-12 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submit Startup
          </Link>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-6 shadow-lg shadow-blue-500/25"
          >
            <Edit className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 tracking-tight"
          >
            Edit Startup
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Manage your startup submission - add new documents, delete existing files, or view current status.
          </motion.p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Step 1: Search for Startup */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <Search className="w-6 h-6 text-blue-400" />
              Step 1: Find Your Startup
            </h2>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter startup name to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-14 text-lg bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:bg-gray-800 focus:border-blue-500 transition-all duration-300"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="h-14 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-500/25"
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium text-white">Search Results:</h3>
                {searchResults.map((startup) => (
                  <motion.div
                    key={startup.submission_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedStartup?.submission_id === startup.submission_id
                        ? "bg-blue-600/20 border-blue-500"
                        : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                    }`}
                    onClick={() => handleSelectStartup(startup)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        <div>
                          <h4 className="font-semibold text-white">{startup.startup_name}</h4>
                          <p className="text-sm text-gray-400">by {startup.submitter_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          startup.can_add_more ? "text-green-400" : "text-red-400"
                        }`}>
                          {startup.current_files}/3 files
                        </div>
                        {!startup.can_add_more && (
                          <p className="text-xs text-red-400">Max files reached</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Startup Details & File Management */}
          {selectedStartup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/50"
            >
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Eye className="w-6 h-6 text-green-400" />
                Step 2: Manage Startup Files
              </h2>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : startupDetails ? (
                <div className="space-y-6">
                  {/* Startup Info Header */}
                  <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold text-white text-lg">{startupDetails.startup_name}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Submitted by {startupDetails.submitter_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            Created: {formatDate(startupDetails.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          {startupDetails.total_files}/3
                        </div>
                        <div className="text-sm text-gray-400">Files uploaded</div>
                        <div className={`text-sm font-medium mt-2 ${
                          startupDetails.can_add_more ? "text-green-400" : "text-red-400"
                        }`}>
                          {startupDetails.can_add_more 
                            ? `${3 - startupDetails.total_files} more files allowed`
                            : "Maximum files reached"
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Files List */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      Current Files ({startupDetails.total_files})
                    </h3>
                    
                    <div className="space-y-3">
                      <AnimatePresence>
                        {startupDetails.files.map((file) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="flex items-center justify-between p-4 bg-gray-800/40 border border-gray-700 rounded-lg hover:bg-gray-800/60 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">
                                {getFileIcon(file.content_type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{file.original_name}</h4>
                                <p className="text-sm text-gray-400">
                                  {file.file_size_mb} MB • Uploaded {formatDate(file.created_at)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleDeleteFile(file.id, file.original_name)}
                                disabled={isDeleting === file.id || !startupDetails.can_delete}
                                variant="outline"
                                size="sm"
                                className={`border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300 ${
                                  !startupDetails.can_delete ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {isDeleting === file.id ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
                                  />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    
                    {!startupDetails.can_delete && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
                        <p className="text-yellow-400 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Cannot delete files when only 1 remains. At least 1 file is required for analysis.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add New Files Section */}
                  {startupDetails.can_add_more && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-green-400" />
                        Add New Files
                      </h3>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-1 backdrop-blur-sm">
                          <FileUpload 
                            onFileSelect={handleFileSelect} 
                            maxFiles={3}
                            currentFiles={startupDetails.total_files}
                          />
                        </div>

                        {files.length > 0 && (
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shadow-lg shadow-green-500/25"
                          >
                            {isSubmitting ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mr-2" />
                                Add {files.length} File{files.length !== 1 ? 's' : ''} to {startupDetails.startup_name}
                              </>
                            )}
                          </Button>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Success Message for Delete */}
          {submissionResult && submissionResult.action === "delete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center backdrop-blur-sm"
            >
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-green-400">{submissionResult.message}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center backdrop-blur-sm"
            >
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
