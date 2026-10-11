import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Project } from '@planora/shared';

export const ProjectsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('NOT_STARTED');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('NOT_STARTED');
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);

  const fetchProjects = async () => {
    try {
      let url = `/projects?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setProjects(res.data.data.projects);
        setTotalPages(res.data.data.pagination.totalPages || 1);
        setError('');
        
        if (page === 1 && !search && !statusFilter) {
          await SecureStore.setItemAsync('offline_projects', JSON.stringify(res.data.data.projects));
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Network error')) {
        try {
          const cached = await SecureStore.getItemAsync('offline_projects');
          if (cached) {
            setProjects(JSON.parse(cached));
            setError('Offline mode: Showing cached projects.');
            setTotalPages(1);
          } else {
            setError(err.message);
          }
        } catch (e) {
          setError(err.message || 'Failed to load projects');
        }
      } else {
        setError(err.message || 'Failed to load projects');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    setCreating(true);
    try {
      const payload: any = { name, description, status };
      if (startDate) payload.startDate = startDate.toISOString();
      if (endDate) payload.endDate = endDate.toISOString();

      const res = await api.post('/projects', payload);
      if (res.data.success) {
        setProjects([res.data.data.project, ...projects]);
        setName('');
        setDescription('');
        setStatus('NOT_STARTED');
        setStartDate(null);
        setEndDate(null);
        setShowCreate(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditStatus(project.status || 'NOT_STARTED');
    setEditStartDate(project.startDate ? new Date(project.startDate) : null);
    setEditEndDate(project.endDate ? new Date(project.endDate) : null);
  };

  const handleEditSubmit = async (id: string) => {
    try {
      const payload: any = { name: editName, description: editDescription, status: editStatus };
      if (editStartDate) payload.startDate = editStartDate.toISOString();
      if (editEndDate) payload.endDate = editEndDate.toISOString();
      
      const res = await api.put(`/projects/${id}`, payload);
      if (res.data.success) {
        setProjects(projects.map(p => p.id === id ? res.data.data.project : p));
        setEditingId(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update project');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter(p => p.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete project');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Project }) => {
    if (editingId === item.id) {
      return (
        <View style={styles.card}>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Project Name" />
          <TextInput style={styles.input} value={editDescription} onChangeText={setEditDescription} placeholder="Description" />
          <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 10, backgroundColor: '#f7f4ec' }}>
            <Picker selectedValue={editStatus} onValueChange={setEditStatus}>
              <Picker.Item label="Not Started" value="NOT_STARTED" />
              <Picker.Item label="In Progress" value="IN_PROGRESS" />
              <Picker.Item label="Completed" value="COMPLETED" />
            </Picker>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <TouchableOpacity style={[styles.input, { flex: 1, marginBottom: 0 }]} onPress={() => setShowEditStartPicker(true)}>
              <Text style={{ color: editStartDate ? '#333' : '#999' }}>{editStartDate ? editStartDate.toLocaleDateString() : 'Start Date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, { flex: 1, marginBottom: 0 }]} onPress={() => setShowEditEndPicker(true)}>
              <Text style={{ color: editEndDate ? '#333' : '#999' }}>{editEndDate ? editEndDate.toLocaleDateString() : 'End Date'}</Text>
            </TouchableOpacity>
          </View>
          {showEditStartPicker && (
            <DateTimePicker
              value={editStartDate || new Date()}
              mode="date"
              display="default"
              onValueChange={(event, selectedDate) => {
                setShowEditStartPicker(false);
                if (selectedDate) setEditStartDate(selectedDate);
              }}
              onDismiss={() => setShowEditStartPicker(false)}
            />
          )}
          {showEditEndPicker && (
            <DateTimePicker
              value={editEndDate || new Date()}
              mode="date"
              display="default"
              onValueChange={(event, selectedDate) => {
                setShowEditEndPicker(false);
                if (selectedDate) setEditEndDate(selectedDate);
              }}
              onDismiss={() => setShowEditEndPicker(false)}
            />
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => handleEditSubmit(item.id)}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditingId(null)}>
              <Text style={styles.btnTextSecondary}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProjectDetails', { id: item.id, name: item.name })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            <TouchableOpacity style={styles.btnAction} onPress={() => startEdit(item)}>
              <Text style={styles.btnActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, styles.btnDelete]} onPress={() => handleDelete(item.id)}>
              <Text style={styles.btnActionTextDelete}>Delete</Text>
            </TouchableOpacity>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
        
        {(item.startDate || item.endDate) && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
            {item.startDate && (
              <View style={[styles.badge, { backgroundColor: '#64748b' }]}>
                <Text style={styles.badgeText}>Start: {new Date(item.startDate).toLocaleDateString()}</Text>
              </View>
            )}
            {item.endDate && (
              <View style={[styles.badge, { backgroundColor: '#64748b' }]}>
                <Text style={styles.badgeText}>End: {new Date(item.endDate).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        )}
        
        <Text style={{ fontSize: 12, color: '#999', marginTop: 5 }}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.addBtnText}>{showCreate ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', padding: 10, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' }}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
          <TouchableOpacity onPress={() => { setStatusFilter(''); setPage(1); }} style={[styles.filterBadge, statusFilter === '' && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStatusFilter('NOT_STARTED'); setPage(1); }} style={[styles.filterBadge, statusFilter === 'NOT_STARTED' && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>Not Started</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStatusFilter('IN_PROGRESS'); setPage(1); }} style={[styles.filterBadge, statusFilter === 'IN_PROGRESS' && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStatusFilter('COMPLETED'); setPage(1); }} style={[styles.filterBadge, statusFilter === 'COMPLETED' && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>Completed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => { setSortBy(sortBy === 'createdAt' ? 'name' : 'createdAt'); setPage(1); }} style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>Sort: {sortBy === 'createdAt' ? 'Date' : 'Name'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); setPage(1); }} style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.input}
            placeholder="Project Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <TouchableOpacity style={[styles.input, { flex: 1, marginBottom: 0 }]} onPress={() => setShowStartPicker(true)}>
              <Text style={{ color: startDate ? '#333' : '#999' }}>{startDate ? startDate.toLocaleDateString() : 'Start Date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, { flex: 1, marginBottom: 0 }]} onPress={() => setShowEndPicker(true)}>
              <Text style={{ color: endDate ? '#333' : '#999' }}>{endDate ? endDate.toLocaleDateString() : 'End Date'}</Text>
            </TouchableOpacity>
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              onValueChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
              onDismiss={() => setShowStartPicker(false)}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onValueChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
              onDismiss={() => setShowEndPicker(false)}
            />
          )}
          <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 10, backgroundColor: '#f7f4ec' }}>
            <Picker selectedValue={status} onValueChange={setStatus}>
              <Picker.Item label="Not Started" value="NOT_STARTED" />
              <Picker.Item label="In Progress" value="IN_PROGRESS" />
              <Picker.Item label="Completed" value="COMPLETED" />
            </Picker>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={creating}>
            {creating ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Create Project</Text>}
          </TouchableOpacity>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color="#1a3626" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>No projects found.</Text>}
          ListFooterComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 20, gap: 15, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={[styles.btnAction, page === 1 && { opacity: 0.5 }]}>
                <Text style={{color:'white'}}>Prev</Text>
              </TouchableOpacity>
              <Text>Page {page} of {totalPages}</Text>
              <TouchableOpacity onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} style={[styles.btnAction, (page === totalPages || totalPages === 0) && { opacity: 0.5 }]}>
                <Text style={{color:'white'}}>Next</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ec',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3626',
  },
  addBtn: {
    backgroundColor: '#1a3626',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterBadge: {
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    justifyContent: 'center'
  },
  filterBadgeActive: {
    backgroundColor: '#1a3626',
  },
  filterBadgeText: {
    fontSize: 12,
  },
  createForm: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: '#1a3626', padding: 10, borderRadius: 4, flex: 1, marginRight: 5, alignItems: 'center'
  },
  btnSecondary: {
    backgroundColor: '#eee', padding: 10, borderRadius: 4, flex: 1, marginLeft: 5, alignItems: 'center'
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextSecondary: { color: '#1a3626', fontWeight: 'bold' },
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
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  badge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#1a3626',
  },
  cardDescription: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  error: {
    color: 'red',
    padding: 20,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 14,
  }
});
