'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare, Plus, Send, Copy, CheckCircle2, Loader2,
  BookOpen, X, Trash2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string
  titre: string
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// ─── Suggestions rapides ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Quel compte pour une facture fournisseur de fournitures ?',
  'Comment comptabiliser un apport en capital ?',
  'Taux de TVA sur les services informatiques ?',
  'Écriture provision pour congés payés ?',
  'Compte à utiliser pour un remboursement de frais kilométriques ?',
  'Différence entre 6061 et 6064 ?',
]

// ─── Plan gate ────────────────────────────────────────────────────────────────

function EssentielBanner() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">Assistant PCG & BOFIP</h2>
      <p className="text-sm text-navy-500 max-w-sm mb-6">
        Posez vos questions à un expert-comptable IA spécialisé en comptabilité française.
        Disponible dès le plan <strong>Essentiel</strong>.
      </p>
      <Link href="/pricing" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors">
        Voir les plans
      </Link>
    </div>
  )
}

// ─── Composant message ────────────────────────────────────────────────────────

function MessageBubble({ msg, onCopy }: { msg: { role: string; content: string }; onCopy: (text: string) => void }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
        isUser ? 'bg-emerald-500 text-white' : 'bg-purple-100 text-purple-700'
      }`}>
        {isUser ? 'V' : 'IA'}
      </div>
      <div className={`group max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-emerald-500 text-white rounded-tr-sm'
            : 'bg-white border border-navy-100 text-navy-800 rounded-tl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        {!isUser && (
          <button
            onClick={() => onCopy(msg.content)}
            className="mt-1 flex items-center gap-1 text-[11px] text-navy-400 hover:text-navy-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-3 h-3" /> Copier
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AssistantPage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const isEssentielPlus = plan !== 'basique'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [convLoading, setConvLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages, streamText])

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('conversations_assistant')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      setConversations((data ?? []) as Conversation[])
    } catch { /* silent */ }
    finally { setConvLoading(false) }
  }, [user?.id])

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('messages_assistant')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      setMessages((data ?? []) as Message[])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (user?.id && isEssentielPlus) void fetchConversations()
    else if (!planLoading) setConvLoading(false)
  }, [user?.id, isEssentielPlus, planLoading, fetchConversations])

  const handleNewConversation = async () => {
    if (!user?.id) return
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('conversations_assistant')
        .insert({ user_id: user.id, titre: 'Nouvelle conversation' })
        .select('*')
        .single()
      if (error) throw error
      const conv = data as Conversation
      setConversations(prev => [conv, ...prev])
      setCurrentConvId(conv.id)
      setMessages([])
    } catch { toast.error('Erreur') }
  }

  const handleSelectConversation = async (convId: string) => {
    setCurrentConvId(convId)
    setStreamText('')
    await fetchMessages(convId)
  }

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation ?')) return
    try {
      const supabase = createClient()
      await supabase.from('conversations_assistant').delete().eq('id', convId)
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (currentConvId === convId) {
        setCurrentConvId(null)
        setMessages([])
      }
    } catch { toast.error('Erreur') }
  }

  const handleSend = async (text?: string) => {
    const messageText = (text ?? inputText).trim()
    if (!messageText || isStreaming) return

    if (!currentConvId) {
      // Auto-create conversation
      if (!user?.id) return
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('conversations_assistant')
          .insert({
            user_id: user.id,
            titre: messageText.slice(0, 60),
          })
          .select('*')
          .single()
        if (error) throw error
        const conv = data as Conversation
        setConversations(prev => [conv, ...prev])
        setCurrentConvId(conv.id)
        await sendMessage(conv.id, messageText)
      } catch { toast.error('Erreur de création') }
      return
    }

    await sendMessage(currentConvId, messageText)
  }

  const sendMessage = async (convId: string, messageText: string) => {
    setInputText('')
    setIsStreaming(true)
    setStreamText('')

    // Optimistic user message
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: convId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId, message: messageText }),
      })

      if (!response.ok) {
        const err = await response.json() as { error?: string }
        throw new Error(err.error ?? 'Erreur API')
      }
      if (!response.body) throw new Error('Pas de stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setStreamText(prev => prev + text)
      }

      // Reload messages to get saved IDs
      await fetchMessages(convId)
      setStreamText('')
      void fetchConversations()

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de communication')
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text)
    toast.success('Copié !')
  }

  const currentConv = conversations.find(c => c.id === currentConvId)

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">

        {/* ── Sidebar conversations ─────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-navy-100 flex-shrink-0">
          <div className="p-4 border-b border-navy-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-navy-900">Assistant PCG & BOFIP</span>
            </div>
            <button
              onClick={() => void handleNewConversation()}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {convLoading ? (
              <div className="px-4 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-navy-50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-navy-400 text-center py-6 px-4">
                Aucune conversation — commencez par poser une question
              </p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => void handleSelectConversation(conv.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                    conv.id === currentConvId
                      ? 'bg-purple-50 text-purple-700'
                      : 'hover:bg-navy-50 text-navy-600'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <p className="text-[13px] flex-1 truncate">{conv.titre}</p>
                  <button
                    onClick={e => void handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Zone principale ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-navy-50/30">

          {planLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : !isEssentielPlus ? (
            <EssentielBanner />
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-3 bg-white border-b border-navy-100 flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h1 className="text-sm font-semibold text-navy-900">
                  {currentConv ? currentConv.titre : 'Assistant PCG & BOFIP'}
                </h1>
                {!currentConvId && (
                  <button
                    onClick={() => void handleNewConversation()}
                    className="md:hidden ml-auto flex items-center gap-1 text-xs text-purple-600 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nouvelle
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {!currentConvId ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-8">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-bold text-navy-900 mb-1">Expert PCG & BOFIP</h2>
                      <p className="text-sm text-navy-500">
                        Posez vos questions sur la comptabilité et la fiscalité françaises
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => void handleSend(s)}
                          className="text-xs bg-white border border-navy-200 text-navy-700 px-3 py-1.5 rounded-full hover:border-purple-300 hover:text-purple-700 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : messages.length === 0 && !isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <MessageSquare className="w-8 h-8 text-navy-300" />
                    <p className="text-sm text-navy-400">Commencez la conversation</p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                      {SUGGESTIONS.slice(0, 4).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => void handleSend(s)}
                          className="text-xs bg-white border border-navy-200 text-navy-700 px-3 py-1.5 rounded-full hover:border-purple-300 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />
                    ))}

                    {/* Streaming assistant message */}
                    {isStreaming && streamText && (
                      <MessageBubble
                        msg={{ role: 'assistant', content: streamText }}
                        onCopy={handleCopy}
                      />
                    )}

                    {/* Thinking indicator */}
                    {isStreaming && !streamText && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-purple-700">IA</div>
                        <div className="px-4 py-3 bg-white border border-navy-100 rounded-2xl rounded-tl-sm shadow-sm">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <span key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-4 bg-white border-t border-navy-100">
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question comptable… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
                    rows={2}
                    className="flex-1 resize-none px-4 py-3 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-navy-50/50"
                    disabled={isStreaming}
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!inputText.trim() || isStreaming}
                    className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isStreaming
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-center text-[11px] text-navy-400 mt-2">
                  Cet assistant cite les références PCG et BOFIP — vérifiez toujours avec un expert-comptable.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
