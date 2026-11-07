import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Platform, StyleSheet } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import TagsScreen from '../screens/TagsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <SafeAreaWrapper style={styles.tabSafeArea}>
            <Tab.Navigator
                initialRouteName="Dashboard"
                screenOptions={({ route }) => ({
                    headerShown: false,

                    tabBarStyle: {
                        backgroundColor: Colors.backgroundSecondary,
                        borderTopColor: Colors.border,
                        borderTopWidth: 1,
                        height: Platform.OS === 'ios' ? 85 : 60,
                        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                        paddingTop: 10,
                    },

                    tabBarActiveTintColor: Colors.primary,
                    tabBarInactiveTintColor: Colors.textSecondary,

                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Dashboard') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Calendario') {
                            iconName = focused ? 'calendar' : 'calendar-outline';
                        } else if (route.name === 'Etiquetas') {
                            iconName = focused ? 'pricetags' : 'pricetags-outline';
                        } else if (route.name === 'Perfil') {
                            iconName = focused ? 'person' : 'person-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Dashboard" component={DashboardScreen} />
                <Tab.Screen name="Calendario" component={CalendarScreen} />
                <Tab.Screen name="Etiquetas" component={TagsScreen} />
                <Tab.Screen name="Perfil" component={ProfileScreen} />
            </Tab.Navigator>
        </SafeAreaWrapper>
    );
}

const styles = StyleSheet.create({
    tabSafeArea: {
        backgroundColor: Colors.backgroundSecondary,
    },
});