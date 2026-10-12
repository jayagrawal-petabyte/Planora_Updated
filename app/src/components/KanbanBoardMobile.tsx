import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControlProps
} from 'react-native';
import { Calendar, AlertCircle, MoveRight, Edit3, Trash2 } from 'lucide-react-native';
import type { Task, TaskStatus } from '@planora/shared';

interface KanbanBoardMobileProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  isOffline?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

interface ColumnConfig {
  id: TaskStatus;
  label: string;
  color: string;
  bgLight: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'PENDING', label: 'Pending', color: '#f59e0b', bgLight: '#fef3c7' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', bgLight: '#dbeafe' },
  { id: 'COMPLETED', label: 'Completed', color: '#10b981', bgLight: '#d1fae5' }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

export const KanbanBoardMobile: React.FC<KanbanBoardMobileProps> = ({
  tasks,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  isOffline = false,
  refreshControl
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const handleOpenMoveModal = (task: Task) => {
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'Status changes cannot be saved while offline. Please connect to the internet to update tasks.'
      );
      return;
    }
    setSelectedTask(task);
    setMoveModalVisible(true);
  };

  const handleMoveStatus = async (targetStatus: TaskStatus) => {
    if (!selectedTask) return;
    if (selectedTask.status === targetStatus) {
      setMoveModalVisible(false);
      return;
    }

    if (isOffline) {
      setMoveModalVisible(false);
      Alert.alert(
        'Offline Mode',
        'Status changes cannot be saved while offline. Please connect to the internet to update tasks.'
      );
      return;
    }

    const taskId = selectedTask.id;
    setMoveModalVisible(false);
    setUpdatingTaskId(taskId);

    try {
      const success = await onUpdateTaskStatus(taskId, targetStatus);
      if (!success) {
        Alert.alert('Update Failed', 'Could not update task status. Please try again.');
      }
    } catch {
      Alert.alert('Update Failed', 'Network or server error while updating status.');
    } finally {
      setUpdatingTaskId(null);
      setSelectedTask(null);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderTaskCard = (task: Task) => {
    const overdue = isOverdue(task);
    const isUpdating = updatingTaskId === task.id;

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.card,
          overdue && styles.cardOverdue,
          isUpdating && styles.cardUpdating
        ]}
        activeOpacity={0.85}
        onLongPress={() => handleOpenMoveModal(task)}
        disabled={isUpdating}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
          {overdue && (
            <View style={styles.overdueBadge}>
              <AlertCircle size={12} color="#dc2626" />
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
          {isUpdating && <ActivityIndicator size="small" color="#1a3626" />}
        </View>

        <Text style={[styles.taskTitle, task.status === 'COMPLETED' && styles.completedTitle]}>
          {task.name}
        </Text>

        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        {task.dueDate && (
          <View style={styles.dateRow}>
            <Calendar size={13} color={overdue ? '#dc2626' : '#64748b'} />
            <Text style={[styles.dateText, overdue && styles.dateTextOverdue]}>
              {new Date(task.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleOpenMoveModal(task)}
            disabled={isUpdating}
          >
            <MoveRight size={13} color="#1a3626" />
            <Text style={styles.moveBtnText}>Move to...</Text>
          </TouchableOpacity>

          <View style={styles.cardActionsRight}>
            {onEditTask && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onEditTask(task)}
                disabled={isUpdating}
              >
                <Edit3 size={14} color="#475569" />
              </TouchableOpacity>
            )}
            {onDeleteTask && (
              <TouchableOpacity
                style={[styles.iconBtn, styles.deleteIconBtn]}
                onPress={() => onDeleteTask(task.id)}
                disabled={isUpdating}
              >
                <Trash2 size={14} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <AlertCircle size={14} color="#b45309" />
          <Text style={styles.offlineBannerText}>
            Offline Mode: Status changes are disabled until reconnected.
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columnsScrollContent}
        refreshControl={refreshControl}
      >
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);

          return (
            <View key={col.id} style={styles.columnContainer}>
              <View style={[styles.columnHeader, { borderLeftColor: col.color }]}>
                <View style={styles.columnTitleWrap}>
                  <Text style={styles.columnTitle}>{col.label}</Text>
                  <View style={[styles.countBadge, { backgroundColor: col.bgLight }]}>
                    <Text style={[styles.countText, { color: col.color }]}>
                      {columnTasks.length}
                    </Text>
                  </View>
                </View>
              </View>

              <FlatList
                data={columnTasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderTaskCard(item)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.columnListContent}
                ListEmptyComponent={
                  <View style={styles.emptyColumn}>
                    <Text style={styles.emptyColumnText}>
                      No {col.label.toLowerCase()} tasks
                    </Text>
                  </View>
                }
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Move Task Modal */}
      <Modal
        visible={moveModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMoveModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalHeaderTitle}>Change Task Status</Text>
            {selectedTask && (
              <Text style={styles.modalSubTitle} numberOfLines={1}>
                {selectedTask.name}
              </Text>
            )}

            <View style={styles.modalOptionsList}>
              {COLUMNS.map((col) => {
                const isCurrent = selectedTask?.status === col.id;

                return (
                  <TouchableOpacity
                    key={col.id}
                    style={[
                      styles.modalOptionBtn,
                      isCurrent && styles.modalOptionBtnActive
                    ]}
                    onPress={() => handleMoveStatus(col.id)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: col.color }]} />
                    <Text
                      style={[
                        styles.modalOptionText,
                        isCurrent && styles.modalOptionTextActive
                      ]}
                    >
                      {col.label} {isCurrent ? '(Current)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setMoveModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a'
  },
  offlineBannerText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
    flex: 1
  },
  columnsScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12
  },
  columnContainer: {
    width: COLUMN_WIDTH,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginBottom: 10
  },
  columnTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  countText: {
    fontSize: 12,
    fontWeight: '700'
  },
  columnListContent: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  cardOverdue: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffaf9'
  },
  cardUpdating: {
    opacity: 0.6
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  priorityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700'
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  overdueText: {
    fontSize: 10,
    color: '#b91c1c',
    fontWeight: '700'
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#94a3b8'
  },
  taskDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 16
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8
  },
  dateText: {
    fontSize: 11,
    color: '#64748b'
  },
  dateTextOverdue: {
    color: '#dc2626',
    fontWeight: '600'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  moveBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a3626'
  },
  cardActionsRight: {
    flexDirection: 'row',
    gap: 6
  },
  iconBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f8fafc'
  },
  deleteIconBtn: {
    backgroundColor: '#fee2e2'
  },
  emptyColumn: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyColumnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    elevation: 5
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16
  },
  modalOptionsList: {
    gap: 8,
    marginBottom: 16
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  modalOptionBtnActive: {
    borderColor: '#1a3626',
    backgroundColor: '#ecfdf5'
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155'
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: '#1a3626'
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  }
});
