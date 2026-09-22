import { useLocalSearchParams } from 'expo-router'; import { Chat } from '@/components/chat'; export default function(){const{id}=useLocalSearchParams<{id:string}>();return <Chat id={id}/>}
