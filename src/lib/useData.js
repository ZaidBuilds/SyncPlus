import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from './dataClient';

// Generic React Query Hooks for deployment-ready architecture

export function useEntityList(entityName, sortField = '-created_date', limit = 200, queryOptions = {}) {
  return useQuery({
    queryKey: [entityName, 'list', sortField, limit],
    queryFn: async () => {
      // Simulate network latency for realism
      await new Promise(resolve => setTimeout(resolve, 300));
      return await dataClient.entities[entityName].list(sortField, limit);
    },
    ...queryOptions,
  });
}

export function useEntityFilter(entityName, filters, sortField = '-created_date', limit = 200, queryOptions = {}) {
  return useQuery({
    queryKey: [entityName, 'filter', filters, sortField, limit],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return await dataClient.entities[entityName].filter(filters, sortField, limit);
    },
    ...queryOptions,
  });
}

export function useEntityCreate(entityName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return await dataClient.entities[entityName].create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });
}

export function useEntityUpdate(entityName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return await dataClient.entities[entityName].update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });
}

export function useEntityDelete(entityName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return await dataClient.entities[entityName].delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });
}
