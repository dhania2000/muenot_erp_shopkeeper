import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
const tab=(name:any,label:string,icon:any)=>({title:label,tabBarIcon:({color,focused}:any)=><Ionicons name={focused?icon:icon.replace('-','-outline')} size={21} color={color}/>});
export default function TabsLayout(){return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,tabBarStyle:{height:64,paddingTop:6},tabBarLabelStyle:{fontSize:11,fontWeight:'700'}}}><Tabs.Screen name="home" options={tab('home','Home','home')}/><Tabs.Screen name="inbox" options={tab('inbox','Inbox','chatbubbles')}/><Tabs.Screen name="orders" options={tab('orders','Orders','bag')}/><Tabs.Screen name="customers" options={tab('customers','Customers','people')}/><Tabs.Screen name="more" options={tab('more','More','menu')}/></Tabs>}
