import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SessionExpiredModal = ({ isOpen, onClose, onLogin, onRenew }) => {
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState("");

  const handleRenewSession = async () => {
    setIsRenewing(true);
    setRenewError("");

    try {
      const success = await onRenew();
      if (success) {
        onClose();
      } else {
        setRenewError("Session renewal failed. Please login again.");
      }
    } catch (error) {
      setRenewError("Unable to renew session. Please login again.");
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass p-6 rounded-2xl border border-white/10 max-w-md w-full mx-4"
          >
            {/* Icon */}
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">
                Session Expired
              </h3>
              <p className="text-gray-400 mb-6">
                Your session has expired due to inactivity. You can renew your
                session or login again.
              </p>

              {/* Renew Error */}
              {renewError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{renewError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRenewSession}
                  disabled={isRenewing}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRenewing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Renewing...
                    </span>
                  ) : (
                    "Renew Session"
                  )}
                </button>

                <button
                  onClick={onLogin}
                  className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-all border border-white/20"
                >
                  Login Again
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 text-xs text-gray-500">
                <p>💡 Tip: Your progress is automatically saved</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionExpiredModal;
