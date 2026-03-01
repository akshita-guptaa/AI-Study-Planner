import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

// ========================================
// ✅ MODALS MOVED OUTSIDE - FIXES CURSOR JUMPING
// ========================================

const SubjectModal = ({ formData, setFormData, onSubmit, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4">
          Add New Subject
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              required
              value={formData.subjectName}
              onChange={(e) =>
                setFormData({ ...formData, subjectName: e.target.value })
              }
              className="input-field"
              placeholder="e.g., Data Structures"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value })
              }
              className="input-field"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Date
            </label>
            <input
              type="date"
              required
              value={formData.examDate}
              onChange={(e) =>
                setFormData({ ...formData, examDate: e.target.value })
              }
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="input-field h-12"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Add Subject
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TopicModal = ({ formData, setFormData, onSubmit, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4">
          Add New Topic
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic Name
            </label>
            <input
              type="text"
              required
              value={formData.topicName}
              onChange={(e) =>
                setFormData({ ...formData, topicName: e.target.value })
              }
              className="input-field"
              placeholder="e.g., Binary Search Trees"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              required
              value={formData.estimatedHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedHours: parseFloat(e.target.value),
                })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="input-field"
              rows="3"
              placeholder="Additional notes or resources..."
            ></textarea>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Add Topic
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================================
// ✅ MAIN PLANNER COMPONENT
// ========================================

const Planner = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('subjects');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // State for subjects
  const [subjects, setSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // State for topics
  const [topics, setTopics] = useState([]);
  const [showTopicModal, setShowTopicModal] = useState(false);

  // State for tasks
  const [tasks, setTasks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    subjectName: '',
    difficulty: 'medium',
    priority: 3,
    examDate: '',
    color: '#3b82f6',
  });

  const [topicForm, setTopicForm] = useState({
    topicName: '',
    estimatedHours: 1,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, tasksRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/planner/tasks'),
      ]);
      setSubjects(subjectsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== SUBJECT FUNCTIONS ====================

  const handleCreateSubject = async () => {
    try {
      await api.post('/subjects', subjectForm);
      setShowSubjectModal(false);
      setSubjectForm({
        subjectName: '',
        difficulty: 'medium',
        priority: 3,
        examDate: '',
        color: '#3b82f6',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating subject:', error);
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${subjectId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    }
  };

  const handleViewSubject = async (subject) => {
    try {
      const res = await api.get(`/subjects/${subject._id}`);
      setTopics(res.data.topics || []);
      setSelectedSubject(subject);
      setActiveTab('topics');
    } catch (error) {
      console.error('Error fetching subject details:', error);
    }
  };

  // ==================== TOPIC FUNCTIONS ====================

  const handleCreateTopic = async () => {
    if (!selectedSubject) return;

    try {
      await api.post(`/subjects/${selectedSubject._id}/topics`, topicForm);
      setShowTopicModal(false);
      setTopicForm({ topicName: '', estimatedHours: 1, notes: '' });
      
      const res = await api.get(`/subjects/${selectedSubject._id}`);
      setTopics(res.data.topics || []);
      fetchData();
    } catch (error) {
      console.error('Error creating topic:', error);
      alert(error.response?.data?.message || 'Failed to create topic');
    }
  };

  const handleToggleTopicComplete = async (topic) => {
    try {
      await api.put(`/subjects/${selectedSubject._id}/topics/${topic._id}`, {
        completed: !topic.completed,
      });

      const res = await api.get(`/subjects/${selectedSubject._id}`);
      setTopics(res.data.topics || []);
      fetchData();
    } catch (error) {
      console.error('Error updating topic:', error);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;

    try {
      await api.delete(`/subjects/${selectedSubject._id}/topics/${topicId}`);
      
      const res = await api.get(`/subjects/${selectedSubject._id}`);
      setTopics(res.data.topics || []);
      fetchData();
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  // ==================== AI PLANNER FUNCTIONS ====================

  const handleGeneratePlan = async () => {
    if (subjects.length === 0) {
      alert('Please add at least one subject before generating a plan');
      return;
    }

    const hasTopics = subjects.some((s) => s.totalTopics > 0);
    if (!hasTopics) {
      alert('Please add topics to your subjects before generating a plan');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/planner/generate', {
        daysToGenerate: 7,
        dailyHours: user.dailyStudyHours || 4,
      });

      alert(`Successfully generated ${res.data.totalTasks} study tasks!`);
      setActiveTab('schedule');
      
      const tasksRes = await api.get('/planner/tasks');
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error generating plan:', error);
      alert(error.response?.data?.message || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  // ==================== TASK FUNCTIONS ====================

  const getWeekTasks = () => {
    const today = new Date();
    today.setDate(today.getDate() + selectedWeek * 7);
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return tasks.filter((task) => {
      const taskDate = new Date(task.plannedDate);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  };

  const getTasksByDay = () => {
    const weekTasks = getWeekTasks();
    const tasksByDay = {};

    for (let i = 0; i < 7; i++) {
      const today = new Date();
      today.setDate(today.getDate() + selectedWeek * 7);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayKey = day.toISOString().split('T')[0];

      tasksByDay[dayKey] = weekTasks.filter(
        (task) => task.plannedDate.split('T')[0] === dayKey
      );
    }

    return tasksByDay;
  };

  const handleCompleteTask = async (taskId, currentStatus) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      await api.put(`/planner/tasks/${taskId}`, {
        status: currentStatus === 'completed' ? 'pending' : 'completed',
        actualHours: currentStatus === 'completed' ? 0 : task.plannedHours,
      });

      const tasksRes = await api.get('/planner/tasks');
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderSubjects = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        {/* ✅ FIXED: Added space between text-black and dark:text-white */}
        <h2 className="text-2xl font-display font-bold text-black dark:text-white">
          Your Subjects ({subjects.length})
        </h2>
        <button onClick={() => setShowSubjectModal(true)} className="btn-primary">
          + Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12 card">
          <span className="text-6xl mb-4 block">📚</span>
          {/* ✅ FIXED: Removed extra space */}
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            No subjects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add your first subject to start planning your studies
          </p>
          <button onClick={() => setShowSubjectModal(true)} className="btn-primary">
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const daysLeft = Math.ceil(
              (new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={subject._id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewSubject(subject)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* ✅ FIXED: Added space between text-black and dark:text-white */}
                    <h3 className="text-xl font-extrabold text-black dark:text-white mb-2">
                      {subject.subjectName}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          subject.difficulty === 'hard'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : subject.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {subject.difficulty}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      ></span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubject(subject._id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span className="font-medium">
                        {subject.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${subject.progressPercentage || 0}%`,
                          backgroundColor: subject.color,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      📅 Exam in{' '}
                      <span
                        className={
                          daysLeft <= 7
                            ? 'text-red-600 font-bold'
                            : daysLeft <= 14
                            ? 'text-orange-600 font-semibold'
                            : ''
                        }
                      >
                        {daysLeft} days
                      </span>
                    </span>
                    <span>
                      {subject.completedTopics || 0}/{subject.totalTopics || 0} topics
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderTopics = () => {
    if (!selectedSubject) {
      return (
        <div className="text-center py-12 card">
          <p className="text-gray-600 dark:text-gray-400">Select a subject to view topics</p>
          <button onClick={() => setActiveTab('subjects')} className="btn-primary mt-4">
            Go to Subjects
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => {
                setActiveTab('subjects');
                setSelectedSubject(null);
              }}
              className="text-primary-600 hover:text-primary-700 mb-2 flex items-center"
            >
              ← Back to Subjects
            </button>
            <h2 className="text-2xl font-display font-bold text-black dark:text-white">
              {selectedSubject.subjectName} - Topics ({topics.length})
            </h2>
          </div>
          <button onClick={() => setShowTopicModal(true)} className="btn-primary">
            + Add Topic
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-12 card">
            <span className="text-6xl mb-4 block">📝</span>
            {/* ✅ FIXED: Removed extra space */}
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              No topics yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add topics to break down this subject into manageable parts
            </p>
            <button onClick={() => setShowTopicModal(true)} className="btn-primary">
              Add First Topic
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <div
                key={topic._id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  topic.completed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={topic.completed}
                      onChange={() => handleToggleTopicComplete(topic)}
                      className="mt-1 h-5 w-5 text-primary-600 rounded"
                    />
                    <div className="flex-1">
                      <h4
                        className={`font-medium text-lg ${
                          topic.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {topic.topicName}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>⏱️ {topic.estimatedHours}h estimated</span>
                        <span>✅ {topic.actualHours || 0}h completed</span>
                      </div>
                      {topic.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {topic.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTopic(topic._id)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSchedule = () => {
    const tasksByDay = getTasksByDay();
    const today = new Date();
    today.setDate(today.getDate() + selectedWeek * 7);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-black dark:text-white">
            Study Schedule
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedWeek(selectedWeek - 1)}
              className="btn-secondary"
            >
              ← Previous Week
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {selectedWeek === 0 ? 'This Week' : `Week ${selectedWeek > 0 ? '+' : ''}${selectedWeek}`}
            </span>
            <button
              onClick={() => setSelectedWeek(selectedWeek + 1)}
              className="btn-secondary"
            >
              Next Week →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map((day, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            const dateKey = date.toISOString().split('T')[0];
            const dayTasks = tasksByDay[dateKey] || [];

            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={day}
                className={`card ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {day}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isToday ? 'text-primary-600' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task._id}
                        className={`p-2 rounded text-xs ${
                          task.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/20 border border-green-300'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleCompleteTask(task._id, task.status)}
                            className="mt-0.5 h-3 w-3"
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium truncate ${
                                task.status === 'completed'
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              {task.taskName}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span
                                className="text-xs px-1 rounded"
                                style={{
                                  backgroundColor: task.subjectId?.color + '20',
                                  color: task.subjectId?.color,
                                }}
                              >
                                {task.subjectId?.subjectName}
                              </span>
                              <span className="text-gray-500">{task.plannedHours}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
            <div>
              {/* ✅ FIXED: Changed to text-black */}
              <h1 className="text-3xl font-display font-bold text-black dark:text-white">
                Study Planner
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Organize your subjects and let AI create your study schedule
              </p>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {generating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>🤖 Generate AI Study Plan</>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'subjects'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📚 Subjects
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'topics'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📝 Topics
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📅 Schedule
            </button>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'subjects' && renderSubjects()}
            {activeTab === 'topics' && renderTopics()}
            {activeTab === 'schedule' && renderSchedule()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSubjectModal && (
        <SubjectModal
          formData={subjectForm}
          setFormData={setSubjectForm}
          onSubmit={handleCreateSubject}
          onClose={() => setShowSubjectModal(false)}
        />
      )}

      {showTopicModal && (
        <TopicModal
          formData={topicForm}
          setFormData={setTopicForm}
          onSubmit={handleCreateTopic}
          onClose={() => setShowTopicModal(false)}
        />
      )}
    </>
  );
};

export default Planner;