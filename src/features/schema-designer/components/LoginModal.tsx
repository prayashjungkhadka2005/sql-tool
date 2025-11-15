"use client";

import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  isCheckingSession?: boolean;
  onClose?: () => void;
}

export default function LoginModal({ isOpen, isCheckingSession = false, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequestedLink, setHasRequestedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const callbackUrl =
        typeof window !== "undefined" ? window.location.href : "/tools/schema-designer";

      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (!result || result.error) {
        setError(result?.error ?? "Unable to send magic link. Please try again.");
        return;
      }

      setHasRequestedLink(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setHasRequestedLink(false);
    setError(null);
    setEmail("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose?.();
  };

  const shouldRender = isOpen || isCheckingSession;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="login-overlay"
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.div
            key="login-card"
            className="w-full max-w-md bg-white dark:bg-[#0e0e0e] border border-foreground/15 rounded-2xl shadow-[0_30px_120px_rgba(15,23,42,0.45)] p-8 space-y-6"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-foreground/40 font-semibold mb-2">
                Schema Designer
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all active:scale-95"
                aria-label="Close sign-in modal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                {hasRequestedLink ? "Check your email" : "Sign in to continue"}
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                {hasRequestedLink
                  ? `We sent a secure link to ${email || "your inbox"}. Open it on this device to continue.`
                  : "We’ll send a magic link to your email to verify it’s you."}
              </p>
            </div>

            {isCheckingSession && !hasRequestedLink ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <div className="h-12 w-12 rounded-full border-2 border-foreground/15 border-t-foreground/60 animate-spin" />
                <p className="text-sm text-foreground/60">Checking your session…</p>
              </div>
            ) : hasRequestedLink ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
                  Didn’t get the email? It can take up to a minute. Remember to check spam and
                  promotions folders.
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-2.5 rounded-lg border border-foreground/20 text-sm font-semibold text-foreground hover:border-foreground/40 active:scale-[0.98] transition-all"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-semibold text-foreground/70">
                    Work email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value.trimStart())}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-foreground/15 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-base"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending link..." : "Send magic link"}
                </button>
              </form>
            )}

            <p className="text-xs text-foreground/50 text-center">
              By continuing you agree to the Terms and Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


