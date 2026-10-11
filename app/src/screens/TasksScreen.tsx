import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl } from 'react-native';
import api from '../services/api';
import type { Task, Project } from '@planora/shared';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export const TasksScreen = ({ navigation }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    fetchTasksAndProjects();
  }, [search, statusFilter, priorityFilter, page, sortBy]);

  const fetchTasksAndProjects = async () => {
    try {
      let tasksUrl = `/tasks?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=desc`;
      if (search) tasksUrl += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) tasksUrl += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) tasksUrl += `&priority=${encodeURIComponent(priorityFilter)}`;

      const [tasksRes, projectsRes] = await Promise.all([
        api.get(tasksUrl),
        api.get('/projects?limit=100')
      ]);
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data.tasks);
        setTotalPages(tasksRes.data.data.pagination?.totalPages || 1);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data.projects);
        if (projectsRes.data.data.projects.length > 0 && !projectId) {
          setProjectId(projectsRes.data.data.projects[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasksAndProjects();
  }, [search, statusFilter, priorityFilter, page, sortBy]);

  const handleCreateTask = async () => {
    if (!name || !projectId) {
      Alert.alert('Error', 'Please enter a name and select a project');
      return;
    }
    setCreating(true);
    try {
      const payload: any = { name, description, status, priority, projectId };
      if (dueDate) {
        payload.dueDate = dueDate.toISOString();
      }
      const res = await api.post('/tasks', payload);
      if (res.data.success) {
        setTasks([res.data.data.task, ...tasks]);
        setModalVisible(false);
        setName('');
        setDescription('');
        setStatus('PENDING');
        setPriority('MEDIUM');
        setDueDate(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete task');
          }
        }
      }
    ]);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      default: return '#64748b';
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

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <Text style={[styles.taskName, item.status === 'COMPLETED' && { textDecorationLine: 'line-through', color: '#95a5a6' }]}>{item.name}</Text>
      <Text style={{ fontSize: 12, color: '#999', marginBottom: 5 }}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
      {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
      
      <View style={styles.badgeContainer}>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.badgeText}>{item.priority}</Text>
        </View>
        {item.dueDate && (
          <View style={[styles.badge, { backgroundColor: '#64748b' }]}>
            <Text style={styles.badgeText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 15, gap: 10 }}>
        <TouchableOpacity style={styles.btnAction} onPress={() => toggleStatus(item)}>
          <Text style={styles.btnActionText}>{item.status === 'COMPLETED' ? 'Mark Pending' : 'Complete'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, styles.btnDelete]} onPress={() => deleteTask(item.id)}>
          <Text style={styles.btnActionTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', padding: 10, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' }}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
          placeholder="Search Tasks..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
          <TouchableOpacity onPress={() => { setStatusFilter(statusFilter ? '' : 'PENDING'); setPage(1); }} style={[styles.filterBadge, statusFilter === 'PENDING' && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>{statusFilter === 'PENDING' ? 'Pending' : 'Status'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPriorityFilter(priorityFilter ? '' : 'HIGH'); setPage(1); }} style={[styles.filterBadge, priorityFilter === 'HIGH' && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>{priorityFilter === 'HIGH' ? 'High' : 'Priority'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a3626" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks found.</Text>
          }
          ListFooterComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 20, gap: 15, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={[styles.btnAction, page === 1 && { opacity: 0.5 }]}>
                <Text style={{color:'#1a3626', fontWeight: 'bold'}}>Prev</Text>
              </TouchableOpacity>
              <Text>Page {page} of {totalPages}</Text>
              <TouchableOpacity onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} style={[styles.btnAction, (page === totalPages || totalPages === 0) && { opacity: 0.5 }]}>
                <Text style={{color:'#1a3626', fontWeight: 'bold'}}>Next</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            
            <ScrollView>
              <Text style={styles.label}>Project</Text>
              {projects.length > 0 ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={projectId}
                    onValueChange={(itemValue) => setProjectId(itemValue)}
                  >
                    {projects.map(p => (
                      <Picker.Item key={p.id} label={p.name} value={p.id} />
                    ))}
                  </Picker>
                </View>
              ) : (
                <Text style={styles.emptyText}>No projects available.</Text>
              )}

              <Text style={styles.label}>Task Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
              
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline />
              
              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={status} onValueChange={setStatus}>
                  <Picker.Item label="Pending" value="PENDING" />
                  <Picker.Item label="In Progress" value="IN_PROGRESS" />
                  <Picker.Item label="Completed" value="COMPLETED" />
                </Picker>
              </View>

              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={priority} onValueChange={setPriority}>
                  <Picker.Item label="Low" value="LOW" />
                  <Picker.Item label="Medium" value="MEDIUM" />
                  <Picker.Item label="High" value="HIGH" />
                </Picker>
              </View>

              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: dueDate ? '#333' : '#999' }}>
                  {dueDate ? dueDate.toLocaleDateString() : 'Select Due Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="default"
                  onValueChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDueDate(selectedDate);
                  }}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateTask} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    padding: 15,
    paddingBottom: 80
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1a3626',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 24,
    marginTop: -2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a3626'
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f7f4ec',
    color: '#333'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f7f4ec',
    overflow: 'hidden',
    marginBottom: 5
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600'
  },
  createBtn: {
    backgroundColor: '#1a3626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600'
  },
  filterBadge: { padding: 6, backgroundColor: '#eee', borderRadius: 4, justifyContent: 'center' },
  filterBadgeActive: { backgroundColor: '#1a3626' },
  filterBadgeText: { fontSize: 12, color: '#1a3626' },
  btnAction: {
    backgroundColor: '#eee',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  btnDelete: {
    backgroundColor: '#ffebee',
  },
  btnActionText: {
    fontSize: 12,
    color: '#1a3626',
  },
  btnActionTextDelete: {
    fontSize: 12,
    color: '#e74c3c',
  }
});
