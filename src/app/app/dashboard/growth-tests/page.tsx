'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { Brain, Clock, CheckCircle, ArrowRight, ArrowLeft, BookOpen, Target, MessageSquare, Users, Award, Lightbulb, TrendingUp, BarChart3, Star, Zap, RefreshCw } from 'lucide-react';
import { getGrowthTests, submitTestResult, getGrowthInsights } from "../../../../lib/api";

const COLORS = {
  darkBlue: "#264653",
  teal: "#2A9D8F",
  yellow: "#E9C46A",
  orange: "#F4A261",
  red: "#E76F51",
  white: "#fff",
  gray: "#f6f6f6",
  darkGray: "#6B7280",
  lightGray: "#F3F4F6",
  borderGray: "#E5E7EB",
  textGray: "#6B7280",
  successGreen: "#10B981",
  warningAmber: "#F59E0B",
  errorRed: "#EF4444"
};

interface GrowthTest {
  id: string;
  name: string;
  description: string;
  category: string;
  estimated_duration: number;
  isCompleted?: boolean;
  completedResult?: any;
  questions?: {
    questions: any[];
  };
}

export default function GrowthTestsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [tests, setTests] = useState<GrowthTest[]>([]);
  const [currentTest, setCurrentTest] = useState<GrowthTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadTests();
    }
  }, [isLoaded, user]);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const response = await getGrowthTests();
      if (response) {
        setTests(response.tests || []);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startTest = (test: GrowthTest) => {
    setCurrentTest(test);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const selectAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    if (currentTest?.questions?.questions && currentQuestionIndex < currentTest.questions.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitTest = async () => {
    if (!currentTest) return;

    try {
      setIsSubmitting(true);
      const result = await submitTestResult(
        parseInt(user?.id || '0'),
        parseInt(currentTest.id),
        answers,
        'Test completed successfully',
        []
      );
      if (result) {
        setShowResults(true);
        await loadTests();
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personality': return Brain;
      case 'leadership': return Users;
      case 'communication': return MessageSquare;
      case 'career': return Target;
      case 'strengths': return Award;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personality': return COLORS.teal;
      case 'leadership': return COLORS.darkBlue;
      case 'communication': return COLORS.orange;
      case 'career': return COLORS.yellow;
      case 'strengths': return COLORS.red;
      default: return COLORS.darkGray;
    }
  };

  if (!isLoaded) {
    return (
      <div style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", minHeight: '100vh', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <RefreshCw size={48} color={COLORS.teal} style={{ animation: 'spin 1s linear infinite' }} />
          <h2 style={{ marginTop: '20px', color: COLORS.darkBlue, fontSize: '24px' }}>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (currentTest && currentTest.questions && !showResults) {
    const questions = currentTest.questions.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const progress = (Object.keys(answers).length / questions.length) * 100;

    return (
      <div style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", minHeight: '100vh', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: COLORS.white, borderRadius: 28, padding: 32, marginBottom: '24px', boxShadow: '0 4px 24px rgba(38,70,83,0.10)', border: `1px solid ${COLORS.borderGray}` }}>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: COLORS.darkBlue, margin: '0 0 16px 0' }}>
              {currentTest.name}
            </h1>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: COLORS.textGray, fontSize: '14px' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span style={{ color: COLORS.textGray, fontSize: '14px' }}>
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div style={{ background: COLORS.lightGray, borderRadius: '8px', height: '8px' }}>
                <div style={{ background: getCategoryColor(currentTest.category), height: '100%', width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 28, padding: 32, marginBottom: '24px', boxShadow: '0 4px 24px rgba(38,70,83,0.10)', border: `1px solid ${COLORS.borderGray}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: COLORS.darkBlue, margin: '0 0 24px 0' }}>
              {currentQuestion.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.options.map((option: any, index: number) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(currentQuestion.id, option.value)}
                  style={{
                    background: answers[currentQuestion.id] === option.value ? getCategoryColor(currentTest.category) : COLORS.white,
                    color: answers[currentQuestion.id] === option.value ? COLORS.white : COLORS.darkBlue,
                    border: `2px solid ${answers[currentQuestion.id] === option.value ? getCategoryColor(currentTest.category) : COLORS.borderGray}`,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    minHeight: '60px'
                  }}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              style={{
                background: COLORS.white,
                color: COLORS.darkBlue,
                border: `2px solid ${COLORS.borderGray}`,
                borderRadius: '12px',
                padding: '12px 20px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentQuestionIndex === 0 ? 0.5 : 1
              }}
            >
              Previous
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={submitTest}
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? COLORS.lightGray : getCategoryColor(currentTest.category),
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestion.id]}
                style={{
                  background: !answers[currentQuestion.id] ? COLORS.lightGray : getCategoryColor(currentTest.category),
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  cursor: !answers[currentQuestion.id] ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", minHeight: '100vh', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: COLORS.white, borderRadius: 28, padding: 32, marginBottom: '24px', boxShadow: '0 4px 24px rgba(38,70,83,0.10)', border: `1px solid ${COLORS.borderGray}`, textAlign: 'center' }}>
            <div style={{ background: COLORS.successGreen, borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <CheckCircle size={40} color={COLORS.white} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '600', color: COLORS.darkBlue, margin: '0 0 12px 0' }}>
              Test Completed!
            </h1>
            <p style={{ color: COLORS.textGray, fontSize: '18px', margin: '0 0 24px 0' }}>
              You&apos;ve successfully completed the assessment.
            </p>
            <button
              onClick={() => {
                setCurrentTest(null);
                setShowResults(false);
              }}
              style={{
                background: COLORS.teal,
                color: COLORS.white,
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Take Another Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: COLORS.white, borderRadius: 28, padding: 32, marginBottom: '32px', boxShadow: '0 4px 24px rgba(38,70,83,0.10)', border: `1px solid ${COLORS.borderGray}` }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', color: COLORS.darkBlue, margin: '0 0 8px 0' }}>
            Growth Assessments
          </h1>
          <p style={{ color: COLORS.textGray, fontSize: '18px', margin: '0' }}>
            Discover your strengths, leadership style, and development opportunities
          </p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <RefreshCw size={48} color={COLORS.teal} style={{ animation: 'spin 1s linear infinite' }} />
            <h2 style={{ marginTop: '20px', color: COLORS.darkBlue, fontSize: '24px' }}>Loading assessments...</h2>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {tests.map((test) => (
              <div key={test.id} style={{ background: COLORS.white, borderRadius: 28, padding: 32, boxShadow: '0 4px 24px rgba(38,70,83,0.10)', border: `1px solid ${COLORS.borderGray}` }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: COLORS.darkBlue, margin: '0 0 8px 0' }}>
                  {test.name}
                </h3>
                <p style={{ color: COLORS.textGray, margin: '0 0 16px 0' }}>
                  {test.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <span style={{ color: COLORS.textGray, fontSize: '14px' }}>
                    {test.estimated_duration} min
                  </span>
                  <span style={{ color: COLORS.textGray, fontSize: '14px' }}>
                    {test.questions?.questions?.length || 0} questions
                  </span>
                </div>
                <button
                  onClick={() => startTest(test)}
                  style={{
                    background: getCategoryColor(test.category),
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    width: '100%'
                  }}
                >
                  Start Assessment
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={() => router.push('/app/dashboard')}
            style={{
              background: COLORS.white,
              color: COLORS.darkBlue,
              border: `2px solid ${COLORS.borderGray}`,
              borderRadius: '12px',
              padding: '16px 32px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 