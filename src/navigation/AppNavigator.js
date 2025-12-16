import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';

import EntryDetailScreen from '../screens/EntryDetailScreen';

import TagDetailScreen from '../screens/TagDetailScreen'

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        <Stack.Screen name="MainTabs" component={MainTabNavigator}/>

        <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />

        <Stack.Screen name="TagDetail" component={TagDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}