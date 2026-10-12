import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PlusCircle, ArrowRightCircle, Trash2, CheckCircle2, Clock, RefreshCw } from 'lucide-react-native';
import api from '../services/api';
import type { ActivityItem } from '@planora/shared';

interface ActivityTimelineMobileProps {
  projectId: string;
  isOffline?: boolean;
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
      return <PlusCircle size={16} color="#10b981" />;
    case 'UPDATE_TASK':
    case 'UPDATE_PROJECT':
      return <ArrowRightCircle size={16} color="#3b82f6" />;
    case 'DELETE_TASK':
    case 'DELETE_PROJECT':
      return <Trash2 size={16} color="#ef4444" />;
    default:
      return <CheckCircle2 size={16} color="#64748b" />;
  }
}

export const ActivityTimelineMobile: React.FC<ActivityTimelineMobileProps> = ({
  projectId,
  isOffline = false
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await api.get(
          `/projects/${projectId}/activity?page=${targetPage}&limit=10`
        );
        if (res.data.success) {
          const fetched: ActivityItem[] = res.data.data.activities;
          setActivities((prev) => (append ? [...prev, ...fetched] : fetched));
          setTotalPages(res.data.data.pagination?.totalPages || 1);
          setPage(targetPage);

          if (targetPage === 1) {
            try {
              await SecureStore.setItemAsync(
                `offline_activity_${projectId}`,
                JSON.stringify(fetched)
              );
            } catch {
              // ignore secure store write failure
            }
          }
        }
      } catch (err: any) {
        // Fallback to offline cache
        try {
          const cached = await SecureStore.getItemAsync(
            `offline_activity_${projectId}`
          );
          if (cached) {
            setActivities(JSON.parse(cached));
            setError('Offline mode: Showing cached activity.');
          } else {
            setError(err.message || 'Failed to load project activity.');
          }
        } catch {
          setError(err.message || 'Failed to load project activity.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !isOffline) {
      fetchActivities(page + 1, true);
    }
  };

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color="#1a3626" />
        <Text style={styles.loadingText}>Loading activity history...</Text>
      </View>
    );
  }

  if (activities.length === 0 && !error) {
    return (
      <View style={styles.stateContainer}>
        <Clock size={32} color="#94a3b8" />
        <Text style={styles.emptyTitle}>No activity recorded yet</Text>
        <Text style={styles.emptySubtitle}>
          Project and task actions will appear here in chronological order.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.timelineList}>
        {activities.map((item, index) => {
          const isLast = index === activities.length - 1;

          return (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.markerColumn}>
                <View style={styles.markerCircle}>
                  {getActivityIcon(item.action)}
                </View>
                {!isLast && <View style={styles.verticalLine} />}
              </View>

              <View style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <Text style={styles.summaryText}>{item.summary}</Text>
                  <Text style={styles.relativeTimeText}>
                    {formatRelativeTime(item.timestamp)}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.entityBadge,
                      item.entityType === 'TASK'
                        ? styles.badgeTask
                        : styles.badgeProject
                    ]}
                  >
                    <Text
                      style={[
                        styles.entityBadgeText,
                        item.entityType === 'TASK'
                          ? styles.badgeTaskText
                          : styles.badgeProjectText
                      ]}
                    >
                      {item.entityType}
                    </Text>
                  </View>
                  <Text style={styles.fullTimestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {page < totalPages && (
        <TouchableOpacity
          style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
          onPress={handleLoadMore}
          disabled={loadingMore || isOffline}
        >
          {loadingMore ? (
            <View style={styles.loadMoreContent}>
              <RefreshCw size={14} color="#1a3626" />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : (
            <Text style={styles.loadMoreText}>Load More Activity</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10
  },
  stateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center'
  },
  timelineList: {
    paddingHorizontal: 4
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12
  },
  markerColumn: {
    width: 32,
    alignItems: 'center'
  },
  markerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 2,
    marginBottom: -6
  },
  contentCard: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18
  },
  relativeTimeText: {
    fontSize: 11,
    color: '#64748b'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  entityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeTask: {
    backgroundColor: '#e0e7ff'
  },
  badgeProject: {
    backgroundColor: '#f3e8ff'
  },
  entityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  badgeTaskText: {
    color: '#4338ca'
  },
  badgeProjectText: {
    color: '#7e22ce'
  },
  fullTimestamp: {
    fontSize: 10,
    color: '#94a3b8'
  },
  loadMoreBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 12
  },
  loadMoreBtnDisabled: {
    opacity: 0.6
  },
  loadMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3626'
  }
});
