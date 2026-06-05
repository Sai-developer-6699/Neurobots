import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Book,
  ArrowRight,
  Lightbulb,
  X,
  Brain,
  Target,
  Zap,
} from "lucide-react";

/**
 * ConceptMap — visualises the prerequisite → current → successor pathway
 * for a given concept.  Accepts data directly from the /api/concept/map/
 * response or from the `concept_map` field in the submit_answer response.
 *
 * Props:
 *   concept        string       — the concept name currently being studied
 *   prerequisites  string[]     — concepts to study before this one
 *   successors     string[]     — concepts to learn next
 *   related        string[]     — lateral / related concepts
 *   className      string?      — extra CSS classes for the wrapper
 */
export default function ConceptMap({
  concept,
  prerequisites = [],
  successors = [],
  related = [],
  className = "",
}) {
  const [expanded, setExpanded] = useState(false);

  const label = (s) => s.replace(/_/g, " ");
  const capsFirst = (s) => label(s).replace(/^\w/, (c) => c.toUpperCase());

  if (!concept) return null;

  return (
    <div className={`concept-map ${className}`}>
      {/* Toggle button */}
      <motion.button
        className="concept-map__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Brain size={16} className="text-purple-400" />
        <span className="font-medium">Learning Pathway</span>
        <ChevronRight
          size={16}
          className={`transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setExpanded(false)}
            />

            {/* Dialog box */}
            <motion.div
              key="map-dialog"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
              }}
              className="concept-map__dialog fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50"
            >
              {/* Dialog header */}
              <div className="concept-map__header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Learning Pathway
                    </h3>
                    <p className="text-sm text-gray-400">
                      Visualize your learning journey
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setExpanded(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} className="text-gray-400" />
                </motion.button>
              </div>

              {/* Dialog content */}
              <div className="concept-map__content">
                {/* Pathway visualization */}
                <div className="concept-map__pathway">
                  {/* Prerequisites */}
                  {prerequisites.length > 0 && (
                    <motion.div
                      className="concept-map__section concept-map__section--pre"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="concept-map__section-header">
                        <Target size={16} className="text-blue-400" />
                        <span>Foundation Concepts</span>
                      </div>
                      <div className="concept-map__concepts">
                        {prerequisites.slice(0, 4).map((c, i) => (
                          <motion.div
                            key={c}
                            className="concept-map__concept concept-map__concept--pre"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                          >
                            <Zap size={12} className="text-blue-400" />
                            <span>{capsFirst(c)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Connection arrow */}
                  {prerequisites.length > 0 && (
                    <motion.div
                      className="concept-map__connection"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <ArrowRight size={20} className="text-gray-500" />
                    </motion.div>
                  )}

                  {/* Current concept */}
                  <motion.div
                    className="concept-map__section concept-map__section--current"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="concept-map__current-concept">
                      <div className="concept-map__current-icon">
                        <Brain size={24} className="text-purple-400" />
                      </div>
                      <div className="concept-map__current-info">
                        <h4 className="concept-map__current-title">
                          {capsFirst(concept)}
                        </h4>
                        <p className="concept-map__current-subtitle">
                          You're learning this now
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Connection arrow */}
                  {successors.length > 0 && (
                    <motion.div
                      className="concept-map__connection"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <ArrowRight size={20} className="text-gray-500" />
                    </motion.div>
                  )}

                  {/* Successors */}
                  {successors.length > 0 && (
                    <motion.div
                      className="concept-map__section concept-map__section--next"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="concept-map__section-header">
                        <Target size={16} className="text-green-400" />
                        <span>Next Steps</span>
                      </div>
                      <div className="concept-map__concepts">
                        {successors.slice(0, 4).map((c, i) => (
                          <motion.div
                            key={c}
                            className="concept-map__concept concept-map__concept--next"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                          >
                            <Zap size={12} className="text-green-400" />
                            <span>{capsFirst(c)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Related concepts */}
                {related.length > 0 && (
                  <motion.div
                    className="concept-map__related"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="concept-map__related-header">
                      <Lightbulb size={16} className="text-amber-400" />
                      <span>Related Concepts</span>
                    </div>
                    <div className="concept-map__related-grid">
                      {related.slice(0, 8).map((c, i) => (
                        <motion.div
                          key={c}
                          className="concept-map__related-pill"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 + i * 0.05 }}
                          whileHover={{
                            scale: 1.1,
                            backgroundColor: "rgba(251, 191, 36, 0.2)",
                          }}
                        >
                          {capsFirst(c)}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .concept-map {
          margin: 0.5rem 0;
        }
        .concept-map__toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          color: #e9d5ff;
          cursor: pointer;
          text-align: left;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }
        .concept-map__toggle:hover { 
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15));
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-1px);
        }
        
        .concept-map__dialog {
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1);
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .concept-map__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .concept-map__content {
          padding: 24px;
        }
        
        .concept-map__pathway {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 32px;
        }
        
        @media (max-width: 768px) {
          .concept-map__pathway {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .concept-map__connection {
            transform: rotate(90deg);
          }
        }
        
        .concept-map__section {
          text-align: center;
        }
        
        .concept-map__section-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #9ca3af;
        }
        
        .concept-map__concepts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .concept-map__concept {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .concept-map__concept--pre {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #93c5fd;
        }
        
        .concept-map__concept--next {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }
        
        .concept-map__current-concept {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
          border: 2px solid rgba(139, 92, 246, 0.4);
          border-radius: 16px;
        }
        
        .concept-map__current-icon {
          width-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center;
        }
        
        .concept-map__current-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #e9d5ff;
        }
        
        .concept-map__current-subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        
        .concept-map__connection {
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center;
        }
        
        .concept-map__related {
          border-top: 1px solid rgba(139, 92, 246, 0.2);
          padding-top: 24px;
        }
        
        .concept-map__related-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #9ca3af;
        }
        
        .concept-map__related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }
        
        .concept-map__related-pill {
          padding: 8px 12px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 8px;
          color: #fbbf24;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}
