import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import Navbar from "../components/Navbar";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    weeklyProgress: [],
    subjectDistribution: [],
    completionRate: 0,
    totalHoursThisWeek: 0,
    totalTasksCompleted: 0,
    averageSessionLength: 0,
    subjectPerformance: [],
    dailyGoalProgress: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week"); // week, month, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      if (timeRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === "month") {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const tasksRes = await api.get(
        `/planner/tasks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      const subjectsRes = await api.get("/subjects");

      const tasks = tasksRes.data;
      const subjects = subjectsRes.data;

      // ========== WEEKLY PROGRESS ==========
      const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
      const weeklyProgress = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayTasks = tasks.filter(
          (t) => t.plannedDate.split("T")[0] === dateStr,
        );

        const completedHours = dayTasks
          .filter((t) => t.status === "completed")
          .reduce((sum, t) => sum + (t.actualHours || t.plannedHours), 0);

        const plannedHours = dayTasks.reduce(
          (sum, t) => sum + t.plannedHours,
          0,
        );

        weeklyProgress.push({
          date:
            timeRange === "week"
              ? date.toLocaleDateString("en-US", { weekday: "short" })
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
          completed: parseFloat(completedHours.toFixed(1)),
          planned: parseFloat(plannedHours.toFixed(1)),
          goal: user?.dailyStudyHours || 4,
        });
      }

      // ========== SUBJECT DISTRIBUTION ==========
      const subjectHours = {};
      const subjectTaskCounts = {};

      tasks
        .filter((t) => t.status === "completed")
        .forEach((task) => {
          const subjectName = task.subjectId?.subjectName || "Other";
          subjectHours[subjectName] =
            (subjectHours[subjectName] || 0) +
            (task.actualHours || task.plannedHours);
          subjectTaskCounts[subjectName] =
            (subjectTaskCounts[subjectName] || 0) + 1;
        });

      const subjectDistribution = Object.entries(subjectHours).map(
        ([name, hours]) => ({
          name,
          hours: parseFloat(hours.toFixed(1)),
          tasks: subjectTaskCounts[name],
        }),
      );

      // ========== SUBJECT PERFORMANCE (RADAR CHART) ==========
      const subjectPerformance = subjects.slice(0, 6).map((subject) => {
        const subjectTasks = tasks.filter(
          (t) => t.subjectId?._id === subject._id,
        );

        const completedCount = subjectTasks.filter(
          (t) => t.status === "completed",
        ).length;

        const completionRate =
          subjectTasks.length > 0
            ? (completedCount / subjectTasks.length) * 100
            : 0;

        return {
          subject: subject.subjectName,
          completion: parseFloat(completionRate.toFixed(1)),
          progress: subject.progressPercentage || 0,
          priority: subject.priority * 20, // Scale to 0-100
        };
      });

      // ========== DAILY GOAL PROGRESS ==========
      const dailyGoalProgress = weeklyProgress.slice(-7).map((day) => ({
        ...day,
        goalPercentage: user?.dailyStudyHours
          ? Math.min((day.completed / user.dailyStudyHours) * 100, 100)
          : 0,
      }));

      // ========== STATISTICS ==========
      const completedTasks = tasks.filter((t) => t.status === "completed");
      const totalHoursThisWeek = weeklyProgress
        .slice(-7)
        .reduce((sum, d) => sum + d.completed, 0);

      const completionRate =
        tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

      const averageSessionLength =
        completedTasks.length > 0
          ? completedTasks.reduce(
              (sum, t) => sum + (t.actualHours || t.plannedHours),
              0,
            ) / completedTasks.length
          : 0;

      setAnalytics({
        weeklyProgress,
        subjectDistribution,
        completionRate,
        totalHoursThisWeek,
        totalTasksCompleted: completedTasks.length,
        averageSessionLength,
        subjectPerformance,
        dailyGoalProgress,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                📈 Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Track your study progress and performance
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                onClick={() => setTimeRange("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "week"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "month"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Completion Rate */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Completion Rate
                </h3>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {analytics.completionRate.toFixed(0)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Total Study Hours */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Study Hours
                </h3>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {analytics.totalHoursThisWeek.toFixed(1)}h
              </div>
              <p className="text-xs text-gray-500">This week</p>
            </div>

            {/* Tasks Completed */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Tasks Done
                </h3>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {analytics.totalTasksCompleted}
              </div>
              <p className="text-xs text-gray-500">Total completed</p>
            </div>

            {/* Average Session */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Avg Session
                </h3>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {analytics.averageSessionLength.toFixed(1)}h
              </div>
              <p className="text-xs text-gray-500">Per study session</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Weekly Progress Line Chart */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Study Progress Over Time
              </h2>
              {analytics.weeklyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.weeklyProgress}>
                    <defs>
                      <linearGradient
                        id="colorCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="Completed Hours"
                    />
                    <Line
                      type="monotone"
                      dataKey="goal"
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      name="Daily Goal"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Subject Distribution Pie Chart */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Study Time by Subject
              </h2>
              {analytics.subjectDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.subjectDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {analytics.subjectDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No study sessions recorded
                </div>
              )}
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subject Hours Bar Chart */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Hours by Subject
              </h2>
              {analytics.subjectDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.subjectDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#3b82f6" name="Study Hours" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Subject Performance Radar */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Subject Performance
              </h2>
              {analytics.subjectPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analytics.subjectPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Completion"
                      dataKey="completion"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Progress"
                      dataKey="progress"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Add subjects to see performance
                </div>
              )}
            </div>
          </div>

          {/* Daily Goal Achievement */}
          <div className="card mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Daily Goal Achievement
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {analytics.dailyGoalProgress.map((day, index) => {
                const percentage = day.goalPercentage || 0;
                const isComplete = percentage >= 100;

                return (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-600 mb-2">{day.date}</div>
                    <div
                      className={`h-24 rounded-lg flex flex-col items-center justify-center ${
                        isComplete
                          ? "bg-green-100 border-2 border-green-500"
                          : percentage >= 50
                            ? "bg-yellow-100 border-2 border-yellow-500"
                            : "bg-red-100 border-2 border-red-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {isComplete ? "✅" : percentage >= 50 ? "⚠️" : "❌"}
                      </div>
                      <div className="text-xs font-bold">{day.completed}h</div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                <span>Goal Met (100%+)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded mr-2"></div>
                <span>Partial (50-99%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded mr-2"></div>
                <span>Below Goal (&lt;50%)</span>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="card mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📊 Insights & Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.completionRate >= 80 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    🎉 Excellent Performance!
                  </h3>
                  <p className="text-sm text-green-700">
                    You're completing {analytics.completionRate.toFixed(0)}% of
                    your tasks. Keep up the great work!
                  </p>
                </div>
              )}

              {analytics.completionRate < 50 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    ⚠️ Room for Improvement
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Your completion rate is{" "}
                    {analytics.completionRate.toFixed(0)}%. Consider reducing
                    daily tasks or extending study time.
                  </p>
                </div>
              )}

              {analytics.totalHoursThisWeek >=
                (user?.dailyStudyHours || 4) * 7 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    🎯 Weekly Goal Achieved!
                  </h3>
                  <p className="text-sm text-blue-700">
                    You've studied {analytics.totalHoursThisWeek.toFixed(1)}{" "}
                    hours this week, meeting your weekly target!
                  </p>
                </div>
              )}

              {analytics.averageSessionLength < 1 &&
                analytics.totalTasksCompleted > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      💡 Tip: Longer Sessions
                    </h3>
                    <p className="text-sm text-purple-700">
                      Your average session is{" "}
                      {analytics.averageSessionLength.toFixed(1)} hours. Try
                      longer, more focused study sessions for better retention.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
