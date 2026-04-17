"use client"
import React, {
  createContext, useContext, useState, useCallback, ReactNode, useEffect
} from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type ConnStatus = 'idle' | 'connected' | 'error';

type DataContextType = {
  categories: any[];
  equipments: any[];
  users: any[];
  personnel: any[];
  departments: any[];
  transactions: any[];
  settings: any;
  isLoading: boolean;
  error: string | null;
  connStatus: ConnStatus;
  lastConnectedAt: Date | null;
  refreshData: () => Promise<void>;
  createRecord: (sheet: string, data: any) => Promise<boolean>;
  updateRecord: (sheet: string, data: any) => Promise<boolean>;
  deleteRecord: (sheet: string, idData: any) => Promise<boolean>;
  issueAsset: (data: { EquipmentCode: string; Quantity: number; ReceiverName: string; IssuerName: string; ReturnDate?: string }, isAdmin?: boolean) => Promise<boolean>;
  approveTransaction: (transactionId: string) => Promise<boolean>;
  rejectTransaction: (transactionId: string) => Promise<boolean>;
  returnAsset: (transactionId: string) => Promise<boolean>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);
const DEFAULT_SETTINGS = { ThemeColor: '#1a3a5c', TextColor: 'dark', FontSize: 'medium' };

const queryClient = new QueryClient();

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderContent>{children}</DataProviderContent>
    </QueryClientProvider>
  );
}

function DataProviderContent({ children }: { children: ReactNode }) {
  const reactQueryClient = useQueryClient();
  const [connStatus, setConnStatus] = useState<ConnStatus>('idle');
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);

  const { data: allData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['spreadsheet-data'],
    queryFn: async () => {
      setConnStatus('idle');
      const res = await fetch('/api/spreadsheet?sheet=ALL');
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setConnStatus('connected');
      setLastConnectedAt(new Date());

      // Simple localStorage caching for offline resilience
      try {
        localStorage.setItem('offline_inventory_cache', JSON.stringify(data));
      } catch (e) {
        console.warn('Could not cache data offline', e);
      }
      return data;
    },
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
    placeholderData: () => {
      try {
        const cached = localStorage.getItem('offline_inventory_cache');
        if (cached) return JSON.parse(cached);
      } catch (e) { return undefined; }
    }
  });

  const categories = Array.isArray(allData?.Categories) ? allData.Categories : [];
  const equipments = Array.isArray(allData?.Equipments) ? allData.Equipments : [];
  const users = Array.isArray(allData?.Users) ? allData.Users : [];
  const personnel = Array.isArray(allData?.Personnel) ? allData.Personnel : [];
  const departments = Array.isArray(allData?.Departments) ? allData.Departments : [];
  const transactions = Array.isArray(allData?.Transactions) ? allData.Transactions : [];
  const settings = Array.isArray(allData?.Settings) && allData.Settings.length > 0 
    ? { ...DEFAULT_SETTINGS, ...allData.Settings[0] } 
    : DEFAULT_SETTINGS;

  const mutation = useMutation({
    mutationFn: async ({ action, sheet, data }: { action: string, sheet: string, data: any }) => {
      const resp = await fetch('/api/spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sheet, data }),
      });
      if (!resp.ok) throw new Error('Failed to mutate');
      const result = await resp.json();
      if (!result.success) throw new Error(result.error || 'Server rejected mutation');
      return result;
    },
    onSuccess: () => {
      reactQueryClient.invalidateQueries({ queryKey: ['spreadsheet-data'] });
    }
  });

  const mutate = useCallback(async (action: string, sheet: string, data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      await mutation.mutateAsync({ action, sheet, data });
      return { success: true };
    } catch (err: any) {
      console.error(`Mutation failed [${action} on ${sheet}]:`, err);
      return { success: false, error: err.message };
    }
  }, [mutation]);

  const issueAsset = useCallback(async (data: any, isAdmin = false) => {
    const status = isAdmin ? 'Active' : 'Pending-Approve';
    const transaction = {
      ...data,
      TransactionID: `TX-${Date.now()}`,
      Type: 'ISSUE',
      TransactionDate: new Date().toISOString(),
      Status: status
    };

    const res = await mutate(status === 'Active' ? 'ISSUE_DIRECT' : 'ADD', 'Transactions', transaction);
    return res.success;
  }, [mutate, equipments]);

  const approveTransaction = useCallback(async (txId: string) => {
    const tx = transactions.find((t: any) => t.TransactionID === txId);
    if (!tx || tx.Status !== 'Pending-Approve') return false;

    const res = await mutate('APPROVE_ISSUE', 'Transactions', { TransactionID: txId });
    return res.success;
  }, [mutate, transactions, equipments]);

  const rejectTransaction = useCallback(async (txId: string) => {
    const tx = transactions.find((t: any) => t.TransactionID === txId);
    if (!tx || tx.Status !== 'Pending-Approve') return false;
    const res = await mutate('DELETE', 'Transactions', { TransactionID: txId });
    return res.success;
  }, [mutate, transactions]);

  const returnAsset = useCallback(async (txId: string) => {
    const tx = transactions.find((t: any) => t.TransactionID === txId);
    if (!tx) return false;

    const res = await mutate('RETURN_ASSET', 'Transactions', { TransactionID: txId });
    return res.success;
  }, [mutate, transactions, equipments]);

  const refreshData = async () => {
    await refetch();
  };

  return (
    <DataContext.Provider value={{
      categories, equipments, users, personnel, departments, transactions, settings,
      isLoading: isLoading && !allData, // Show loading only if we have no offline placeholder
      error: queryError ? queryError.message : null,
      connStatus: queryError ? 'error' : connStatus,
      lastConnectedAt,
      refreshData,
      createRecord: async (sheet: string, data: any) => (await mutate('ADD',    sheet, data)).success,
      updateRecord: async (sheet: string, data: any) => (await mutate('EDIT',   sheet, data)).success,
      deleteRecord: async (sheet: string, idData: any) => (await mutate('DELETE', sheet, idData)).success,
      issueAsset,
      approveTransaction,
      rejectTransaction,
      returnAsset
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
