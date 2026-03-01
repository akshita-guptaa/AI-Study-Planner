import { useState } from 'react';
import api from '../services/api';

const SyllabusAnalyzer = ({ subjectId, subjectName, examDate, onComplete, onClose }) => {
  const [syllabusText, setSyllabusText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!syllabusText.trim()) {
      setError('Please enter syllabus content');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await api.post('/ai/analyze-syllabus', {
        subjectId,
        subjectName,
        examDate,
        syllabusText,
      });

      alert(`Success! Analyzed ${response.data.topics.length} topics.\nTotal estimated time: ${response.data.totalEstimatedHours} hours`);
      onComplete(response.data.topics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze syllabus');
    } finally {
      setAnalyzing(false);
    }
  };

  const exampleSyllabus = `
Module 1: Introduction to Data Structures (2 weeks)
- Arrays and Strings
- Linked Lists
- Stacks and Queues

Module 2: Trees and Graphs (3 weeks)
- Binary Trees
- Binary Search Trees
- Graph Algorithms (BFS, DFS)
- Shortest Path Algorithms

Module 3: Advanced Topics (2 weeks)
- Dynamic Programming
- Greedy Algorithms
- Backtracking
`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🤖 AI Syllabus Analyzer
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Paste your course syllabus below. 
              Our AI will automatically analyze it and generate a study plan with:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>📝 Individual topics extracted from syllabus</li>
              <li>⏱️ Estimated study time for each topic</li>
              <li>📊 Difficulty level (Easy/Medium/Hard)</li>
              <li>⭐ Importance rating (1-5)</li>
              <li>📚 Suggested study order with prerequisites</li>
            </ul>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste Your Course Syllabus:
          </label>
          <textarea
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-xl 
                     focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
                     outline-none resize-none"
            placeholder={`Example:\n${exampleSyllabus}`}
          />

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">
              {syllabusText.length} characters
            </p>
            <button
              onClick={() => setSyllabusText(exampleSyllabus)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Use Example Syllabus
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !syllabusText.trim()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 inline" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Analyzing... (may take 10-30 seconds)
              </>
            ) : (
              <>🚀 Analyze with AI</>
            )}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>💡 Pro Tip:</strong> Include module names, topic titles, and any time estimates 
            from your syllabus for best results. The AI will automatically organize topics by 
            difficulty and importance!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyllabusAnalyzer;