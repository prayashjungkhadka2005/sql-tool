"use client";

import { useState } from "react";
import { TbApi } from "react-icons/tb";

interface ApiTesterProps {
  onClose: () => void;
}

export default function ApiTester({ onClose }: ApiTesterProps) {
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [apiHeaders, setApiHeaders] = useState("{}");
  const [apiBody, setApiBody] = useState("");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiResponseCopied, setApiResponseCopied] = useState(false);

  // API Tester - Make Request
  const testApi = async () => {
    try {
      setApiLoading(true);
      setApiError("");
      setApiResponse(null);

      // Parse headers
      let headers: any = {};
      try {
        headers = JSON.parse(apiHeaders || "{}");
      } catch (e) {
        throw new Error("Invalid JSON in headers");
      }

      // Build request options
      const options: RequestInit = {
        method: apiMethod,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      // Add body for POST, PUT
      if ((apiMethod === "POST" || apiMethod === "PUT") && apiBody) {
        try {
          JSON.parse(apiBody); // Validate JSON
          options.body = apiBody;
        } catch (e) {
          throw new Error("Invalid JSON in request body");
        }
      }

      // Make request
      const startTime = Date.now();
      const response = await fetch(apiUrl, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Get response
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Build response object
      const responseHeaders: any = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: data,
        duration: duration,
      });

    } catch (error: any) {
      // Show actual error with helpful context
      const actualError = error.message || error.toString();
      let errorMessage = actualError;
      
      // Add helpful context based on error type
      if (actualError === "Failed to fetch") {
        try {
          const origin = new URL(apiUrl).origin;
          errorMessage = `${actualError}\n\n💡 This is likely a CORS error. The API at ${origin} doesn't allow requests from this website. Solutions:\n• Use a public API like https://jsonplaceholder.typicode.com/users/1\n• Configure CORS headers on your backend\n• Use a CORS proxy for testing`;
        } catch {
          errorMessage = `${actualError}\n\n💡 Check your API URL format.`;
        }
      } else if (actualError.includes("Invalid JSON")) {
        errorMessage = `${actualError}\n\n💡 Check your JSON syntax in headers or body.`;
      } else if (actualError.includes("NetworkError") || actualError.includes("Network request failed")) {
        errorMessage = `${actualError}\n\n💡 Check your internet connection and API URL.`;
      }
      
      setApiError(errorMessage);
      console.error("API Test Error:", error);
    } finally {
      setApiLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setApiResponseCopied(true);
    setTimeout(() => setApiResponseCopied(false), 2000);
  };

  return (
      <div className="backdrop-blur-xl bg-white/95 dark:bg-warm-dark/95 border-t border-primary/30 dark:border-secondary/30 shadow-2xl rounded-t-3xl max-h-[650px] flex flex-col">
        {/* Fixed Header */}
        <div className="p-3 sm:p-8 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-lg md:text-xl font-bold text-foreground flex items-center gap-1.5 sm:gap-3">
            <div className="p-1 sm:p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg sm:rounded-xl flex-shrink-0">
              <TbApi className="text-base sm:text-xl md:text-2xl text-primary" />
            </div>
            <span className="truncate">API Tester</span>
          </h3>
          <div className="flex items-center gap-2">
            {apiResponse && (
              <button
                onClick={() => {
                  setApiUrl("");
                  setApiHeaders("{}");
                  setApiBody("");
                  setApiResponse(null);
                  setApiError("");
                }}
                className="text-xs text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all group"
              title="Close (ESC)"
            >
              <svg className="w-5 h-5 text-foreground/60 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

        {/* Scrollable Content */}
        <div className="px-4 sm:px-8 pb-4 sm:pb-8 overflow-auto flex-1">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Request */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground/80 uppercase tracking-wide">Request</h4>
            
            {/* Method and URL */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="w-full sm:w-32">
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Method
                </label>
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-sm font-medium"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl text-xs sm:text-sm text-foreground focus:outline-none transition-all shadow-sm font-mono"
                  placeholder="https://api.example.com/users"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                Headers (JSON)
              </label>
              <textarea
                className="w-full h-20 sm:h-24 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl text-xs sm:text-sm text-foreground resize-none focus:outline-none transition-all font-mono shadow-sm"
                placeholder='{"Authorization": "Bearer token123"}'
                value={apiHeaders}
                onChange={(e) => setApiHeaders(e.target.value)}
              />
            </div>

            {/* Request Body (for POST/PUT) */}
            {(apiMethod === "POST" || apiMethod === "PUT") && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Request Body (JSON)
                </label>
                <textarea
                  className="w-full h-24 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl text-xs sm:text-sm text-foreground resize-none focus:outline-none transition-all font-mono shadow-sm"
                  placeholder='{"name": "John", "email": "john@example.com"}'
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                />
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={testApi}
              disabled={!apiUrl.trim() || apiLoading}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {apiLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sending Request...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Send Request
                </>
              )}
            </button>
          </div>

          {/* Right Column - Response */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground/80 uppercase tracking-wide">Response</h4>
            
            {/* Error Display */}
            {apiError && (
              <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line leading-relaxed">{apiError}</div>
              </div>
            )}

            {/* Response Display */}
            {apiResponse ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                      apiResponse.status >= 200 && apiResponse.status < 300 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : apiResponse.status >= 400
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {apiResponse.status} {apiResponse.statusText}
                    </span>
                    <span className="text-xs text-foreground/50 font-medium">
                      {apiResponse.duration}ms
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(apiResponse.data, null, 2))}
                    className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all flex items-center gap-1.5"
                  >
                    {apiResponseCopied ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                {/* Response Body */}
                <div className="p-4 bg-white dark:bg-warm-dark border-2 border-green-200 dark:border-green-800/50 rounded-xl overflow-auto shadow-sm">
                  <pre className="text-xs text-foreground font-mono leading-relaxed">
                    {typeof apiResponse.data === 'object' 
                      ? JSON.stringify(apiResponse.data, null, 2)
                      : apiResponse.data}
                  </pre>
                </div>

                {/* Response Headers */}
                <details className="group flex-shrink-0">
                  <summary className="cursor-pointer text-sm font-medium text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Response Headers
                  </summary>
                  <div className="mt-2 p-3 bg-white dark:bg-warm-dark border border-primary/20 rounded-lg max-h-48 overflow-auto">
                    <pre className="text-xs text-foreground/70 font-mono leading-relaxed">
                      {JSON.stringify(apiResponse.headers, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            ) : !apiError && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg className="w-16 h-16 text-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-foreground/50">
                  Send a request to see the response
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

