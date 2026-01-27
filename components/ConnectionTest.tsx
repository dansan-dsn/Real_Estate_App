import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { api } from '@/services/api';

export default function ConnectionTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const connected = await api.testConnection();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Status:</Text>
        <Text
          style={[
            styles.status,
            {
              color:
                isConnected === true
                  ? '#4CAF50'
                  : isConnected === false
                    ? '#F44336'
                    : '#FF9800',
            },
          ]}
        >
          {isConnected === true
            ? 'Connected'
            : isConnected === false
              ? 'Failed'
              : 'Testing...'}
        </Text>
      </View>

      <Text style={styles.url}>API URL: {api.getBaseUrl()}</Text>

      <Button mode="outlined" onPress={testConnection} disabled={testing}>
        {testing ? 'Testing...' : 'Test Again'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginRight: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  url: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
});
