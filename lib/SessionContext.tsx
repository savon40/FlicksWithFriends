import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SessionFilters } from '@/types';

interface SessionState {
  sessionCode: string | null;
  sessionId: string | null;
  participantId: string | null;
  matchThreshold: number;
  isHost: boolean;
  nickname: string;
  selectedServices: string[];
  filters: SessionFilters;
  currentCardIndex: number;
}

interface SessionContextType extends SessionState {
  setSessionCode: (code: string | null) => void;
  setSessionId: (id: string | null) => void;
  setParticipantId: (id: string | null) => void;
  setMatchThreshold: (threshold: number) => void;
  setIsHost: (isHost: boolean) => void;
  setNickname: (name: string) => void;
  setSelectedServices: (services: string[]) => void;
  toggleService: (serviceId: string) => void;
  setFilters: (filters: SessionFilters) => void;
  updateFilter: <K extends keyof SessionFilters>(key: K, value: SessionFilters[K]) => void;
  setCurrentCardIndex: (index: number) => void;
  resetSession: () => void;
}

const defaultFilters: SessionFilters = {
  genres: [],
  mood: null,
  runtimeRange: 'any',
  releaseYearRange: 'any',
  minRating: null,
  contentType: 'movies',
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    sessionCode: null,
    sessionId: null,
    participantId: null,
    matchThreshold: 0.5,
    isHost: false,
    nickname: '',
    selectedServices: [],
    filters: { ...defaultFilters },
    currentCardIndex: 0,
  });

  const setSessionCode = (code: string | null) =>
    setState((s) => ({ ...s, sessionCode: code }));

  const setSessionId = (id: string | null) =>
    setState((s) => ({ ...s, sessionId: id }));

  const setParticipantId = (id: string | null) =>
    setState((s) => ({ ...s, participantId: id }));

  const setMatchThreshold = (threshold: number) =>
    setState((s) => ({ ...s, matchThreshold: threshold }));

  const setIsHost = (isHost: boolean) =>
    setState((s) => ({ ...s, isHost }));

  const setNickname = (name: string) =>
    setState((s) => ({ ...s, nickname: name }));

  const setSelectedServices = (services: string[]) =>
    setState((s) => ({ ...s, selectedServices: services }));

  const toggleService = (serviceId: string) =>
    setState((s) => ({
      ...s,
      selectedServices: s.selectedServices.includes(serviceId)
        ? s.selectedServices.filter((id) => id !== serviceId)
        : [...s.selectedServices, serviceId],
    }));

  const setFilters = (filters: SessionFilters) =>
    setState((s) => ({ ...s, filters }));

  const updateFilter = <K extends keyof SessionFilters>(key: K, value: SessionFilters[K]) =>
    setState((s) => ({ ...s, filters: { ...s.filters, [key]: value } }));

  const setCurrentCardIndex = (index: number) =>
    setState((s) => ({ ...s, currentCardIndex: index }));

  const resetSession = () =>
    setState({
      sessionCode: null,
      sessionId: null,
      participantId: null,
      matchThreshold: 0.5,
      isHost: false,
      nickname: '',
      selectedServices: [],
      filters: { ...defaultFilters },
      currentCardIndex: 0,
    });

  return (
    <SessionContext.Provider
      value={{
        ...state,
        setSessionCode,
        setSessionId,
        setParticipantId,
        setMatchThreshold,
        setIsHost,
        setNickname,
        setSelectedServices,
        toggleService,
        setFilters,
        updateFilter,
        setCurrentCardIndex,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
