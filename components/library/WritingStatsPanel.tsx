'use client';

import { useState, useEffect } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  getCalendarData,
  getCurrentStreak,
  getLongestStreak,
  getTotalWords,
  getTotalDays,
  getBestHours,
} from '@/lib/writingStats';

export function WritingStatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarData, setCalendarData] = useState<
    { date: string; count: number; level: number }[]
  >([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [bestHours, setBestHours] = useState<{ hour: number; words: number }[]>(
    []
  );

  // Refresh stats whenever panel opens
  useEffect(() => {
    if (!isOpen) return;
    setCalendarData(getCalendarData());
    setStreak(getCurrentStreak());
    setLongestStreak(getLongestStreak());
    setTotalWords(getTotalWords());
    setTotalDays(getTotalDays());
    setBestHours(getBestHours());
  }, [isOpen]);

  // Also load on first render to show the toggle summary
  useEffect(() => {
    setStreak(getCurrentStreak());
    setTotalWords(getTotalWords());
  }, []);

  const statCards = [
    {
      label: 'Current Streak',
      value: `${streak}`,
      suffix: streak === 1 ? 'day' : 'days',
      icon: 'local_fire_department',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      label: 'Longest Streak',
      value: `${longestStreak}`,
      suffix: longestStreak === 1 ? 'day' : 'days',
      icon: 'emoji_events',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Total Words',
      value: totalWords.toLocaleString(),
      suffix: '',
      icon: 'article',
      color: 'text-primary',
      bg: 'bg-mint/30',
    },
    {
      label: 'Active Days',
      value: `${totalDays}`,
      suffix: totalDays === 1 ? 'day' : 'days',
      icon: 'calendar_month',
      color: 'text-lavender',
      bg: 'bg-lavender/30',
    },
  ];

  const maxHourWords = Math.max(...bestHours.map((h) => h.words), 1);

  function formatHour(h: number): string {
    if (h === 0) return '12a';
    if (h < 12) return `${h}a`;
    if (h === 12) return '12p';
    return `${h - 12}p`;
  }

  return (
    <div className="mb-8">
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-white border-2 border-ink/15 rounded-xl px-5 py-3.5 hover:border-ink/30 hover:shadow-hard-sm transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">
            insert_chart
          </span>
          <span className="font-display font-bold text-ink text-lg">
            Writing Stats
          </span>
          {!isOpen && streak > 0 && (
            <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-display font-bold px-2 py-0.5 rounded-full border border-orange-200">
              🔥 {streak} day streak
            </span>
          )}
          {!isOpen && totalWords > 0 && (
            <span className="text-xs font-marker text-gray-400 hidden sm:inline">
              {totalWords.toLocaleString()} words total
            </span>
          )}
        </div>
        <span
          className={`material-symbols-outlined text-gray-400 group-hover:text-ink transition-all ${isOpen ? 'rotate-180' : ''
            }`}
        >
          expand_more
        </span>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-3 bg-white border-2 border-ink/15 rounded-xl p-6 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
          {/* Stat cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((s) => (
              <div
                key={s.label}
                className={`${s.bg} border border-ink/10 rounded-xl p-3.5 flex items-center gap-3`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${s.color}`}
                >
                  {s.icon}
                </span>
                <div>
                  <div className="font-display font-extrabold text-ink text-xl leading-tight">
                    {s.value}{' '}
                    {s.suffix && (
                      <span className="text-sm font-normal text-gray-400">
                        {s.suffix}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-marker text-gray-500 uppercase tracking-wide">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">
              Writing Activity
            </h3>
            <div className="overflow-x-auto pb-2">
              {calendarData.length > 0 ? (
                <ActivityCalendar
                  data={calendarData}
                  theme={{
                    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    light: ['#ebedf0', '#d1fae5', '#6ee7b7', '#34d399', '#10b981'],
                  }}
                  colorScheme="light"
                  blockSize={13}
                  blockMargin={3}
                  blockRadius={3}
                  fontSize={12}
                  showWeekdayLabels
                  labels={{
                    totalCount: '{{count}} words written in the last year',
                  }}
                />
              ) : (
                <p className="font-marker text-sm text-gray-400">
                  Start writing to see your activity!
                </p>
              )}
            </div>
          </div>

          {/* Best Writing Hours */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">
              Peak Writing Hours
            </h3>
            {maxHourWords <= 0 ? (
              <p className="font-marker text-sm text-gray-400">
                Start writing to see your peak hours!
              </p>
            ) : (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bestHours} barCategoryGap="15%">
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatHour}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis hide />
                    <RechartsTooltip
                      formatter={(value) => [
                        `${value} words`,
                        'Written',
                      ]}
                      labelFormatter={(h) => {
                        const n = typeof h === 'number' ? h : 0;
                        const ampm = n < 12 ? 'AM' : 'PM';
                        const hr = n === 0 ? 12 : n > 12 ? n - 12 : n;
                        return `${hr}:00 ${ampm}`;
                      }}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '2px solid #e5e7eb',
                      }}
                    />
                    <Bar dataKey="words" radius={[4, 4, 0, 0]}>
                      {bestHours.map((entry) => (
                        <Cell
                          key={entry.hour}
                          fill={
                            entry.words === maxHourWords && entry.words > 0
                              ? '#10b981'
                              : entry.words > 0
                                ? '#6ee7b7'
                                : '#f3f4f6'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
