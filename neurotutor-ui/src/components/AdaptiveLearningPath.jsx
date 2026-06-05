import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  ArrowRight,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";

const AdaptiveLearningPath = ({
  currentConcept,
  conceptMap,
  masteryData,
  userProgress = {},
  onConceptSelect,
  className = "",
}) => {
  const [suggestedConcepts, setSuggestedConcepts] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [learningPath, setLearningPath] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [pendingOverride, setPendingOverride] = useState(null);

  // Enhanced concept relationships with difficulty levels
  const conceptRelationships = useMemo(() => {
    const relationships = {
      // Data Structures & Algorithms
      arrays: {
        successors: [
          "string_algorithms",
          "sorting_algorithms",
          "time_complexity",
        ],
        difficulty: "beginner",
        prerequisites: [],
        estimatedTime: "2-3 hours",
      },
      string_algorithms: {
        successors: ["arrays", "hash_tables", "sorting_algorithms"],
        difficulty: "beginner",
        prerequisites: ["arrays"],
        estimatedTime: "1-2 hours",
      },
      sorting_algorithms: {
        successors: ["time_complexity", "searching_algorithms"],
        difficulty: "intermediate",
        prerequisites: ["arrays", "string_algorithms"],
        estimatedTime: "3-4 hours",
      },
      time_complexity: {
        successors: ["searching_algorithms", "algorithms"],
        difficulty: "intermediate",
        prerequisites: ["arrays", "sorting_algorithms"],
        estimatedTime: "2-3 hours",
      },
      searching_algorithms: {
        successors: ["binary_search_trees", "hash_tables"],
        difficulty: "intermediate",
        prerequisites: ["arrays", "sorting_algorithms"],
        estimatedTime: "3-4 hours",
      },
      hash_tables: {
        successors: ["searching_algorithms", "caching"],
        difficulty: "intermediate",
        prerequisites: ["arrays", "string_algorithms"],
        estimatedTime: "2-3 hours",
      },
      trees: {
        successors: [
          "binary_search_trees",
          "graph_algorithms",
          "divide_and_conquer",
        ],
        difficulty: "intermediate",
        prerequisites: ["arrays", "recursion"],
        estimatedTime: "4-6 hours",
      },
      binary_search_trees: {
        successors: ["heaps", "avl_trees"],
        difficulty: "advanced",
        prerequisites: ["trees", "searching_algorithms"],
        estimatedTime: "3-5 hours",
      },
      heaps: {
        successors: ["priority_queues", "heap_sort"],
        difficulty: "advanced",
        prerequisites: ["trees", "binary_search_trees"],
        estimatedTime: "2-4 hours",
      },
      graphs: {
        successors: ["graph_algorithms", "networking"],
        difficulty: "advanced",
        prerequisites: ["trees", "queues"],
        estimatedTime: "6-8 hours",
      },
      graph_algorithms: {
        successors: ["dynamic_programming", "greedy_algorithms"],
        difficulty: "advanced",
        prerequisites: ["graphs", "recursion"],
        estimatedTime: "5-7 hours",
      },
      dynamic_programming: {
        successors: ["optimization"],
        difficulty: "expert",
        prerequisites: ["graphs", "recursion", "divide_and_conquer"],
        estimatedTime: "8-10 hours",
      },
      greedy_algorithms: {
        successors: ["optimization"],
        difficulty: "expert",
        prerequisites: ["graphs", "dynamic_programming"],
        estimatedTime: "6-8 hours",
      },
      divide_and_conquer: {
        successors: ["recursion", "algorithms"],
        difficulty: "advanced",
        prerequisites: ["trees", "recursion"],
        estimatedTime: "4-6 hours",
      },
      backtracking: {
        successors: ["graphs", "recursion"],
        difficulty: "expert",
        prerequisites: ["trees", "recursion"],
        estimatedTime: "6-8 hours",
      },

      // Databases & Storage
      database_design: {
        successors: ["relational_model", "sql_basics"],
        difficulty: "intermediate",
        prerequisites: ["data_modeling"],
        estimatedTime: "4-6 hours",
      },
      relational_model: {
        successors: ["sql_basics", "normalization"],
        difficulty: "intermediate",
        prerequisites: ["database_design"],
        estimatedTime: "3-5 hours",
      },
      sql_basics: {
        successors: ["query_optimization", "indexing"],
        difficulty: "beginner",
        prerequisites: ["relational_model"],
        estimatedTime: "2-4 hours",
      },
      query_optimization: {
        successors: ["indexing", "performance"],
        difficulty: "advanced",
        prerequisites: ["sql_basics"],
        estimatedTime: "4-6 hours",
      },
      normalization: {
        successors: ["acid_properties", "transactions"],
        difficulty: "advanced",
        prerequisites: ["relational_model", "sql_basics"],
        estimatedTime: "3-5 hours",
      },
      indexing: {
        successors: ["performance"],
        difficulty: "intermediate",
        prerequisites: ["query_optimization"],
        estimatedTime: "2-3 hours",
      },
      acid_properties: {
        successors: ["transactions", "concurrency_control"],
        difficulty: "advanced",
        prerequisites: ["normalization"],
        estimatedTime: "3-4 hours",
      },
      transactions: {
        successors: ["concurrency_control"],
        difficulty: "intermediate",
        prerequisites: ["acid_properties"],
        estimatedTime: "2-3 hours",
      },
      concurrency_control: {
        successors: ["locking"],
        difficulty: "expert",
        prerequisites: ["transactions"],
        estimatedTime: "4-5 hours",
      },
      nosql_databases: {
        successors: ["cloud_computing", "scalability"],
        difficulty: "advanced",
        prerequisites: ["database_design"],
        estimatedTime: "5-7 hours",
      },

      // Networking
      osi_model: {
        successors: ["tcp_ip", "networking"],
        difficulty: "beginner",
        prerequisites: [],
        estimatedTime: "1-2 hours",
      },
      tcp_ip: {
        successors: ["tcp_vs_udp", "http_https"],
        difficulty: "intermediate",
        prerequisites: ["osi_model"],
        estimatedTime: "3-4 hours",
      },
      tcp_vs_udp: {
        successors: ["protocols"],
        difficulty: "intermediate",
        prerequisites: ["tcp_ip"],
        estimatedTime: "2-3 hours",
      },
      http_https: {
        successors: ["network_security"],
        difficulty: "intermediate",
        prerequisites: ["tcp_ip"],
        estimatedTime: "2-3 hours",
      },
      dns: {
        successors: ["subnetting"],
        difficulty: "beginner",
        prerequisites: ["networking"],
        estimatedTime: "1-2 hours",
      },
      subnetting: {
        successors: ["vpc"],
        difficulty: "intermediate",
        prerequisites: ["networking"],
        estimatedTime: "2-3 hours",
      },
      vpc: {
        successors: ["cloud_computing"],
        difficulty: "intermediate",
        prerequisites: ["subnetting"],
        estimatedTime: "3-4 hours",
      },
      routing_algorithms: {
        successors: ["load_balancing"],
        difficulty: "advanced",
        prerequisites: ["networking"],
        estimatedTime: "4-6 hours",
      },
      socket_programming: {
        successors: ["protocols"],
        difficulty: "advanced",
        prerequisites: ["tcp_ip"],
        estimatedTime: "5-7 hours",
      },
      load_balancing: {
        successors: ["network_security"],
        difficulty: "expert",
        prerequisites: ["routing_algorithms"],
        estimatedTime: "6-8 hours",
      },
      network_security: {
        successors: ["cloud_computing"],
        difficulty: "expert",
        prerequisites: ["http_https", "tcp_ip"],
        estimatedTime: "8-10 hours",
      },

      // Cloud Computing
      serverless: {
        successors: ["lambda"],
        difficulty: "intermediate",
        prerequisites: ["cloud_computing"],
        estimatedTime: "3-5 hours",
      },
      lambda: {
        successors: ["rds"],
        difficulty: "intermediate",
        prerequisites: ["serverless"],
        estimatedTime: "2-4 hours",
      },
      rds: {
        successors: ["cloudformation"],
        difficulty: "intermediate",
        prerequisites: ["lambda"],
        estimatedTime: "2-3 hours",
      },
      cloudformation: {
        successors: ["infrastructure"],
        difficulty: "advanced",
        prerequisites: ["serverless", "lambda"],
        estimatedTime: "4-6 hours",
      },
      gcp_basics: {
        successors: ["infrastructure"],
        difficulty: "intermediate",
        prerequisites: ["cloud_computing"],
        estimatedTime: "3-5 hours",
      },
      azure_basics: {
        successors: ["infrastructure"],
        difficulty: "intermediate",
        prerequisites: ["cloud_computing"],
        estimatedTime: "3-5 hours",
      },
    };

    // Add default for current concept if it doesn't exist
    if (currentConcept && !relationships[currentConcept]) {
      relationships[currentConcept] = {
        successors: [],
        difficulty: "beginner",
        prerequisites: [],
        estimatedTime: "1-2 hours",
      };
    }

    return relationships;
  }, [currentConcept, conceptMap]);

  // Generate smart learning suggestions
  const generateLearningSuggestions = () => {
    if (!currentConcept || !conceptRelationships[currentConcept]) return [];

    const current = conceptRelationships[currentConcept];
    const suggestions = [];

    // Next learning steps based on mastery
    if (current?.successors && current.successors.length > 0) {
      const masteredSuccessors = current.successors.filter(
        (succ) => masteryData[succ] && masteryData[succ] >= 70,
      );

      const unmasteredSuccessors = current.successors.filter(
        (succ) => !masteryData[succ] || masteryData[succ] < 50,
      );

      if (unmasteredSuccessors.length > 0) {
        suggestions.push({
          type: "next_concept",
          title: "Ready to Advance",
          description: `You've mastered the prerequisites. Time to learn ${unmasteredSuccessors[0]}!`,
          concepts: unmasteredSuccessors.slice(0, 2),
          priority: "high",
          action: "learn",
          estimatedTime: unmasteredSuccessors
            .map((s) => conceptRelationships[s]?.estimatedTime || "2-3 hours")
            .join(" or "),
        });
      }
    }

    // Review suggestions based on weak areas
    if (current.prerequisites && current.prerequisites.length > 0) {
      const weakPrerequisites = current.prerequisites.filter(
        (prereq) => masteryData[prereq] && masteryData[prereq] < 60,
      );

      if (weakPrerequisites.length > 0) {
        suggestions.push({
          type: "review",
          title: "Strengthen Foundation",
          description: `Review ${weakPrerequisites[0]} to strengthen your understanding`,
          concepts: weakPrerequisites.slice(0, 2),
          priority: "medium",
          action: "review",
          estimatedTime: "1-2 hours",
        });
      }
    }

    // Related concepts for expansion
    if (conceptMap && conceptMap.related && conceptMap.related.length > 0) {
      const unmasteredRelated = conceptMap.related.filter(
        (related) => !masteryData[related] || masteryData[related] < 40,
      );

      if (unmasteredRelated.length > 0) {
        suggestions.push({
          type: "expand",
          title: "Expand Knowledge",
          description: `Explore related topics like ${unmasteredRelated[0]}`,
          concepts: unmasteredRelated.slice(0, 2),
          priority: "low",
          action: "explore",
          estimatedTime: "2-4 hours",
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Calculate learning path
  const calculateLearningPath = () => {
    if (!currentConcept) return [];

    const path = [currentConcept];
    const visited = new Set([currentConcept]);
    let current = currentConcept;

    // Build path through mastered concepts
    while (current && conceptRelationships[current]) {
      const nextConcepts = conceptRelationships[current].successors || [];
      const masteredNext = nextConcepts.find(
        (concept) => masteryData[concept] && masteryData[concept] >= 60,
      );

      if (masteredNext && !visited.has(masteredNext)) {
        path.push(masteredNext);
        visited.add(masteredNext);
        current = masteredNext;
      } else {
        break;
      }
    }

    return path;
  };

  useEffect(() => {
    const suggestions = generateLearningSuggestions();
    setSuggestedConcepts(suggestions);

    const path = calculateLearningPath();
    setLearningPath(path);

    // Set next action based on best suggestion
    if (suggestions.length > 0) {
      setNextAction(suggestions[0]);
    }
  }, [currentConcept, conceptMap, masteryData]);

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: "text-green-400",
      intermediate: "text-yellow-400",
      advanced: "text-orange-400",
      expert: "text-red-400",
    };
    return colors[difficulty] || "text-gray-400";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const handleSuggestionClick = (suggestion) => {
    // Clear any previous validation errors
    setValidationError(null);

    if (suggestion.action === "learn" && suggestion.concepts.length > 0) {
      const targetConcept = suggestion.concepts[0];
      const conceptData = conceptRelationships[targetConcept];
      
      // If it has prerequisites, check if they are all met (>= 70)
      if (conceptData && conceptData.prerequisites && conceptData.prerequisites.length > 0) {
        const unmetPrereqs = conceptData.prerequisites.filter(
          (prereq) => (masteryData[prereq] || 0) < 70
        );

        if (unmetPrereqs.length > 0) {
          setPendingOverride({
            targetConcept: targetConcept,
            unmetPrereqs: unmetPrereqs,
          });
          return;
        }
      }

      // If no missing prereqs (or no prereqs at all), proceed
      onConceptSelect(targetConcept);
    } else if (suggestion.action === "review" && suggestion.concepts.length > 0) {
      onConceptSelect(suggestion.concepts[0]);
    } else if (suggestion.action === "explore" && suggestion.concepts.length > 0) {
      onConceptSelect(suggestion.concepts[0]);
    }
  };

  return (
    <div className={`adaptive-learning-path ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Adaptive Learning Path
            </h3>
            <p className="text-sm text-gray-400">
              Personalized learning recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>Updates based on your progress</span>
        </div>
      </div>

      {/* Current Concept Info */}
      {currentConcept && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                {currentConcept.replace(/_/g, " ")}
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">Difficulty:</span>
                <span
                  className={getDifficultyColor(
                    conceptRelationships[currentConcept]?.difficulty,
                  )}
                >
                  {conceptRelationships[currentConcept]?.difficulty ||
                    "beginner"}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">
                  {conceptRelationships[currentConcept]?.estimatedTime ||
                    "1-2 hours"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">
                Mastery: {masteryData[currentConcept] || 0}%
              </div>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryData[currentConcept] || 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Prerequisites & Successors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {conceptRelationships[currentConcept]?.prerequisites?.length >
              0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">
                  Prerequisites
                </h5>
                <div className="flex flex-wrap gap-2">
                  {conceptRelationships[currentConcept].prerequisites.map(
                    (prereq) => (
                      <span
                        key={prereq}
                        className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded text-sm"
                      >
                        {prereq.replace(/_/g, " ")}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {conceptRelationships[currentConcept]?.successors?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">
                  Next Steps
                </h5>
                <div className="flex flex-wrap gap-2">
                  {conceptRelationships[currentConcept].successors.map(
                    (succ) => (
                      <span
                        key={succ}
                        className="px-3 py-1 bg-green-900/30 text-green-300 rounded text-sm"
                      >
                        {succ.replace(/_/g, " ")}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Learning Path Visualization */}
      {learningPath.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass border border-white/10 rounded-xl p-6 mb-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4">
            Your Learning Path
          </h4>
          <div className="space-y-2">
            {learningPath.map((concept, index) => (
              <div key={concept} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    index === 0
                      ? "bg-purple-500"
                      : masteryData[concept] && masteryData[concept] >= 70
                        ? "bg-green-500"
                        : "bg-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <ArrowRight size={16} className="text-gray-400" />
                <span
                  className={`text-sm ${
                    masteryData[concept] && masteryData[concept] >= 70
                      ? "text-green-400"
                      : masteryData[concept]
                        ? "text-yellow-400"
                        : "text-gray-400"
                  }`}
                >
                  {concept.replace(/_/g, " ")}
                  {masteryData[concept] && ` (${masteryData[concept]}%)`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Smart Suggestions */}
      {suggestedConcepts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h4 className="text-lg font-semibold text-white mb-4">
            Smart Recommendations
          </h4>

          {suggestedConcepts.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`glass border rounded-xl p-4 cursor-pointer transition-all hover:scale-105 ${
                suggestion.priority === "high"
                  ? "border-red-500/30 bg-red-500/10"
                  : suggestion.priority === "medium"
                    ? "border-yellow-500/30 bg-yellow-500/10"
                    : "border-green-500/30 bg-green-500/10"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${getPriorityColor(suggestion.priority)}`}
                  ></div>
                  <div>
                    <h5 className="font-semibold text-white text-sm">
                      {suggestion.title}
                    </h5>
                    <p className="text-xs text-gray-400 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      suggestion.action === "learn"
                        ? "bg-blue-500 text-white"
                        : suggestion.action === "review"
                          ? "bg-orange-500 text-white"
                          : "bg-purple-500 text-white"
                    }`}
                  >
                    {suggestion.action}
                  </span>
                </div>
              </div>

              {/* Suggested concepts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {suggestion.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                  >
                    {concept.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Time estimate */}
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                <Clock size={12} />
                <span>{suggestion.estimatedTime}</span>
              </div>

              {/* Validation Warning for this specific suggestion */}
              {validationError && validationError.target === suggestion.concepts[0] && suggestion.action === "learn" && (
                <div className="mt-3 p-3 border border-orange-500/30 bg-orange-500/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-orange-400">
                        Prerequisites required:
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {validationError.unmetPrereqs.map(prereq => (
                          <button
                            key={prereq}
                            onClick={(e) => {
                              e.stopPropagation();
                              onConceptSelect(prereq);
                            }}
                            className="text-[10px] px-2 py-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-200 rounded transition-colors border border-orange-500/30 flex items-center gap-1"
                          >
                            Practice {prereq.replace(/_/g, " ")} <ArrowRight size={10} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Next Action */}
      {nextAction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Recommended Next Action
              </h4>
              <p className="text-sm text-gray-300">{nextAction.description}</p>
              
              {/* Validation Warning */}
              {validationError && validationError.target === nextAction.concepts[0] && (
                <div className="mt-4 p-4 border border-orange-500/30 bg-orange-500/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-400">
                        You need more practice in the prerequisite topics before starting this topic.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {validationError.unmetPrereqs.map(prereq => (
                          <button
                            key={prereq}
                            onClick={() => onConceptSelect(prereq)}
                            className="text-xs px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-200 rounded-md transition-colors border border-orange-500/30 flex items-center gap-1"
                          >
                            Practice {prereq.replace(/_/g, " ")} <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleSuggestionClick(nextAction)}
                className={`mt-4 px-6 py-3 rounded-lg font-medium transition-all ${
                  nextAction.action === "learn"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : nextAction.action === "review"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-purple-500 hover:bg-purple-600 text-white"
                }`}
              >
                {nextAction.action === "learn" && "Start Learning"}
                {nextAction.action === "review" && "Review Concepts"}
                {nextAction.action === "explore" && "Explore Related Topics"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pending Override Modal */}
      <AnimatePresence>
        {pendingOverride && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Prerequisites Missing</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    You haven't mastered the required foundations for this topic yet:
                  </p>
                  <ul className="mb-4 space-y-2">
                    {pendingOverride.unmetPrereqs.map((prereq) => (
                      <li key={prereq} className="flex items-center gap-2 text-sm text-orange-200 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                        <Target size={14} className="text-orange-400" />
                        {prereq.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-300">
                    Do you still want to continue to <span className="font-semibold text-white">{pendingOverride.targetConcept.replace(/_/g, ' ')}</span>?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t border-white/10 pt-4">
                <button
                  onClick={() => {
                    setValidationError({
                      target: pendingOverride.targetConcept,
                      unmetPrereqs: pendingOverride.unmetPrereqs,
                    });
                    setPendingOverride(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConceptSelect(pendingOverride.targetConcept);
                    setPendingOverride(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center gap-2"
                >
                  Continue Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdaptiveLearningPath;
