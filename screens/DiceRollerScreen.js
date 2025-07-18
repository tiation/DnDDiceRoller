import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DiceRollerScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [diceLines, setDiceLines] = useState([]);
  const [rollHistory, setRollHistory] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadUserData();
    addInitialDiceLine();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const addInitialDiceLine = () => {
    const newLine = {
      id: Date.now(),
      label: 'Roll 1',
      diceCount: 1,
      diceType: 20,
      modifier: 0,
      result: null,
    };
    setDiceLines([newLine]);
  };

  const addDiceLine = () => {
    const newLine = {
      id: Date.now(),
      label: `Roll ${diceLines.length + 1}`,
      diceCount: 1,
      diceType: 20,
      modifier: 0,
      result: null,
    };
    setDiceLines([...diceLines, newLine]);
  };

  const removeDiceLine = (id) => {
    setDiceLines(diceLines.filter(line => line.id !== id));
  };

  const updateDiceLine = (id, field, value) => {
    setDiceLines(diceLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const rollDice = (sides) => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const rollDiceLine = (line) => {
    const rolls = [];
    for (let i = 0; i < line.diceCount; i++) {
      rolls.push(rollDice(line.diceType));
    }
    
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + line.modifier;
    const result = {
      rolls,
      total,
      modifier: line.modifier,
      timestamp: new Date().toLocaleTimeString(),
    };

    updateDiceLine(line.id, 'result', result);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      label: line.label,
      dice: `${line.diceCount}d${line.diceType}${line.modifier !== 0 ? (line.modifier > 0 ? '+' : '') + line.modifier : ''}`,
      result: result,
    };
    setRollHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 rolls
  };

  const rollAllDice = () => {
    diceLines.forEach(line => rollDiceLine(line));
  };

  const clearHistory = () => {
    setRollHistory([]);
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await AsyncStorage.removeItem('isLoggedIn');
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const renderDiceLine = ({ item }) => (
    <View style={styles.diceLineContainer}>
      <View style={styles.diceLineHeader}>
        <TextInput
          style={styles.labelInput}
          value={item.label}
          onChangeText={(text) => updateDiceLine(item.id, 'label', text)}
          placeholder="Roll label"
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeDiceLine(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.diceControls}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Count</Text>
          <TextInput
            style={styles.controlInput}
            value={item.diceCount.toString()}
            onChangeText={(text) => updateDiceLine(item.id, 'diceCount', parseInt(text) || 1)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Type</Text>
          <View style={styles.diceTypeContainer}>
            {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
              <TouchableOpacity
                key={sides}
                style={[
                  styles.diceTypeButton,
                  item.diceType === sides && styles.selectedDiceType
                ]}
                onPress={() => updateDiceLine(item.id, 'diceType', sides)}
              >
                <Text style={[
                  styles.diceTypeText,
                  item.diceType === sides && styles.selectedDiceTypeText
                ]}>
                  d{sides}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Modifier</Text>
          <TextInput
            style={styles.controlInput}
            value={item.modifier.toString()}
            onChangeText={(text) => updateDiceLine(item.id, 'modifier', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.rollButton}
        onPress={() => rollDiceLine(item)}
      >
        <LinearGradient
          colors={['#00ffff', '#ff00ff']}
          style={styles.rollButtonGradient}
        >
          <Text style={styles.rollButtonText}>ROLL</Text>
        </LinearGradient>
      </TouchableOpacity>

      {item.result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            Rolls: {item.result.rolls.join(', ')}
          </Text>
          <Text style={styles.totalText}>
            Total: {item.result.total}
          </Text>
        </View>
      )}
    </View>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyLabel}>{item.label}</Text>
      <Text style={styles.historyDice}>{item.dice}</Text>
      <Text style={styles.historyResult}>→ {item.result.total}</Text>
      <Text style={styles.historyTime}>{item.result.timestamp}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎲 DnD Dice Roller</Text>
            <Text style={styles.welcomeText}>Welcome, {username}!</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Dice Rolling Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dice Rolls</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.addButton} onPress={addDiceLine}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rollAllButton} onPress={rollAllDice}>
                  <Text style={styles.rollAllButtonText}>Roll All</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={diceLines}
              renderItem={renderDiceLine}
              keyExtractor={(item) => item.id.toString()}
              style={styles.diceList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* History Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Roll History</Text>
              <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={rollHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 5,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff6666',
  },
  logoutText: {
    color: '#ff6666',
    fontSize: 12,
  },
  section: {
    flex: 1,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ffff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#00ffff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rollAllButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  rollAllButtonText: {
    color: '#ff00ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  diceList: {
    maxHeight: 300,
  },
  diceLineContainer: {
    backgroundColor: 'rgba(20, 20, 40, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  diceLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  removeButton: {
    backgroundColor: '#ff6666',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  diceControls: {
    marginBottom: 10,
  },
  controlGroup: {
    marginBottom: 10,
  },
  controlLabel: {
    color: '#00ffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  controlInput: {
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    color: '#ffffff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
    fontSize: 16,
  },
  diceTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  diceTypeButton: {
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectedDiceType: {
    backgroundColor: '#00ffff',
    borderColor: '#00ffff',
  },
  diceTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedDiceTypeText: {
    color: '#000',
  },
  rollButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  rollButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  rollButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resultContainer: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  resultText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
  },
  totalText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff6666',
  },
  clearButtonText: {
    color: '#ff6666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    backgroundColor: 'rgba(20, 20, 40, 0.6)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#00ffff',
  },
  historyLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyDice: {
    color: '#cccccc',
    fontSize: 12,
  },
  historyResult: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyTime: {
    color: '#888',
    fontSize: 10,
    textAlign: 'right',
  },
});

export default DiceRollerScreen;
