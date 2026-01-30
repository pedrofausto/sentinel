import { useState, useEffect, useCallback } from 'react';
import { organizationsApi, OrganizationFull, Organization, CreateOrganizationData } from '../services/api';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await organizationsApi.list(1, 100);
      setOrganizations(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const createOrganization = useCallback(async (data: CreateOrganizationData) => {
    const newOrg = await organizationsApi.create(data);
    setOrganizations(prev => [newOrg, ...prev]);
    return newOrg;
  }, []);

  const updateOrganization = useCallback(async (id: string, data: CreateOrganizationData) => {
    const updated = await organizationsApi.update(id, data);
    setOrganizations(prev => prev.map(org => org.id === id ? updated : org));
    return updated;
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    await organizationsApi.delete(id);
    setOrganizations(prev => prev.filter(org => org.id !== id));
  }, []);

  return {
    organizations,
    isLoading,
    error,
    refresh: fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}

export function useOrganizationFull(id: string | null) {
  const [organization, setOrganization] = useState<OrganizationFull | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!id) {
      setOrganization(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await organizationsApi.getFull(id);
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organization');
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    isLoading,
    error,
    refresh: fetchOrganization,
  };
}

export default useOrganizations;
