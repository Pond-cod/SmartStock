"use client"
import React, {
  createContext, useContext, useState, useCallback, ReactNode, useEffect
} from 'react';
import Cookies from 'js-cookie';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type ConnStatus = 'idle' | 'connected' | 'error';

type DataContextType = {
  categories: any[];
  equipments: any[];
  users: any[];
  superAdmins: any[];
  personnel: any[];
  departments: any[];
  transactions: any[];
  rolePermissions: any[];
  systemLogs: any[];
  settings: any;
  actionRequests: any[];
  isLoading: boolean;
  error: string | null;
  connStatus: ConnStatus;
  lastConnectedAt: Date | null;
  refreshData: () => Promise<void>;
  hasPermission: (role: string, module: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'approve') => boolean;
  createRecord: (sheet: string, data: any) => Promise<{ success: boolean; error?: string; isRequest?: boolean; message?: string }>;
  updateRecord: (sheet: string, data: any) => Promise<{ success: boolean; error?: string; isRequest?: boolean; message?: string }>;
  deleteRecord: (sheet: string, idData: any) => Promise<{ success: boolean; error?: string; isRequest?: boolean; message?: string }>;
  issueAsset: (data: { EquipmentCode: string; Quantity: number; ReceiverName: string; IssuerName: string; ReturnDate?: string }, isAdmin?: boolean) => Promise<boolean>;
  approveTransaction: (transactionId: string) => Promise<boolean>;
  rejectTransaction: (transactionId: string) => Promise<boolean>;
  returnAsset: (transactionId: string) => Promise<boolean>;
  approveActionRequest: (requestId: string) => Promise<boolean>;
  rejectActionRequest: (requestId: string) => Promise<boolean>;
  uploadImage: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(!!Cookies.get('auth_token'));

  // Check auth status on mount and listen for login events
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();

    const onLogin = () => setIsAuthenticated(true);
    window.addEventListener('auth:login', onLogin);
    return () => window.removeEventListener('auth:login', onLogin);
  }, []);

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
    enabled: isAuthenticated, // Only fetch when user is logged in
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    placeholderData: () => {
      try {
        const cached = localStorage.getItem('offline_inventory_cache');
        if (cached) return JSON.parse(cached);
      } catch (e) { return undefined; }
    }
  });

  const categories = React.useMemo(() => Array.isArray(allData?.Categories) ? allData.Categories : [], [allData]);
  const equipments = React.useMemo(() => Array.isArray(allData?.Equipments) ? allData.Equipments : [], [allData]);
  const users = React.useMemo(() => Array.isArray(allData?.Users) ? allData.Users : [], [allData]);
  const superAdmins = React.useMemo(() => Array.isArray(allData?.['super Admin']) ? allData['super Admin'] : [], [allData]);
  const personnel = React.useMemo(() => Array.isArray(allData?.Personnel) ? allData.Personnel : [], [allData]);
  const departments = React.useMemo(() => Array.isArray(allData?.Departments) ? allData.Departments : [], [allData]);
  const transactions = React.useMemo(() => Array.isArray(allData?.Transactions) ? allData.Transactions : [], [allData]);
  const actionRequests = React.useMemo(() => Array.isArray(allData?.ActionRequests) ? allData.ActionRequests : [], [allData]);
  const rolePermissions = React.useMemo(() => Array.isArray(allData?.RolePermissions) ? allData.RolePermissions : [], [allData]);
  const systemLogs = React.useMemo(() => Array.isArray(allData?.SystemLogs) ? allData.SystemLogs : [], [allData]);
  const settings = React.useMemo(() => {
    return Array.isArray(allData?.Settings) && allData.Settings.length > 0 
      ? { ...DEFAULT_SETTINGS, ...allData.Settings[0] } 
      : DEFAULT_SETTINGS;
  }, [allData]);

  const hasPermission = useCallback((role: string, module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    if (role === 'Admin' || role === 'super Admin') return true; // Hardcoded full access for admins
    const permission = rolePermissions.find((p: any) => p.RoleName === role);
    if (!permission) return false;
    
    // Check if permission is stored as comma-separated actions like "view,create"
    const allowedActions = (permission[module] || '').toLowerCase().split(',').map((a: string) => a.trim());
    return allowedActions.includes(action);
  }, [rolePermissions]);

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

  const mutate = useCallback(async (action: string, sheet: string, data: any): Promise<{ success: boolean; error?: string; isRequest?: boolean; message?: string }> => {
    try {
      const res = await mutation.mutateAsync({ action, sheet, data });
      return { success: true, isRequest: res.isRequest, message: res.message };
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
  }, [mutate]);

  const approveTransaction = useCallback(async (txId: string) => {
    const tx = transactions.find((t: any) => t.TransactionID === txId);
    if (!tx || tx.Status !== 'Pending-Approve') return false;

    const res = await mutate('APPROVE_ISSUE', 'Transactions', { TransactionID: txId });
    return res.success;
  }, [mutate, transactions]);

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
  }, [mutate, transactions]);

  const approveActionRequest = useCallback(async (requestId: string) => {
    const res = await mutate('EXECUTE_REQUEST', 'ActionRequests', { RequestID: requestId });
    return res.success;
  }, [mutate]);

  const rejectActionRequest = useCallback(async (requestId: string) => {
    const res = await mutate('REJECT_REQUEST', 'ActionRequests', { RequestID: requestId });
    return res.success;
  }, [mutate]);

  const uploadImage = useCallback(async (file: File) => {
    return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64,
              mimeType: file.type,
              fileName: file.name
            })
          });
          
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `HTTP ${res.status}`);
          }
          
          const result = await res.json();
          resolve({ success: true, url: result.url });
        } catch (err: any) {
          console.error("Upload Error:", err);
          resolve({ success: false, error: err.message });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
    });
  }, []);

  const refreshData = async () => {
    await refetch();
  };

  return (
    <DataContext.Provider value={{
      categories, equipments, users, superAdmins, personnel, departments, transactions, rolePermissions, systemLogs, settings,
      isLoading: isLoading && !allData, // Show loading only if we have no offline placeholder
      error: queryError ? queryError.message : null,
      connStatus: queryError ? 'error' : connStatus,
      lastConnectedAt,
      refreshData,
      hasPermission,
      createRecord: async (sheet: string, data: any) => {
        return await mutate('ADD', sheet, data);
      },
      updateRecord: async (sheet: string, data: any) => {
        return await mutate('EDIT', sheet, data);
      },
      deleteRecord: async (sheet: string, idData: any) => {
        return await mutate('DELETE', sheet, idData);
      },
      issueAsset,
      approveTransaction,
      rejectTransaction,
      returnAsset,
      actionRequests,
      approveActionRequest,
      rejectActionRequest,
      uploadImage
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
