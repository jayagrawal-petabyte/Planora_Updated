import React, { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle2, PlusCircle, RefreshCw, Trash2, ArrowRightCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import type { ActivityItem } from '@planora/shared';

interface ActivityTimelineProps {
  projectId: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function getActivityIcon(action: string) {
  switch (action) {
    case 'CREATE_PROJECT':
    case 'CREATE_TASK':
      return <PlusCircle size={16} className="activity-icon-create" />;
    case 'UPDATE_TASK':
    case 'UPDATE_PROJECT':
      return <ArrowRightCircle size={16} className="activity-icon-update" />;
    case 'DELETE_TASK':
    case 'DELETE_PROJECT':
      return <Trash2 size={16} className="activity-icon-delete" />;
    default:
      return <CheckCircle2 size={16} className="activity-icon-default" />;
  }
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = useCallback(async (targetPage: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await api.get(`/projects/${projectId}/activity?page=${targetPage}&limit=10`);
      if (res.data.success) {
        const fetchedActivities: ActivityItem[] = res.data.data.activities;
        setActivities((prev) => (append ? [...prev, ...fetchedActivities] : fetchedActivities));
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setPage(targetPage);
      }
    } catch {
      setError('Failed to load project activity. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);


  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchActivities(page + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="activity-timeline-loading">
        <RefreshCw className="spin-icon" size={20} />
        <span>Loading project activity history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-timeline-error">
        <AlertCircle size={20} />
        <p>{error}</p>
        <button
          type="button"
          onClick={() => fetchActivities(1, false)}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-timeline-empty">
        <Clock size={36} />
        <h4>No activity recorded yet</h4>
        <p>Actions performed on this project and its tasks will appear here in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="activity-timeline-container">
      <div className="activity-timeline-header">
        <h3>Project Activity History</h3>
        <button
          type="button"
          onClick={() => fetchActivities(1, false)}
          className="activity-refresh-btn"
          title="Refresh activity"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="activity-timeline-list">
        {activities.map((item) => (
          <div key={item.id} className="activity-timeline-item">
            <div className="activity-timeline-marker">
              {getActivityIcon(item.action)}
            </div>

            <div className="activity-timeline-content">
              <div className="activity-summary-row">
                <span className="activity-summary-text">{item.summary}</span>
                <span className="activity-time-tag">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>

              <div className="activity-meta-row">
                <span className={`activity-entity-badge badge-${item.entityType.toLowerCase()}`}>
                  {item.entityType}
                </span>
                <span className="activity-timestamp-full">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {page < totalPages && (
        <div className="activity-load-more-wrap">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="activity-load-more-btn"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="spin-icon" size={14} /> Loading...
              </>
            ) : (
              'Load More Activity'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
