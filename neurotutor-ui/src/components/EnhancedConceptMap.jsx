import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  GitBranch,
  Zap,
  Target,
  BookOpen,
  Network,
  ArrowRight,
  ChevronRight,
  Sparkles,
  X,
  Maximize2,
} from "lucide-react";

const EnhancedConceptMap = ({
  isOpen,
  onClose,
  currentConcept,
  conceptMap,
  masteryData,
  userProgress = {},
  onConceptSelect,
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Enhanced concept relationships with metadata
  const conceptMetadata = useMemo(() => {
    const metadata = {
      // Data Structures & Algorithms
      arrays: {
        category: "Data Structures & Algorithms",
        difficulty: "beginner",
        estimatedTime: "2-3 hours",
        description: "Fundamental building blocks for programming",
        color: "#3b82f6",
        icon: "📚",
      },
      string_algorithms: {
        category: "Data Structures & Algorithms",
        difficulty: "beginner",
        estimatedTime: "1-2 hours",
        description: "Text processing and manipulation techniques",
        color: "#3b82f6",
        icon: "🔤",
      },
      sorting_algorithms: {
        category: "Data Structures & Algorithms",
        difficulty: "intermediate",
        estimatedTime: "3-4 hours",
        description: "Methods for organizing data efficiently",
        color: "#f59e0b",
        icon: "📊",
      },
      time_complexity: {
        category: "Data Structures & Algorithms",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Understanding algorithm efficiency",
        color: "#f59e0b",
        icon: "⚡",
      },
      searching_algorithms: {
        category: "Data Structures & Algorithms",
        difficulty: "intermediate",
        estimatedTime: "3-4 hours",
        description: "Techniques for finding data efficiently",
        color: "#f59e0b",
        icon: "🔍",
      },
      hash_tables: {
        category: "Data Structures & Algorithms",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Key-value storage with O(1) lookup",
        color: "#f59e0b",
        icon: "🗂️",
      },
      trees: {
        category: "Data Structures & Algorithms",
        difficulty: "intermediate",
        estimatedTime: "4-6 hours",
        description: "Hierarchical data structures",
        color: "#f59e0b",
        icon: "🌳",
      },
      binary_search_trees: {
        category: "Data Structures & Algorithms",
        difficulty: "advanced",
        estimatedTime: "3-5 hours",
        description: "Optimized search in sorted trees",
        color: "#dc2626",
        icon: "🌲",
      },
      heaps: {
        category: "Data Structures & Algorithms",
        difficulty: "advanced",
        estimatedTime: "2-4 hours",
        description: "Priority queue data structures",
        color: "#dc2626",
        icon: "⛰",
      },
      graphs: {
        category: "Data Structures & Algorithms",
        difficulty: "advanced",
        estimatedTime: "6-8 hours",
        description: "Network-based data representation",
        color: "#dc2626",
        icon: "🕸️",
      },
      graph_algorithms: {
        category: "Data Structures & Algorithms",
        difficulty: "expert",
        estimatedTime: "5-7 hours",
        description: "Algorithms for graph traversal and optimization",
        color: "#7c3aed",
        icon: "🔀",
      },
      dynamic_programming: {
        category: "Data Structures & Algorithms",
        difficulty: "expert",
        estimatedTime: "8-10 hours",
        description: "Breaking problems into smaller subproblems",
        color: "#7c3aed",
        icon: "🧩",
      },
      greedy_algorithms: {
        category: "Data Structures & Algorithms",
        difficulty: "expert",
        estimatedTime: "6-8 hours",
        description: "Making locally optimal choices",
        color: "#7c3aed",
        icon: "🎯",
      },
      divide_and_conquer: {
        category: "Data Structures & Algorithms",
        difficulty: "advanced",
        estimatedTime: "4-6 hours",
        description: "Recursive problem-solving approach",
        color: "#dc2626",
        icon: "✂️",
      },
      backtracking: {
        category: "Data Structures & Algorithms",
        difficulty: "expert",
        estimatedTime: "6-8 hours",
        description: "Systematic trial and error approach",
        color: "#7c3aed",
        icon: "🔄",
      },

      // Databases & Storage
      database_design: {
        category: "Databases & Storage",
        difficulty: "intermediate",
        estimatedTime: "4-6 hours",
        description: "Designing efficient database schemas",
        color: "#10b981",
        icon: "🗄️",
      },
      relational_model: {
        category: "Databases & Storage",
        difficulty: "intermediate",
        estimatedTime: "3-5 hours",
        description: "Structured data with relationships",
        color: "#10b981",
        icon: "🔗",
      },
      sql_basics: {
        category: "Databases & Storage",
        difficulty: "beginner",
        estimatedTime: "2-4 hours",
        description: "Query language for databases",
        color: "#10b981",
        icon: "💾",
      },
      query_optimization: {
        category: "Databases & Storage",
        difficulty: "advanced",
        estimatedTime: "4-6 hours",
        description: "Improving database performance",
        color: "#059669",
        icon: "⚡",
      },
      normalization: {
        category: "Databases & Storage",
        difficulty: "advanced",
        estimatedTime: "3-5 hours",
        description: "Organizing data to reduce redundancy",
        color: "#059669",
        icon: "📋",
      },
      indexing: {
        category: "Databases & Storage",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Fast data lookup structures",
        color: "#10b981",
        icon: "📇",
      },
      acid_properties: {
        category: "Databases & Storage",
        difficulty: "advanced",
        estimatedTime: "3-4 hours",
        description: "Database transaction guarantees",
        color: "#059669",
        icon: "🛡️",
      },
      transactions: {
        category: "Databases & Storage",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Units of work in databases",
        color: "#10b981",
        icon: "💰",
      },
      concurrency_control: {
        category: "Databases & Storage",
        difficulty: "expert",
        estimatedTime: "4-5 hours",
        description: "Managing simultaneous database operations",
        color: "#059669",
        icon: "🔀",
      },
      nosql_databases: {
        category: "Databases & Storage",
        difficulty: "advanced",
        estimatedTime: "5-7 hours",
        description: "Flexible, non-relational data storage",
        color: "#059669",
        icon: "🌐",
      },

      // Networking
      osi_model: {
        category: "Networking",
        difficulty: "beginner",
        estimatedTime: "1-2 hours",
        description: "Conceptual framework for network communication",
        color: "#8b5cf6",
        icon: "🌐",
      },
      tcp_ip: {
        category: "Networking",
        difficulty: "intermediate",
        estimatedTime: "3-4 hours",
        description: "Core internet protocol suite",
        color: "#8b5cf6",
        icon: "📡",
      },
      tcp_vs_udp: {
        category: "Networking",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Comparison of transport protocols",
        color: "#8b5cf6",
        icon: "📊",
      },
      http_https: {
        category: "Networking",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Web application protocols",
        color: "#8b5cf6",
        icon: "🔒",
      },
      dns: {
        category: "Networking",
        difficulty: "beginner",
        estimatedTime: "1-2 hours",
        description: "Domain name resolution system",
        color: "#8b5cf6",
        icon: "🌍",
      },
      subnetting: {
        category: "Networking",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Network address partitioning",
        color: "#8b5cf6",
        icon: "🔢",
      },
      vpc: {
        category: "Networking",
        difficulty: "intermediate",
        estimatedTime: "3-4 hours",
        description: "Virtual private cloud networks",
        color: "#8b5cf6",
        icon: "☁️",
      },
      routing_algorithms: {
        category: "Networking",
        difficulty: "advanced",
        estimatedTime: "4-6 hours",
        description: "Path selection in networks",
        color: "#6366f1",
        icon: "🧭",
      },
      socket_programming: {
        category: "Networking",
        difficulty: "advanced",
        estimatedTime: "5-7 hours",
        description: "Real-time communication endpoints",
        color: "#6366f1",
        icon: "🔌",
      },
      load_balancing: {
        category: "Networking",
        difficulty: "expert",
        estimatedTime: "6-8 hours",
        description: "Distributing network traffic",
        color: "#6366f1",
        icon: "⚖️",
      },
      network_security: {
        category: "Networking",
        difficulty: "expert",
        estimatedTime: "8-10 hours",
        description: "Protecting network infrastructure",
        color: "#6366f1",
        icon: "🛡️",
      },

      // Cloud Computing
      serverless: {
        category: "Cloud Computing",
        difficulty: "intermediate",
        estimatedTime: "3-5 hours",
        description: "Event-driven cloud functions",
        color: "#f97316",
        icon: "⚡",
      },
      lambda: {
        category: "Cloud Computing",
        difficulty: "intermediate",
        estimatedTime: "2-4 hours",
        description: "AWS serverless computing platform",
        color: "#f97316",
        icon: "🐑",
      },
      rds: {
        category: "Cloud Computing",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        description: "Managed relational database service",
        color: "#f97316",
        icon: "🗄️",
      },
      cloudformation: {
        category: "Cloud Computing",
        difficulty: "advanced",
        estimatedTime: "4-6 hours",
        description: "Infrastructure as code service",
        color: "#ea580c",
        icon: "🏗️",
      },
      gcp_basics: {
        category: "Cloud Computing",
        difficulty: "intermediate",
        estimatedTime: "3-5 hours",
        description: "Google Cloud Platform fundamentals",
        color: "#f97316",
        icon: "☁️",
      },
      azure_basics: {
        category: "Cloud Computing",
        difficulty: "intermediate",
        estimatedTime: "3-5 hours",
        description: "Microsoft Azure cloud platform",
        color: "#f97316",
        icon: "☁️",
      },
    };

    return metadata[currentConcept] || metadata["arrays"];
  }, [currentConcept]);

  // Generate enhanced mind map nodes
  const generateMindMapNodes = () => {
    if (!conceptMap || !currentConcept) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];

    // Current concept (center)
    const currentMeta = conceptMetadata[currentConcept] ||
      conceptMetadata["arrays"] || {
        category: "Other",
        difficulty: "beginner",
        estimatedTime: "1-2 hours",
        description: "Concept information",
        color: "#6b7280",
        icon: "📚",
      };

    nodes.push({
      id: "current",
      concept: currentConcept || "unknown",
      x: 400,
      y: 300,
      category: currentMeta?.category || "Other",
      isCurrent: true,
      mastery: masteryData?.[currentConcept] || 0,
      progress: userProgress?.[currentConcept] || 0,
      metadata: currentMeta,
    });

    // Prerequisites (left side)
    if (conceptMap.prerequisites) {
      conceptMap.prerequisites.forEach((prereq, index) => {
        const prereqMeta = conceptMetadata[prereq] ||
          conceptMetadata["arrays"] || {
            category: "Other",
            difficulty: "beginner",
            estimatedTime: "1-2 hours",
            description: "Prerequisite concept",
            color: "#6b7280",
            icon: "📚",
          };

        nodes.push({
          id: `prereq-${index}`,
          concept: prereq,
          x: 150,
          y: 150 + index * 80,
          category: prereqMeta?.category || "Other",
          isPrerequisite: true,
          mastery: masteryData?.[prereq] || 0,
          progress: userProgress?.[prereq] || 0,
          metadata: prereqMeta,
        });

        edges.push({
          from: `prereq-${index}`,
          to: "current",
          type: "prerequisite",
          color: "#3b82f6",
        });
      });
    }

    // Successors (right side)
    if (conceptMap.successors) {
      conceptMap.successors.forEach((succ, index) => {
        const succMeta = conceptMetadata[succ] ||
          conceptMetadata["arrays"] || {
            category: "Other",
            difficulty: "beginner",
            estimatedTime: "1-2 hours",
            description: "Successor concept",
            color: "#6b7280",
            icon: "📚",
          };

        nodes.push({
          id: `succ-${index}`,
          concept: succ,
          x: 650,
          y: 150 + index * 80,
          category: succMeta?.category || "Other",
          isSuccessor: true,
          mastery: masteryData?.[succ] || 0,
          progress: userProgress?.[succ] || 0,
          metadata: succMeta,
        });

        edges.push({
          from: "current",
          to: `succ-${index}`,
          type: "successor",
          color: "#10b981",
        });
      });
    }

    // Related concepts (bottom)
    if (conceptMap.related) {
      conceptMap.related.slice(0, 4).forEach((related, index) => {
        const relatedMeta = conceptMetadata[related] ||
          conceptMetadata["arrays"] || {
            category: "Other",
            difficulty: "beginner",
            estimatedTime: "1-2 hours",
            description: "Related concept",
            color: "#6b7280",
            icon: "📚",
          };

        nodes.push({
          id: `related-${index}`,
          concept: related,
          x: 300 + index * 100,
          y: 500,
          category: relatedMeta?.category || "Other",
          isRelated: true,
          mastery: masteryData?.[related] || 0,
          progress: userProgress?.[related] || 0,
          metadata: relatedMeta,
        });

        edges.push({
          from: "current",
          to: `related-${index}`,
          type: "related",
          color: "#6366f1",
        });
      });
    }

    return { nodes, edges };
  };

  const { nodes, edges } = generateMindMapNodes();

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onConceptSelect && node.concept !== currentConcept) {
      onConceptSelect(node.concept);
      onClose();
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return "#10b981";
    if (mastery >= 60) return "#f59e0b";
    if (mastery >= 40) return "#f97316";
    return "#ef4444";
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#10b981";
    if (progress >= 60) return "#f59e0b";
    if (progress >= 40) return "#f97316";
    return "#ef4444";
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      "Data Structures & Algorithms": "from-blue-600 to-cyan-500",
      "Databases & Storage": "from-green-600 to-emerald-500",
      Networking: "from-purple-600 to-pink-500",
      "Cloud Computing": "from-orange-600 to-red-500",
      Other: "from-gray-600 to-gray-500",
    };
    return gradients[category] || "from-gray-600 to-gray-500";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-6xl mx-auto h-[90vh] my-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Concept Mind Map
                  </h2>
                  <p className="text-sm text-gray-400">
                    Interactive learning visualization
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex h-[calc(90vh-80px)]">
              {/* Mind Map SVG */}
              <div className="flex-1 bg-gray-800/50 p-4 overflow-hidden">
                <svg
                  width="800"
                  height="600"
                  viewBox="0 0 800 600"
                  className="w-full h-full"
                >
                  {/* Define gradients */}
                  <defs>
                    {Object.entries(conceptMetadata).map(([concept, meta]) => (
                      <linearGradient
                        key={concept}
                        id={`gradient-${concept}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={meta.color} />
                        <stop
                          offset="100%"
                          stopColor={meta.color}
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  {/* Edges */}
                  {edges.map((edge, index) => (
                    <motion.g
                      key={`edge-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <line
                        x1={nodes.find((n) => n.id === edge.from)?.x || 0}
                        y1={nodes.find((n) => n.id === edge.from)?.y || 0}
                        x2={nodes.find((n) => n.id === edge.to)?.x || 0}
                        y2={nodes.find((n) => n.id === edge.to)?.y || 0}
                        stroke={edge.color}
                        strokeWidth="2"
                        strokeDasharray={edge.type === "related" ? "5,5" : "0"}
                        opacity="0.6"
                      />
                      {edge.type === "successor" && (
                        <ArrowRight
                          size={16}
                          className="text-green-400"
                          x={
                            (nodes.find((n) => n.id === edge.from)?.x ||
                              0 + nodes.find((n) => n.id === edge.to)?.x ||
                              0) /
                              2 -
                            8
                          }
                          y={
                            (nodes.find((n) => n.id === edge.from)?.y ||
                              0 + nodes.find((n) => n.id === edge.to)?.y ||
                              0) /
                              2 -
                            8
                          }
                        />
                      )}
                    </motion.g>
                  ))}

                  {/* Nodes */}
                  {nodes.map((node, index) => {
                    const meta = node.metadata || {};
                    const Icon = meta.icon || Brain;

                    return (
                      <motion.g
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1, type: "spring" }}
                        className="cursor-pointer"
                        onClick={() => handleNodeClick(node)}
                        onHoverStart={() => setHoveredNode(node)}
                        onHoverEnd={() => setHoveredNode(null)}
                      >
                        {/* Node background */}
                        <rect
                          x={node.x - 60}
                          y={node.y - 25}
                          width="120"
                          height="50"
                          rx="8"
                          fill={
                            node.isCurrent
                              ? `url(#gradient-${node.concept})`
                              : "#1f2937"
                          }
                          stroke={meta.color}
                          strokeWidth={node.isCurrent ? "3" : "2"}
                          className={
                            hoveredNode?.id === node.id
                              ? "filter brightness-125"
                              : ""
                          }
                        />

                        {/* Progress indicator */}
                        {node.progress > 0 && (
                          <rect
                            x={node.x - 60}
                            y={node.y + 20}
                            width="120"
                            height="3"
                            rx="2"
                            fill={getProgressColor(node.progress)}
                            initial={{ width: 0 }}
                            animate={{ width: 120 * (node.progress / 100) }}
                            transition={{
                              delay: 1 + index * 0.1,
                              duration: 0.8,
                            }}
                          />
                        )}

                        {/* Icon and text */}
                        <foreignObject
                          x={node.x - 50}
                          y={node.y - 15}
                          width="100"
                          height="30"
                        >
                          <div className="flex items-center justify-center gap-2 text-white">
                            <Icon size={16} />
                            <span className="text-xs font-medium truncate">
                              {node.concept.replace(/_/g, " ")}
                            </span>
                          </div>
                        </foreignObject>

                        {/* Mastery indicator */}
                        {node.mastery > 0 && (
                          <circle
                            cx={node.x + 50}
                            cy={node.y - 15}
                            r="8"
                            fill={getMasteryColor(node.mastery)}
                            className="opacity-80"
                          />
                        )}
                      </motion.g>
                    );
                  })}
                </svg>
              </div>

              {/* Side Panel */}
              <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Current Concept Details */}
                  {currentConcept && conceptMetadata[currentConcept] && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg`}
                          style={{
                            backgroundColor:
                              conceptMetadata[currentConcept].color,
                          }}
                        >
                          {conceptMetadata[currentConcept].icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            {currentConcept.replace(/_/g, " ")}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {conceptMetadata[currentConcept].category}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Difficulty:</span>
                          <span className="text-white font-medium capitalize">
                            {conceptMetadata[currentConcept].difficulty}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Est. Time:</span>
                          <span className="text-white font-medium">
                            {conceptMetadata[currentConcept].estimatedTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mastery:</span>
                          <span className="text-white font-medium">
                            {masteryData[currentConcept] || 0}%
                          </span>
                        </div>
                        <div className="pt-2">
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {conceptMetadata[currentConcept].description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Selected Node Details */}
                  {hoveredNode && conceptMetadata[hoveredNode.concept] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass border border-white/10 rounded-lg p-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white`}
                            style={{
                              backgroundColor:
                                conceptMetadata[hoveredNode.concept].color,
                            }}
                          >
                            {conceptMetadata[hoveredNode.concept].icon}
                          </div>
                          <div>
                            <h5 className="font-semibold text-white">
                              {hoveredNode.concept.replace(/_/g, " ")}
                            </h5>
                            <p className="text-xs text-gray-400">
                              {conceptMetadata[hoveredNode.concept].category}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Difficulty:</span>
                            <span className="text-white font-medium capitalize">
                              {conceptMetadata[hoveredNode.concept].difficulty}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Est. Time:</span>
                            <span className="text-white font-medium">
                              {
                                conceptMetadata[hoveredNode.concept]
                                  .estimatedTime
                              }
                            </span>
                          </div>
                          <div className="pt-2">
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {conceptMetadata[hoveredNode.concept].description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Legend */}
                  <div className="glass border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">
                      Categories
                    </h4>
                    <div className="space-y-2">
                      {Object.entries({
                        "Data Structures & Algorithms": {
                          color: "#3b82f6",
                          icon: "📚",
                        },
                        "Databases & Storage": { color: "#10b981", icon: "🗄️" },
                        Networking: { color: "#8b5cf6", icon: "🌐" },
                        "Cloud Computing": { color: "#f97316", icon: "☁️" },
                      }).map(([category, config]) => (
                        <div key={category} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: config.color }}
                          ></div>
                          <span className="text-sm text-gray-300">
                            {config.icon} {category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        onConceptSelect && onConceptSelect(currentConcept)
                      }
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <BookOpen size={16} />
                      Study {currentConcept.replace(/_/g, " ")}
                    </button>
                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Target size={16} />
                      View Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedConceptMap;
