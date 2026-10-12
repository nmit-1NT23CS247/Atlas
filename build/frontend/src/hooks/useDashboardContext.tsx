import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, UserRole } from '../types/index.ts';
import { getProducts } from '../services/products.ts';
import { formatTime } from '../utils/formatters.ts';

interface DashboardContextType {
  // Product
  products: Product[];
  currentProduct: Product | null;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  isLoadingProducts: boolean;

  // Demo Role
  // NOTE: In production, user roles and permission policies are authenticated
  // and authoritatively enforced by the backend API. This client-side role
  // switcher simulates UI state gates and action button availability for demo testing.
  role: UserRole;
  setRole: (role: UserRole) => void;
  canTriggerBuild: boolean;
  canPromoteStable: boolean;
  canCreateRelease: boolean;
  getRolePermissionReason: (action: 'build' | 'promote' | 'release') => string | null;

  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Refresh
  lastRefreshed: string;
  refreshTick: number;
  triggerRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('esm');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('Release Engineer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>(formatTime(new Date()));
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const triggerRefresh = useCallback(() => {
    setLastRefreshed(formatTime(new Date()));
    setRefreshTick((prev) => prev + 1);
  }, []);

  // Load products on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoadingProducts(true);
        const data = await getProducts();
        if (isMounted) {
          setProducts(data);
          if (data.length > 0 && !data.some((p) => p.id === selectedProductId)) {
            setSelectedProductId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-refresh every 15s for running pipelines
  useEffect(() => {
    const timer = setInterval(() => {
      triggerRefresh();
    }, 15000);
    return () => clearInterval(timer);
  }, [triggerRefresh]);

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;

  // Role permissions:
  // Developer: Can trigger Build
  // QA: Can trigger Build, Promote Stable
  // Release Engineer: Can trigger Build, Promote Stable, Create Release
  const canTriggerBuild = true; // All roles can trigger builds
  const canPromoteStable = role === 'QA' || role === 'Release Engineer';
  const canCreateRelease = role === 'Release Engineer';

  const getRolePermissionReason = (action: 'build' | 'promote' | 'release'): string | null => {
    if (action === 'promote' && !canPromoteStable) {
      return `Promotion requires QA or Release Engineer role (current demo role: ${role})`;
    }
    if (action === 'release' && !canCreateRelease) {
      return `Release creation requires Release Engineer role (current demo role: ${role})`;
    }
    return null;
  };

  return (
    <DashboardContext.Provider
      value={{
        products,
        currentProduct,
        selectedProductId,
        setSelectedProductId,
        isLoadingProducts,
        role,
        setRole,
        canTriggerBuild,
        canPromoteStable,
        canCreateRelease,
        getRolePermissionReason,
        searchQuery,
        setSearchQuery,
        lastRefreshed,
        refreshTick,
        triggerRefresh,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
