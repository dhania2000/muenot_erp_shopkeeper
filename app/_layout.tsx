import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();
export default function RootLayout(){useEffect(()=>{SplashScreen.hideAsync();},[]);return <><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}/></>}
