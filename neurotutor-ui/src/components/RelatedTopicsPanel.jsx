import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import {
  BookOpen,
  ExternalLink,
  ArrowRight,
  Clock,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { questionAPI } from "../services/api";

const RelatedTopicsPanel = ({
  currentConcept,
  conceptMap,
  onTopicSelect,
  className = "",
}) => {
  const [expandedSections, setExpandedSections] = useState({
    prerequisites: false,
    successors: false,
    related: false,
  });
  const [materialLoading, setMaterialLoading] = useState(null); // concept being loaded

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getMaterialLink = (concept) => {
    // Return the API endpoint for course material (without /api/ prefix since it's in base URL)
    return `/course/material/?concept=${concept}`;
  };

  const handleMaterialClick = async (concept, e) => {
    e.stopPropagation();
    setMaterialLoading(concept);
    try {
      const response = await questionAPI.get(getMaterialLink(concept));

      // Course material is markdown; parse in-app and render in a styled popup (NeuroTutor theme)
      const rawMarkdown = response.data.content;
      marked.setOptions({ gfm: true, breaks: true });
      const htmlContent = marked.parse(rawMarkdown ?? "");
      // Avoid </script> breaking the document when injected
      const safeHtml = String(htmlContent).replace(/<\/script>/gi, "</scr" + "ipt>");
      const safeConceptTitle = concept.replace(/_/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const newWindow = window.open("", "_blank");
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${safeConceptTitle} — NeuroTutor</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              background: #05050a;
              min-height: 100vh;
              color: #e2e8f0;
              line-height: 1.7;
            }
            .bg-blur { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
            .bg-blur-1 { top: -20%; right: -10%; width: 50%; height: 50%; background: rgba(0,243,255,0.06); border-radius: 50%; filter: blur(100px); }
            .bg-blur-2 { bottom: -20%; left: -10%; width: 45%; height: 45%; background: rgba(188,19,254,0.06); border-radius: 50%; filter: blur(100px); }
            .wrap { max-width: 820px; margin: 0 auto; padding: 24px 20px 48px; }
            .card {
              background: rgba(255,255,255,0.04);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 24px 48px rgba(0,0,0,0.4);
            }
            .header {
              padding: 32px 40px;
              text-align: center;
              border-bottom: 1px solid rgba(255,255,255,0.06);
              background: linear-gradient(180deg, rgba(0,243,255,0.06) 0%, transparent 100%);
            }
            .logo { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: linear-gradient(135deg, #22d3ee, #2563eb); border-radius: 12px; color: #05050a; font-weight: 800; font-size: 1.4rem; margin-bottom: 12px; box-shadow: 0 0 24px rgba(0,243,255,0.25); }
            .header h1 { font-size: 1.75rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; margin-bottom: 4px; }
            .header .sub { font-size: 0.875rem; color: #94a3b8; }
            .content { padding: 40px 44px; }
            .content h1 { font-size: 1.6rem; color: #f1f5f9; margin: 2rem 0 1rem; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .content h1:first-child { margin-top: 0; }
            .content h2 { font-size: 1.35rem; color: #e2e8f0; margin: 1.75rem 0 0.75rem; }
            .content h3 { font-size: 1.15rem; color: #cbd5e1; margin: 1.5rem 0 0.6rem; }
            .content h4 { font-size: 1.05rem; color: #94a3b8; margin: 1.25rem 0 0.5rem; }
            .content p { margin-bottom: 1rem; color: #94a3b8; font-size: 0.9875rem; }
            .content ul, .content ol { margin: 1rem 0; padding-left: 1.5rem; }
            .content li { margin-bottom: 0.4rem; color: #94a3b8; }
            .content ul li::marker { color: #22d3ee; }
            .content ol li::marker { color: #22d3ee; font-weight: 600; }
            .content code { font-family: 'JetBrains Mono', monospace; background: rgba(0,243,255,0.1); color: #67e8f9; padding: 0.2em 0.45em; border-radius: 6px; font-size: 0.9em; border: 1px solid rgba(0,243,255,0.2); }
            .content pre { background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem 1.5rem; margin: 1.25rem 0; overflow-x: auto; }
            .content pre code { background: none; color: #e2e8f0; padding: 0; border: none; font-size: 0.9rem; line-height: 1.6; }
            .content blockquote { margin: 1.25rem 0; padding: 1rem 1.25rem; border-left: 4px solid #22d3ee; background: rgba(0,243,255,0.06); border-radius: 0 10px 10px 0; color: #94a3b8; font-style: italic; }
            .content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
            .content th, .content td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .content th { background: rgba(0,243,255,0.08); color: #67e8f9; font-weight: 600; font-size: 0.85rem; }
            .content td { color: #94a3b8; font-size: 0.9375rem; }
            .content tr:last-child td { border-bottom: none; }
            .content a { color: #22d3ee; text-decoration: none; border-bottom: 1px solid transparent; transition: color 0.2s, border-color 0.2s; }
            .content a:hover { color: #67e8f9; border-bottom-color: #67e8f9; }
            .content strong, .content b { color: #e2e8f0; font-weight: 600; }
            .content hr { border: none; height: 1px; background: rgba(255,255,255,0.08); margin: 1.5rem 0; }
            @media (max-width: 640px) { .wrap { padding: 16px 12px 32px; } .header, .content { padding: 24px 20px; } .header h1 { font-size: 1.4rem; } }
          </style>
        </head>
        <body>
          <div class="bg-blur bg-blur-1"></div>
          <div class="bg-blur bg-blur-2"></div>
          <div class="wrap">
            <div class="card">
              <div class="header">
                <div class="logo">N</div>
                <h1>${safeConceptTitle}</h1>
                <div class="sub">Course material · NeuroTutor</div>
              </div>
              <div class="content">${safeHtml}</div>
            </div>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.error("Error loading course material:", error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      alert(`Failed to load course material: ${errorMessage}`);
    } finally {
      setMaterialLoading(null);
    }
  };

  const getTopicIcon = (type) => {
    switch (type) {
      case "prerequisites":
        return <Target className="w-4 h-4 text-blue-400" />;
      case "successors":
        return <ArrowRight className="w-4 h-4 text-green-400" />;
      case "related":
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-400" />;
    }
  };
  const getTopicColor = (type) => {
    switch (type) {
      case "prerequisites":
        return "border-blue-500/30 bg-blue-500/10";
      case "successors":
        return "border-green-500/30 bg-green-500/10";
      case "related":
        return "border-purple-500/30 bg-purple-500/10";
      default:
        return "border-gray-500/30 bg-gray-500/10";
    }
  };

  const handleTopicClick = (concept) => {
    if (onTopicSelect) {
      onTopicSelect(concept);
    }
  };

  if (!conceptMap || !currentConcept) {
    return null;
  }

  return (
    <div className={`related-topics-panel ${className}`}>
      <div className="space-y-4">
        {/* Prerequisites Section */}
        {conceptMap.prerequisites && conceptMap.prerequisites.length > 0 && (
          <div
            className={`border rounded-lg ${getTopicColor("prerequisites")}`}
          >
            <button
              onClick={() => toggleSection("prerequisites")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getTopicIcon("prerequisites")}
                <div>
                  <h3 className="font-semibold text-white">Prerequisites</h3>
                  <p className="text-sm text-gray-400">
                    {conceptMap.prerequisites.length} topics to review first
                  </p>
                </div>
              </div>
              {expandedSections.prerequisites ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.prerequisites && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-2">
                    {conceptMap.prerequisites.map((concept, index) => (
                      <motion.div
                        key={concept}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group"
                        onClick={() => handleTopicClick(concept)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white capitalize">
                              {concept.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-400">
                              Foundation topic
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleMaterialClick(concept, e)}
                            disabled={materialLoading === concept}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                            title="Learn more — crash-course material"
                          >
                            {materialLoading === concept ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                          <ExternalLink
                            className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0"
                            title="Click row to practice"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Successors Section */}
        {conceptMap.successors && conceptMap.successors.length > 0 && (
          <div className={`border rounded-lg ${getTopicColor("successors")}`}>
            <button
              onClick={() => toggleSection("successors")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getTopicIcon("successors")}
                <div>
                  <h3 className="font-semibold text-white">Next Topics</h3>
                  <p className="text-sm text-gray-400">
                    {conceptMap.successors.length} topics to learn next
                  </p>
                </div>
              </div>
              {expandedSections.successors ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.successors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-2">
                    {conceptMap.successors.map((concept, index) => (
                      <motion.div
                        key={concept}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group"
                        onClick={() => handleTopicClick(concept)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white capitalize">
                              {concept.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-400">
                              Continue learning
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleMaterialClick(concept, e)}
                            disabled={materialLoading === concept}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                            title="Learn more — crash-course material"
                          >
                            {materialLoading === concept ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                          <ExternalLink
                            className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0"
                            title="Click row to practice"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Related Topics Section */}
        {conceptMap.related && conceptMap.related.length > 0 && (
          <div className={`border rounded-lg ${getTopicColor("related")}`}>
            <button
              onClick={() => toggleSection("related")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getTopicIcon("related")}
                <div>
                  <h3 className="font-semibold text-white">Related Topics</h3>
                  <p className="text-sm text-gray-400">
                    {conceptMap.related.length} related concepts
                  </p>
                </div>
              </div>
              {expandedSections.related ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.related && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-2">
                    {conceptMap.related.slice(0, 6).map((concept, index) => (
                      <motion.div
                        key={concept}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group"
                        onClick={() => handleTopicClick(concept)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white capitalize">
                              {concept.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-400">
                              Explore further
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleMaterialClick(concept, e)}
                            disabled={materialLoading === concept}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                            title="Learn more — crash-course material"
                          >
                            {materialLoading === concept ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                          <ExternalLink
                            className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0"
                            title="Click row to practice"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Study Tips */}
        <div className="border border-gray-500/30 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">
                Study Path Recommendation
              </h4>
              <p className="text-sm text-gray-300 mb-3">
                Based on your current topic, we recommend mastering
                prerequisites first, then exploring related concepts before
                moving to successors.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Estimated: 2-4 hours per topic</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Focus on understanding core concepts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedTopicsPanel;
