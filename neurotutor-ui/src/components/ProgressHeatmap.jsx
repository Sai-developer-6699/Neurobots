import React, { useEffect, useState } from "react";
import { questionAPI } from "../services/api";
import { motion } from "framer-motion";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

const ProgressHeatmap = ({ refreshKey = 0 }) => {
  const [heatmapData, setHeatmapData] = useState({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      try {
        const response = await questionAPI.getHeatmapData();
        setHeatmapData(response.data || {});
      } catch (error) {
        console.error("Failed to fetch heatmap", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, [refreshKey]);

  // Build a 52-week × 7-day grid (364 days + today's partial week)
  const buildGrid = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    // Start from the Sunday 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364 - dayOfWeek);

    const weeks = [];
    let current = new Date(startDate);

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split("T")[0];
        const isFuture = current > today;
        week.push({
          date: dateStr,
          count: isFuture ? -1 : heatmapData[dateStr] || 0,
          month: current.getMonth(),
          day: current.getDate(),
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const getColor = (count) => {
    if (count < 0) return "bg-transparent";
    if (count === 0) return "bg-white/[0.04] border border-white/[0.06]";
    if (count <= 2) return "bg-cyan-900/60 border border-cyan-800/40";
    if (count <= 5) return "bg-cyan-600/70 border border-cyan-500/40";
    if (count <= 10)
      return "bg-cyan-400/80 border border-cyan-300/40 shadow-[0_0_6px_rgba(0,243,255,0.3)]";
    return "bg-cyan-300 border border-cyan-200/60 shadow-[0_0_10px_rgba(0,243,255,0.5)]";
  };

  const totalActivity = Object.values(heatmapData).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(heatmapData).filter((v) => v > 0).length;

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl border border-white/10">
        <div className="h-4 w-32 bg-white/5 rounded mb-4 animate-pulse" />
        <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  const weeks = buildGrid();

  // Detect month label positions (first week of each month)
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d.count >= 0);
    if (!firstDay) return;
    const prevWeek = weeks[wi - 1];
    const prevMonth = prevWeek?.find((d) => d.count >= 0)?.month;
    if (firstDay.month !== prevMonth) {
      monthLabels.push({ week: wi, label: MONTHS[firstDay.month] });
    }
  });

  return (
    <div className="glass p-6 rounded-xl border border-white/10 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          📅 Yearly Activity
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{activeDays} active days</span>
          <span className="text-gray-700">·</span>
          <span>{totalActivity} answers</span>
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ minWidth: "max-content" }}>
          {/* Month labels */}
          <div className="flex mb-1 ml-6">
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.week === wi);
              return (
                <div
                  key={wi}
                  className="w-3 mr-0.5 text-[9px] text-gray-600 font-medium"
                >
                  {label?.label || ""}
                </div>
              );
            })}
          </div>

          {/* Day labels + grid */}
          <div className="flex gap-0.5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className="h-3 text-[9px] text-gray-600 leading-3 w-4 text-right"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: (wi * 7 + di) * 0.0005,
                      duration: 0.2,
                    }}
                    className={`w-3 h-3 rounded-[2px] cursor-default transition-transform hover:scale-125 ${getColor(day.count)}`}
                    onMouseEnter={(e) => {
                      if (day.count < 0) return;
                      setTooltip({
                        text:
                          day.count === 0
                            ? `No activity on ${day.date}`
                            : `${day.count} answer${day.count > 1 ? "s" : ""} on ${day.date}`,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-gray-600">Less</span>
        {[
          "bg-white/[0.04]",
          "bg-cyan-900/60",
          "bg-cyan-600/70",
          "bg-cyan-400/80",
          "bg-cyan-300",
        ].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-gray-600">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 border border-white/10 rounded-md text-white shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Empty state overlay */}
      {totalActivity === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm">
          <p className="text-gray-400 font-medium">No activity yet</p>
          <p className="text-xs text-cyan-400 mt-1">
            Answer your first question to start your streak!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressHeatmap;
