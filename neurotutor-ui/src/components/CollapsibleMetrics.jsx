import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Target,
  TrendingUp,
} from "lucide-react";
import MasteryChart from "./MasteryChart.jsx";

const CollapsibleMetrics = ({
  masteryData,
  heatmapData,
  reviewStats,
  userData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter heatmap data to show only last 6 months
  const getLast6MonthsData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return data
      .filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= sixMonthsAgo;
      })
      .slice(-42); // Last 6 weeks (6 months * ~7 weeks)
  };

  const filteredHeatmapData = getLast6MonthsData(heatmapData);

  return (
    <div className="collapsible-metrics">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full glass p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white">
                Learning Analytics
              </h3>
              <p className="text-xs text-gray-400">
                {isExpanded ? "Hide detailed metrics" : "Show detailed metrics"}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronUp size={16} className="text-gray-400" />
          </motion.div>
        </div>
      </motion.button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-4 space-y-4"
          >
            {/* Mastery Overview */}
            {masteryData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-6 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Target size={18} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Mastery Overview
                    </h4>
                    <p className="text-sm text-gray-400">
                      Track your learning progress
                    </p>
                  </div>
                </div>
                <MasteryChart concepts={masteryData?.concepts || []} />
              </motion.div>
            )}

            {/* Progress Heatmap - Last 6 Months */}
            {filteredHeatmapData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Activity size={18} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Progress Heatmap
                    </h4>
                    <p className="text-sm text-gray-400">
                      Last 6 months of activity
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={i} className="text-center text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {filteredHeatmapData.slice(-28).map((day, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-sm ${
                          day.count > 0
                            ? day.count > 5
                              ? "bg-green-500"
                              : day.count > 2
                                ? "bg-green-400"
                                : "bg-green-300"
                            : "bg-gray-700"
                        }`}
                        title={`${day.date}: ${day.count} questions`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {/* Overall Progress Card */}
              <div className="glass p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-gray-300">
                    Overall Progress
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {masteryData?.overall_progress || 0}%
                </p>
              </div>

              {/* Review Queue Card */}
              <div className="glass p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    Review Queue
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {reviewStats?.due_today || 0}
                </p>
                <p className="text-xs text-gray-500">due today</p>
              </div>

              {/* Daily Goal Card */}
              <div className="glass p-4 rounded-xl border border-white/10 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Target size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    Daily Goal
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-cyan-400">
                    {userData?.daily_goal_progress || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    / {userData?.daily_goal_target || 5}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleMetrics;
