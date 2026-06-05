import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, GitBranch, Zap, Target, BookOpen, Network, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';

const ConceptMindMap = ({ 
  currentConcept, 
  conceptMap, 
  onConceptSelect, 
  masteryData,
  userProgress = {},
  className = ''
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const svgRef = useRef(null);

  // Concept adjacency relationships for smart suggestions
  const conceptRelationships = useMemo(() => ({
    // Data Structures & Algorithms
    'arrays': ['string_algorithms', 'sorting_algorithms', 'time_complexity'],
    'string_algorithms': ['arrays', 'hash_tables', 'sorting_algorithms'],
    'sorting_algorithms': ['arrays', 'string_algorithms', 'time_complexity'],
    'time_complexity': ['arrays', 'sorting_algorithms', 'searching_algorithms'],
    'searching_algorithms': ['arrays', 'binary_search_trees', 'hash_tables'],
    'hash_tables': ['arrays', 'string_algorithms', 'searching_algorithms'],
    'trees': ['binary_search_trees', 'graph_algorithms', 'divide_and_conquer'],
    'binary_search_trees': ['trees', 'searching_algorithms', 'heaps'],
    'heaps': ['trees', 'binary_search_trees', 'priority_queues'],
    'graphs': ['trees', 'graph_algorithms', 'networking'],
    'graph_algorithms': ['graphs', 'trees', 'dynamic_programming'],
    'greedy_algorithms': ['graphs', 'dynamic_programming', 'optimization'],
    'divide_and_conquer': ['trees', 'recursion', 'algorithms'],
    'dynamic_programming': ['graphs', 'trees', 'optimization'],
    'backtracking': ['trees', 'graphs', 'recursion'],

    // Databases & Storage
    'database_design': ['sql_basics', 'normalization', 'relational_model'],
    'relational_model': ['database_design', 'sql_basics', 'acid_properties'],
    'sql_basics': ['database_design', 'query_optimization', 'relational_model'],
    'query_optimization': ['sql_basics', 'indexing', 'database_design'],
    'normalization': ['database_design', 'relational_model', 'acid_properties'],
    'indexing': ['query_optimization', 'database_design', 'performance'],
    'acid_properties': ['database_design', 'transactions', 'concurrency_control'],
    'transactions': ['acid_properties', 'concurrency_control', 'database_design'],
    'concurrency_control': ['transactions', 'acid_properties', 'locking'],
    'nosql_databases': ['database_design', 'cloud_computing', 'scalability'],

    // Networking
    'osi_model': ['tcp_ip', 'http_https', 'networking'],
    'tcp_ip': ['osi_model', 'networking', 'protocols'],
    'tcp_vs_udp': ['tcp_ip', 'networking', 'protocols'],
    'http_https': ['tcp_ip', 'networking', 'security'],
    'dns': ['networking', 'tcp_ip', 'domain_systems'],
    'subnetting': ['tcp_ip', 'networking', 'vpc'],
    'vpc': ['subnetting', 'cloud_computing', 'networking'],
    'routing_algorithms': ['networking', 'graphs', 'optimization'],
    'socket_programming': ['tcp_ip', 'networking', 'protocols'],
    'load_balancing': ['networking', 'cloud_computing', 'scalability'],
    'network_security': ['http_https', 'tcp_ip', 'security'],

    // Cloud Computing
    'serverless': ['lambda', 'cloud_computing', 'scalability'],
    'lambda': ['serverless', 'cloud_computing', 'rds'],
    'rds': ['lambda', 'cloud_computing', 'database_design'],
    'cloudformation': ['serverless', 'lambda', 'infrastructure'],
    'gcp_basics': ['cloud_computing', 'serverless', 'infrastructure'],
    'azure_basics': ['cloud_computing', 'serverless', 'infrastructure']
  }), []);

  // Category colors and icons
  const categoryConfig = {
    'Data Structures & Algorithms': {
      color: 'from-blue-500 to-cyan-500',
      icon: Brain,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    'Databases & Storage': {
      color: 'from-green-500 to-emerald-500',
      icon: BookOpen,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    'Networking': {
      color: 'from-purple-500 to-pink-500',
      icon: Network,
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    'Cloud Computing': {
      color: 'from-orange-500 to-red-500',
      icon: Zap,
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    }
  };

  // Get category for a concept
  const getConceptCategory = (concept) => {
    const dataStructures = [
      'time_complexity', 'space_complexity', 'arrays', 'string_algorithms', 'sorting_algorithms',
      'searching_algorithms', 'hash_tables', 'trees', 'binary_search_trees', 'heaps', 'tries',
      'graphs', 'graph_algorithms', 'greedy_algorithms', 'divide_and_conquer', 
      'dynamic_programming', 'backtracking'
    ];
    
    const databases = [
      'database_design', 'relational_model', 'sql_basics', 'query_optimization',
      'normalization', 'indexing', 'acid_properties', 'transactions', 
      'concurrency_control', 'nosql_databases'
    ];
    
    const networking = [
      'osi_model', 'tcp_ip', 'tcp_vs_udp', 'http_https', 'dns', 'subnetting',
      'vpc', 'routing_algorithms', 'socket_programming', 'load_balancing', 'network_security'
    ];
    
    const cloud = [
      'serverless', 'lambda', 'rds', 'cloudformation', 'gcp_basics', 'azure_basics'
    ];

    if (dataStructures.includes(concept)) return 'Data Structures & Algorithms';
    if (databases.includes(concept)) return 'Databases & Storage';
    if (networking.includes(concept)) return 'Networking';
    if (cloud.includes(concept)) return 'Cloud Computing';
    return 'Other';
  };

  // Generate mind map nodes
  const generateMindMapNodes = () => {
    if (!conceptMap) return [];

    const nodes = [];
    const edges = [];
    
    // Current concept (center)
    const currentCategory = getConceptCategory(currentConcept);
    const currentConfig = categoryConfig[currentCategory] || categoryConfig['Other'];
    
    nodes.push({
      id: 'current',
      concept: currentConcept,
      x: 400,
      y: 300,
      category: currentCategory,
      isCurrent: true,
      mastery: masteryData?.[currentConcept] || 0,
      progress: userProgress?.[currentConcept] || 0
    });

    // Prerequisites (left side)
    if (conceptMap.prerequisites) {
      conceptMap.prerequisites.forEach((prereq, index) => {
        const prereqCategory = getConceptCategory(prereq);
        const prereqConfig = categoryConfig[prereqCategory] || categoryConfig['Other'];
        
        nodes.push({
          id: `prereq-${index}`,
          concept: prereq,
          x: 150,
          y: 150 + (index * 80),
          category: prereqCategory,
          isPrerequisite: true,
          mastery: masteryData?.[prereq] || 0,
          progress: userProgress?.[prereq] || 0
        });
        
        edges.push({
          from: `prereq-${index}`,
          to: 'current',
          type: 'prerequisite'
        });
      });
    }

    // Successors (right side)
    if (conceptMap.successors) {
      conceptMap.successors.forEach((succ, index) => {
        const succCategory = getConceptCategory(succ);
        const succConfig = categoryConfig[succCategory] || categoryConfig['Other'];
        
        nodes.push({
          id: `succ-${index}`,
          concept: succ,
          x: 650,
          y: 150 + (index * 80),
          category: succCategory,
          isSuccessor: true,
          mastery: masteryData?.[succ] || 0,
          progress: userProgress?.[succ] || 0
        });
        
        edges.push({
          from: 'current',
          to: `succ-${index}`,
          type: 'successor'
        });
      });
    }

    // Related concepts (bottom)
    if (conceptMap.related) {
      conceptMap.related.slice(0, 4).forEach((related, index) => {
        const relatedCategory = getConceptCategory(related);
        const relatedConfig = categoryConfig[relatedCategory] || categoryConfig['Other'];
        
        nodes.push({
          id: `related-${index}`,
          concept: related,
          x: 300 + (index * 100),
          y: 500,
          category: relatedCategory,
          isRelated: true,
          mastery: masteryData?.[related] || 0,
          progress: userProgress?.[related] || 0
        });
        
        edges.push({
          from: 'current',
          to: `related-${index}`,
          type: 'related'
        });
      });
    }

    return { nodes, edges };
  };

  const { nodes, edges } = generateMindMapNodes();

  // Get related concepts for suggestions
  const getRelatedConcepts = (concept) => {
    return conceptRelationships[concept] || [];
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onConceptSelect && node.concept !== currentConcept) {
      onConceptSelect(node.concept);
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'text-green-400';
    if (mastery >= 60) return 'text-yellow-400';
    if (mastery >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`concept-mind-map ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Learning Mind Map</h3>
            <p className="text-sm text-gray-400">Interactive concept visualization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(categoryConfig).map(([category, config]) => (
            <div key={category} className="flex items-center gap-2">
              <config.icon size={16} className={config.color.replace('from-', 'text-').replace(' to-', '-400')} />
              <span className="text-xs text-gray-400">{category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mind Map SVG */}
      <div className="relative bg-gray-900/50 rounded-2xl border border-gray-700/50 p-8 overflow-hidden">
        <svg
          ref={svgRef}
          width="800"
          height="600"
          viewBox="0 0 800 600"
          className="w-full h-full"
        >
          {/* Define gradients */}
          <defs>
            {Object.entries(categoryConfig).map(([category, config]) => (
              <linearGradient key={category} id={`gradient-${category}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={config.color.replace('from-', '').replace(' to-', '').split(' ')[0]} />
                <stop offset="100%" stopColor={config.color.replace('from-', '').replace(' to-', '').split(' ')[1]} />
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
                x1={nodes.find(n => n.id === edge.from)?.x || 0}
                y1={nodes.find(n => n.id === edge.from)?.y || 0}
                x2={nodes.find(n => n.id === edge.to)?.x || 0}
                y2={nodes.find(n => n.id === edge.to)?.y || 0}
                stroke={edge.type === 'prerequisite' ? '#3b82f6' : edge.type === 'successor' ? '#10b981' : '#6366f1'}
                strokeWidth="2"
                strokeDasharray={edge.type === 'related' ? '5,5' : '0'}
                opacity="0.6"
              />
              {edge.type === 'successor' && (
                <ArrowRight 
                  size={16} 
                  className="text-green-400"
                  x={(nodes.find(n => n.id === edge.from)?.x || 0 + nodes.find(n => n.id === edge.to)?.x || 0) / 2 - 8}
                  y={(nodes.find(n => n.id === edge.from)?.y || 0 + nodes.find(n => n.id === edge.to)?.y || 0) / 2 - 8}
                />
              )}
            </motion.g>
          ))}

          {/* Nodes */}
          {nodes.map((node, index) => {
            const category = getConceptCategory(node.concept);
            const config = categoryConfig[category] || categoryConfig['Other'];
            const Icon = config.icon;
            
            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
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
                  fill={node.isCurrent ? `url(#gradient-${category})` : '#1f2937'}
                  stroke={config.color.replace('from-', '').replace(' to-', '').split(' ')[0]}
                  strokeWidth={node.isCurrent ? '3' : '2'}
                  className={hoveredNode?.id === node.id ? 'filter brightness-125' : ''}
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
                    transition={{ delay: 1 + index * 0.1, duration: 0.8 }}
                  />
                )}
                
                {/* Icon and text */}
                <foreignObject x={node.x - 50} y={node.y - 15} width="100" height="30">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <Icon size={16} />
                    <span className="text-xs font-medium truncate">
                      {node.concept.replace(/_/g, ' ')}
                    </span>
                  </div>
                </foreignObject>
                
                {/* Mastery indicator */}
                {node.mastery > 0 && (
                  <circle
                    cx={node.x + 50}
                    cy={node.y - 15}
                    r="8"
                    fill={getMasteryColor(node.mastery).replace('text-', '#')}
                    className="opacity-80"
                  />
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-50 glass border border-white/20 rounded-lg p-4 max-w-xs"
              style={{
                left: Math.min(hoveredNode.x + 60, 600),
                top: Math.min(hoveredNode.y - 80, 100)
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryConfig[getConceptCategory(hoveredNode.concept)]?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                    {(categoryConfig[getConceptCategory(hoveredNode.concept)]?.icon || Brain)(size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {hoveredNode.concept.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {getConceptCategory(hoveredNode.concept)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Mastery:</span>
                    <span className={`font-bold ${getMasteryColor(hoveredNode.mastery)}`}>
                      {hoveredNode.mastery}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Progress:</span>
                    <span className={`font-bold ${getMasteryColor(hoveredNode.progress)}`}>
                      {hoveredNode.progress}%
                    </span>
                  </div>
                </div>

                {/* Related concepts */}
                {getRelatedConcepts(hoveredNode.concept).length > 0 && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Related concepts:</p>
                    <div className="flex flex-wrap gap-1">
                      {getRelatedConcepts(hoveredNode.concept).slice(0, 3).map(related => (
                        <span key={related} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {related.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Prerequisites</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Successors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-dashed border-gray-500 rounded"></div>
          <span>Related</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded-full"></div>
          <span>High Mastery</span>
        </div>
      </div>
    </div>
  );
};

export default ConceptMindMap;
