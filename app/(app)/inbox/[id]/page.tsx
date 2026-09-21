import { notFound } from "next/navigation"
import { conversations } from "@/lib/mock-data"
import { ChatScreen } from "@/components/chat-screen"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const conversation = conversations.find((c) => c.id === id)
  if (!conversation) notFound()

  return <ChatScreen conversation={conversation} />
}
