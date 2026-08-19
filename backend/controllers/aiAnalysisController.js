const axios = require('axios');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

// OpenAI API configuration (or use Claude, Gemini, etc.)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Analyze syllabus and generate topics with AI
 */
exports.analyzeSyllabus = async (req, res) => {
  try {
    const { subjectId, syllabusText, subjectName, examDate } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ message: 'Syllabus text is required' });
    }

    // Truncate very long syllabus text to avoid Groq 413 errors
    const MAX_SYLLABUS_CHARS = 6000;
    const trimmedSyllabus = syllabusText.length > MAX_SYLLABUS_CHARS
      ? syllabusText.slice(0, MAX_SYLLABUS_CHARS) + '\n[...truncated]'
      : syllabusText;

    // Calculate days until exam
    const daysUntilExam = Math.ceil(
      (new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Call AI API to analyze syllabus
    const aiPrompt = `
You are an expert educational AI assistant. Analyze this course syllabus and break it down into study topics.

SUBJECT: ${subjectName}
DAYS UNTIL EXAM: ${daysUntilExam}

SYLLABUS:
${trimmedSyllabus}

For each topic, provide:
1. Topic name (clear and concise)
2. Estimated hours needed (realistic, considering complexity)
3. Difficulty level (easy/medium/hard)
4. Importance level (1-5, where 5 is critical for exam)
5. Prerequisites (other topics that should be studied first)
6. Key concepts covered
7. Suggested resources or study tips

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "topicName": "Introduction to Data Structures",
    "estimatedHours": 4,
    "difficulty": "easy",
    "importance": 5,
    "prerequisites": [],
    "keyConcepts": ["Arrays", "Basic operations", "Memory management"],
    "studyTips": "Start with arrays before moving to complex structures",
    "order": 1
  },
  {
    "topicName": "Binary Search Trees",
    "estimatedHours": 8,
    "difficulty": "hard",
    "importance": 4,
    "prerequisites": ["Introduction to Data Structures"],
    "keyConcepts": ["Tree traversal", "Insert/Delete operations", "Balancing"],
    "studyTips": "Practice implementation problems daily",
    "order": 5
  }
]

Important: Ensure total estimated hours is realistic for ${daysUntilExam} days with 4-6 hours daily study.
Limit output to a maximum of 15 topics. Keep studyTips under 15 words each. Return ONLY the JSON array, no other text.
`;

    // Call OpenAI API (replace with your preferred AI service)
    const aiResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content analyzer. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    // Parse AI response
    const aiContent = aiResponse.data.choices[0].message.content;
    
    // Extract JSON from response (in case AI adds markdown formatting)
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    let analyzedTopics;
    try {
      analyzedTopics = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('Raw AI content that failed to parse:', aiContent);
      throw new Error('AI returned malformed JSON — response may have been truncated. Try a shorter syllabus or fewer topics.');
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Clear existing topics for this subject (fresh analysis)
    await Topic.deleteMany({ subjectId });

    // Create real Topic documents (matches manual "Add Topic" data model)
    const createdTopics = await Topic.insertMany(
      analyzedTopics.map((topic) => ({
        subjectId,
        topicName: topic.topicName,
        estimatedHours: topic.estimatedHours,
        difficulty: topic.difficulty,
        importance: topic.importance,
        prerequisites: topic.prerequisites,
        keyConcepts: topic.keyConcepts,
        studyTips: topic.studyTips,
        order: topic.order,
        completed: false,
        actualHours: 0,
      }))
    );

    res.json({
      success: true,
      message: `Successfully analyzed and added ${createdTopics.length} topics`,
      topics: createdTopics,
      totalEstimatedHours: analyzedTopics.reduce((sum, t) => sum + t.estimatedHours, 0),
    });
  } catch (error) {
    console.error('Error analyzing syllabus:', error);
    res.status(500).json({
      message: 'Failed to analyze syllabus',
      error: error.message,
    });
  }
};

/**
 * Estimate time for a single topic using AI
 */
exports.estimateTopicTime = async (req, res) => {
  try {
    const { topicName, subjectName, userLevel } = req.body;

    const aiPrompt = `
Estimate the study time needed for this topic:

SUBJECT: ${subjectName}
TOPIC: ${topicName}
STUDENT LEVEL: ${userLevel || 'intermediate'}

Provide:
1. Estimated hours (realistic)
2. Difficulty (easy/medium/hard)
3. Importance (1-5)
4. Key concepts to master
5. Study tips

Respond with JSON:
{
  "estimatedHours": 6,
  "difficulty": "medium",
  "importance": 4,
  "keyConcepts": ["concept1", "concept2"],
  "studyTips": "Focus on practical examples"
}
`;

    const aiResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert educational advisor.' },
          { role: 'user', content: aiPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const aiContent = aiResponse.data.choices[0].message.content;
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    const estimation = JSON.parse(jsonMatch[0]);

    res.json(estimation);
  } catch (error) {
    console.error('Error estimating topic time:', error);
    res.status(500).json({ message: 'Failed to estimate topic time' });
  }
};

module.exports = exports;
