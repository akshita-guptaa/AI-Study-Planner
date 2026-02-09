import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subjects: [],
    todayTasks: [],
    recommendations: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];

      const [subjectsRes, tasksRes, recommendationsRes] = await Promise.all([
        api.get('/subjects'),
        api.get(`/planner/tasks?startDate=${today}&endDate=${today}`),
        api.get('/planner/recommendations'),
      ]);

      setStats({
        subjects: subjectsRes.data,
        todayTasks: tasksRes.data,
        recommendations: recommendationsRes.data,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.put(`/planner/tasks/${taskId}`, {
        status: 'completed',
        actualHours: stats.todayTasks.find((t) => t._id === taskId)?.plannedHours,
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  const completedToday = stats.todayTasks.filter((t) => t.status === 'completed').length;
  const totalToday = stats.todayTasks.length;
  const progressPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Today's Progress */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tasks Completed</span>
                  <span className="font-bold text-xl text-primary-600">
                    {completedToday}/{totalToday}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  {progressPercentage.toFixed(0)}% complete
                </p>
              </div>
            </div>

            {/* Active Subjects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Subjects</h3>
                <span className="text-2xl">📚</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Subjects</span>
                  <span className="font-bold text-2xl">{stats.subjects.length}</span>
                </div>
                <Link
                  to="/planner"
                  className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all subjects →
                </Link>
              </div>
            </div>

            {/* Study Streak */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Study Streak</h3>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  {user?.studyStreak || 0}
                </div>
                <p className="text-gray-600">days in a row</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Tasks */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-gray-900">
                    Today's Tasks
                  </h2>
                  <Link
                    to="/planner"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all
                  </Link>
                </div>

                {stats.todayTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📝</span>
                    <p className="text-gray-600 mb-4">No tasks scheduled for today</p>
                    <Link to="/planner" className="btn-primary">
                      Generate Study Plan
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.todayTasks.map((task) => (
                      <div
                        key={task._id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          task.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={task.status === 'completed'}
                              onChange={() => handleCompleteTask(task._id)}
                              className="mt-1 h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <h4
                                className={`font-medium ${
                                  task.status === 'completed'
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-900'
                                }`}
                              >
                                {task.taskName}
                              </h4>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: task.subjectId?.color + '20',
                                    color: task.subjectId?.color,
                                  }}
                                >
                                  {task.subjectId?.subjectName}
                                </span>
                                <span>⏱️ {task.plannedHours}h</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="lg:col-span-1">
              <div className="card">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
                  AI Recommendations
                </h2>

                {stats.recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block">🤖</span>
                    <p className="text-gray-600 text-sm">
                      No recommendations at the moment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          rec.type === 'urgent'
                            ? 'bg-red-50 border border-red-200'
                            : rec.type === 'warning'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <p className="text-sm text-gray-800">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="card mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    to="/planner"
                    className="block w-full text-left px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    📅 Generate New Plan
                  </Link>
                  <Link
                    to="/analytics"
                    className="block w-full text-left px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📊 View Analytics
                  </Link>
                  <Link
                    to="/profile"
                    className="block w-full text-left px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ⚙️ Update Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Subjects */}
          {stats.subjects.length > 0 && (
            <div className="card mt-8">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
                Your Subjects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.subjects.slice(0, 6).map((subject) => {
                  const daysLeft = Math.ceil(
                    (new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={subject._id}
                      className="p-4 rounded-lg border-2 hover:border-primary-300 transition-all cursor-pointer"
                      style={{ borderColor: subject.color + '40' }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {subject.subjectName}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            subject.difficulty === 'hard'
                              ? 'bg-red-100 text-red-700'
                              : subject.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {subject.difficulty}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Progress</span>
                          <span className="font-medium">
                            {subject.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${subject.progressPercentage}%`,
                              backgroundColor: subject.color,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>📅 Exam in {daysLeft} days</span>
                          <span>
                            {subject.completedTopics}/{subject.totalTopics} topics
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;