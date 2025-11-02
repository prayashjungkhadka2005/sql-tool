"use client";

import { useState } from "react";
import { BiTime } from "react-icons/bi";

interface CronBuilderProps {
  onClose: () => void;
}

export default function CronBuilder({ onClose }: CronBuilderProps) {
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [cronCopied, setCronCopied] = useState(false);

  // Generate cron expression
  const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

  // Human-readable translation
  const getHumanReadable = () => {
    let description = "";
    
    // Determine time component
    if (minute === "*" && hour === "*") {
      description = "Every minute";
    } else if (minute === "*" && hour !== "*") {
      // Every minute during a specific hour
      const hourNum = hour.startsWith("*/") ? hour : parseInt(hour);
      if (hour.startsWith("*/")) {
        description = `Every minute, every ${hour.slice(2)} hours`;
      } else {
        const hourFormatted = parseInt(hour) === 0 ? "12" : parseInt(hour) > 12 ? (parseInt(hour) - 12).toString() : hour;
        const period = parseInt(hour) >= 12 ? "PM" : "AM";
        description = `Every minute, between ${hourFormatted.padStart(2, '0')}:00 ${period} and ${hourFormatted.padStart(2, '0')}:59 ${period}`;
      }
    } else if (minute.startsWith("*/")) {
      // Every N minutes
      const interval = minute.slice(2);
      if (hour === "*") {
        description = `Every ${interval} minutes`;
      } else {
        const hourFormatted = parseInt(hour) === 0 ? "12" : parseInt(hour) > 12 ? (parseInt(hour) - 12).toString() : hour;
        const period = parseInt(hour) >= 12 ? "PM" : "AM";
        description = `Every ${interval} minutes, between ${hourFormatted.padStart(2, '0')}:00 ${period} and ${hourFormatted.padStart(2, '0')}:59 ${period}`;
      }
    } else {
      // Specific minute
      const minPadded = minute.padStart(2, '0');
      if (hour === "*") {
        description = `At ${minPadded} minutes past every hour`;
      } else if (hour.startsWith("*/")) {
        description = `At ${minPadded} minutes past every ${hour.slice(2)} hours`;
      } else {
        const hourFormatted = parseInt(hour) === 0 ? "12" : parseInt(hour) > 12 ? (parseInt(hour) - 12).toString() : hour;
        const period = parseInt(hour) >= 12 ? "PM" : "AM";
        description = `At ${hourFormatted.padStart(2, '0')}:${minPadded} ${period}`;
      }
    }

    // Add day of week
    if (dayOfWeek !== "*") {
      if (dayOfWeek === "1-5") {
        description += ", only on weekdays";
      } else if (dayOfWeek === "0,6") {
        description += ", only on weekends";
      } else {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        description += `, only on ${days[parseInt(dayOfWeek)]}`;
      }
    }

    // Add day of month
    if (dayOfMonth !== "*") {
      if (dayOfMonth.startsWith("*/")) {
        description += `, every ${dayOfMonth.slice(2)} days`;
      } else {
        const suffix = dayOfMonth === "1" ? "st" : dayOfMonth === "2" ? "nd" : dayOfMonth === "3" ? "rd" : "th";
        description += `, only on the ${dayOfMonth}${suffix}`;
      }
    }

    // Add month
    if (month !== "*") {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      description += `, only in ${months[parseInt(month) - 1]}`;
    }

    return description;
  };

  // Calculate next 5 run times
  const getNextRuns = () => {
    const now = new Date();
    const runs: string[] = [];
    let currentDate = new Date(now);
    
    // Simple approximation for demo (real cron parser would be more complex)
    for (let i = 0; i < 5; i++) {
      if (minute === "0" && hour !== "*") {
        currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
        currentDate.setHours(parseInt(hour), 0, 0, 0);
      } else if (minute.startsWith("*/")) {
        const interval = parseInt(minute.slice(2));
        currentDate = new Date(currentDate.getTime() + (interval * 60 * 1000));
      } else {
        currentDate = new Date(currentDate.getTime() + (60 * 60 * 1000));
      }
      
      runs.push(currentDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
    
    return runs;
  };

  // Common presets
  const presets = [
    { name: "Every Minute", cron: "* * * * *", values: ["*", "*", "*", "*", "*"] },
    { name: "Every Hour", cron: "0 * * * *", values: ["0", "*", "*", "*", "*"] },
    { name: "Every Day at Midnight", cron: "0 0 * * *", values: ["0", "0", "*", "*", "*"] },
    { name: "Every Monday at 9 AM", cron: "0 9 * * 1", values: ["0", "9", "*", "*", "1"] },
    { name: "Every 15 Minutes", cron: "*/15 * * * *", values: ["*/15", "*", "*", "*", "*"] },
    { name: "First Day of Month", cron: "0 0 1 * *", values: ["0", "0", "1", "*", "*"] },
  ];

  const applyPreset = (values: string[]) => {
    setMinute(values[0]);
    setHour(values[1]);
    setDayOfMonth(values[2]);
    setMonth(values[3]);
    setDayOfWeek(values[4]);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCronCopied(true);
    setTimeout(() => setCronCopied(false), 2000);
  };

  return (
      <div className="backdrop-blur-xl bg-white/95 dark:bg-warm-dark/95 border-t border-primary/30 dark:border-secondary/30 shadow-2xl rounded-t-3xl max-h-[650px] flex flex-col">
        {/* Fixed Header */}
        <div className="p-3 sm:p-8 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-lg md:text-xl font-bold text-foreground flex items-center gap-1.5 sm:gap-3">
            <div className="p-1 sm:p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg sm:rounded-xl flex-shrink-0">
              <BiTime className="text-base sm:text-xl md:text-2xl text-primary" />
            </div>
            <span className="truncate">Cron Builder</span>
          </h3>
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

        {/* Scrollable Content */}
        <div className="px-4 sm:px-8 pb-4 sm:pb-8 overflow-auto flex-1">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Builder */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground/80 uppercase tracking-wide">Build Expression</h4>
            
            {/* Quick Presets */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                Common Patterns
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset.values)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-[10px] sm:text-xs font-medium text-foreground transition-all text-left"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cron Fields */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Minute (0-59)
                </label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-sm"
                >
                  <option value="*">Every minute (*)</option>
                  <option value="0">:00</option>
                  <option value="15">:15</option>
                  <option value="30">:30</option>
                  <option value="45">:45</option>
                  <option value="*/5">Every 5 minutes (*/5)</option>
                  <option value="*/10">Every 10 minutes (*/10)</option>
                  <option value="*/15">Every 15 minutes (*/15)</option>
                  <option value="*/30">Every 30 minutes (*/30)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Hour (0-23)
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-sm"
                >
                  <option value="*">Every hour (*)</option>
                  <option value="0">Midnight (0)</option>
                  <option value="6">6 AM</option>
                  <option value="9">9 AM</option>
                  <option value="12">Noon (12)</option>
                  <option value="18">6 PM</option>
                  <option value="*/2">Every 2 hours (*/2)</option>
                  <option value="*/6">Every 6 hours (*/6)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Day of Month (1-31)
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-sm"
                >
                  <option value="*">Every day (*)</option>
                  <option value="1">1st of month</option>
                  <option value="15">15th of month</option>
                  <option value="*/7">Every 7 days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Month (1-12)
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-sm"
                >
                  <option value="*">Every month (*)</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground/70 mb-1 sm:mb-2">
                  Day of Week (0-6)
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-sm"
                >
                  <option value="*">Every day (*)</option>
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="1-5">Weekdays (Mon-Fri)</option>
                  <option value="0,6">Weekends (Sat-Sun)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground/80 uppercase tracking-wide">Expression & Schedule</h4>
            
            {/* Cron Expression Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground/70">
                  Cron Expression
                </label>
                <button
                  onClick={() => copyToClipboard(cronExpression)}
                  className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all flex items-center gap-1.5"
                >
                  {cronCopied ? (
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
              <div className="p-4 bg-white dark:bg-warm-dark border-2 border-primary/30 rounded-xl font-mono text-sm text-foreground">
                {cronExpression}
              </div>
            </div>

            {/* Human Readable */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Human Readable
              </label>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                <p className="text-sm text-foreground leading-relaxed">
                  {getHumanReadable()}
                </p>
              </div>
            </div>

            {/* Next Run Times */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Next 5 Run Times
              </label>
              <div className="space-y-2">
                {getNextRuns().map((run, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white/50 dark:bg-warm-dark/50 border border-primary/10 rounded-lg">
                    <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-foreground/80 font-mono">{run}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cron Format Help */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Cron Format Guide
              </summary>
              <div className="mt-2 p-3 bg-white dark:bg-warm-dark border border-primary/20 rounded-lg text-xs text-foreground/70 space-y-1">
                <p><code className="font-mono bg-primary/10 px-1 rounded">*</code> = Any value</p>
                <p><code className="font-mono bg-primary/10 px-1 rounded">*/N</code> = Every N units</p>
                <p><code className="font-mono bg-primary/10 px-1 rounded">1-5</code> = Range (1 to 5)</p>
                <p><code className="font-mono bg-primary/10 px-1 rounded">1,3,5</code> = Specific values</p>
                <p className="pt-2 border-t border-primary/10 mt-2">
                  <strong>Format:</strong> minute hour day month weekday
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

