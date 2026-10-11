import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

interface DashboardStats {
  totalProjects: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setError('');
        await SecureStore.setItemAsync('offline_dashboard', JSON.stringify(res.data.data.stats));
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Network error')) {
        try {
          const cached = await SecureStore.getItemAsync('offline_dashboard');
          if (cached) {
            setStats(JSON.parse(cached));
            setError('Offline mode: Showing cached stats.');
          } else {
            setError(err.message);
          }
        } catch (e) {
          setError(err.message || 'Failed to load dashboard statistics');
        }
      } else {
        setError(err.message || 'Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {!stats ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Projects</Text>
            <Text style={styles.statValue}>{stats.totalProjects}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>In Progress</Text>
            <Text style={styles.statValue}>{stats.projectsInProgress}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Tasks</Text>
            <Text style={styles.statValue}>{stats.totalTasks}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Completed</Text>
            <Text style={styles.statValue}>{stats.completedTasks}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Pending</Text>
            <Text style={styles.statValue}>{stats.pendingTasks}</Text>
          </View>
          <View style={[styles.statCard, { width: '100%', alignItems: 'center' }]}>
            <Text style={styles.statTitle}>Task Statistics</Text>
            {stats.totalTasks > 0 ? (
              <PieChart
                data={[
                  {
                    name: "Completed",
                    value: stats.completedTasks,
                    color: "#10b981",
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 12
                  },
                  {
                    name: "Pending",
                    value: stats.pendingTasks,
                    color: "#f59e0b",
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 12
                  },
                  {
                    name: "In Progress",
                    value: Math.max(0, stats.totalTasks - stats.completedTasks - stats.pendingTasks),
                    color: "#3b82f6",
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 12
                  }
                ].filter(d => d.value > 0)}
                width={Dimensions.get('window').width - 70}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"value"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                center={[0, 0]}
                absolute
              />
            ) : (
              <Text style={{ color: '#999', marginTop: 10 }}>No tasks to display.</Text>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.projectsBtn} 
        onPress={() => navigation.navigate('Projects')}
      >
        <Text style={styles.projectsBtnText}>View All Projects</Text>
      </TouchableOpacity>
    </ScrollView>
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
    padding: 20,
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#1a3626',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a3626',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  logoutBtn: {
    padding: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#1a3626',
    borderRadius: 5,
  },
  logoutText: {
    color: '#1a3626',
    fontWeight: 'bold',
  },
  statsGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#1a3626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#1a3626',
    marginBottom: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a3626',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  error: {
    color: 'red',
    padding: 20,
    textAlign: 'center',
  },
  loading: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
  },
  projectsBtn: {
    backgroundColor: '#1a3626',
    margin: 15,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  projectsBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'serif',
    fontStyle: 'italic',
  }
});
