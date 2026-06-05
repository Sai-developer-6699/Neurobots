import React, { useState } from "react";
import { questionAPI } from "../services/api";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

const DebugPanel = ({
  question,
  masteryData,
  reviewStats,
  userData,
  heatmapData,
  agentLatencies,
  setAgentLatencies,
  setConceptMap,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Test function to fetch concept map and verify agent latencies
  const testConceptMap = async () => {
    console.log("Testing concept map API...");
    try {
      const concept = question?.concept || "arrays";
      console.log("Testing with concept:", concept);

      // Call the concept map API
      const response = await questionAPI.get("/api/concept/map/", {
        params: { concept },
      });
      console.log("Concept map API response:", response.data);

      if (response.data.latencies) {
        setAgentLatencies(response.data.latencies);
        console.log("Agent latencies set from test:", response.data.latencies);
      }

      if (response.data.prerequisites || response.data.successors) {
        setConceptMap(response.data);
        console.log("Concept map set from test:", response.data);
      }
    } catch (error) {
      console.error("Error testing concept map:", error);
    }
  };

  // Compact status indicators
  const getStatusIndicator = (data, label) => {
    const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className={`text-xs font-mono ${hasData ? "text-green-400" : "text-red-400"}`}>
          {hasData ? "✓" : "✗"}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/95 border border-white/20 rounded-lg p-2 text-xs text-white max-w-xs z-50 shadow-xl backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full hover:bg-white/5 rounded p-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug size={12} className="text-cyan-400" />
          <span className="font-medium text-cyan-400 text-xs">Debug</span>
        </div>
        {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronUp size={12} className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
          {getStatusIndicator(question, "Question")}
          {getStatusIndicator(masteryData?.concepts, "Mastery")}
          {getStatusIndicator(reviewStats, "Review")}
          {getStatusIndicator(userData, "User")}
          {getStatusIndicator(heatmapData, "Heatmap")}
          {getStatusIndicator(agentLatencies, "Agents")}
          
          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="text-gray-500 text-xs">Console: Check browser logs</div>
            <button
              onClick={testConceptMap}
              className="w-full px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs transition-colors"
            >
              Test API
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
