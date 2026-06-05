import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { questionAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { AlertCircle, CheckCircle, Clock, SkipForward, RefreshCw, TrendingUp, Zap, Sparkles, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Review() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const [statsRes, questionsRes] = await Promise.all([
        questionAPI.getReviewStats(),
        questionAPI.getManualReviews()
      ]);

      setStats(statsRes.data);
      setReviewItems(questionsRes.data.queue);
      setHasMore(false); // getManualReviews returns all for now
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching review data:', error);
      toast.error('Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await questionAPI.getManualReviews();

      setReviewItems(response.data.queue);
      setCurrentPage(nextPage);
      setHasMore(false);
    } catch (error) {
      console.error('Error loading more questions:', error);
      toast.error('Failed to load more questions');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleViewQuestion = (questionId) => {
    navigate(`/practice/${questionId}`);
  };

  const handleSkipQuestion = async (questionId) => {
    try {
      await questionAPI.skipQuestion(questionId);
      toast.success('Question skipped and added to review');
      fetchReviewData(); // Refresh data
    } catch (error) {
      console.error('Error skipping question:', error);
      toast.error('Failed to skip question');
    }
  };

  const handleMarkAsMastered = async (questionId) => {
    try {
      await questionAPI.markForReview(questionId);
      toast.success('Question added to manual review');
      fetchReviewData(); // Refresh data
    } catch (error) {
      console.error('Error marking as mastered:', error);
      toast.error('Failed to mark as mastered');
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'hard': 'bg-red-100 text-red-800 border-red-200',
      'very_hard': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDifficultyIcon = (difficulty) => {
    const icons = {
      'easy': <Sparkles className="w-4 h-4" />,
      'medium': <Zap className="w-4 h-4" />,
      'hard': <TrendingUp className="w-4 h-4" />,
      'very_hard': <TrendingUp className="w-4 h-4" />
    };
    return icons[difficulty] || <Sparkles className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/learn')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Review Center</h1>
          <p className="text-muted-foreground">
            {stats ? `You have ${stats.total_questions} questions waiting for review` : 'Loading review data...'}
          </p>
        </div>
        <Button onClick={() => fetchReviewData()} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Review Items</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_questions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.mastered_count} mastered, {stats.needs_review_count} need review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mastered Topics</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mastered_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Topics you've mastered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.needs_review_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions waiting for you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Review Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.review_streak} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Consecutive days reviewing
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Items List */}
      <div className="space-y-4">
        {reviewItems.length === 0 && !loading ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Review Items</AlertTitle>
            <AlertDescription>
              You're all caught up! Keep up the great work.
            </AlertDescription>
          </Alert>
        ) : (
          reviewItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.question_text}</h3>
                      <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                        {getDifficultyIcon(item.difficulty)}
                        {item.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Mastery: {item.mastery_level}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>Streak: {item.review_streak} days</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.topics.map((topic) => (
                        <Badge key={topic.id} variant="secondary">
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewQuestion(item.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View & Answer
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleSkipQuestion(item.id)}
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handleMarkAsMastered(item.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark for Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More Button */}
        {hasMore && !loadingMore && (
          <div className="flex justify-center mt-6">
            <Button onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More Questions'}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}