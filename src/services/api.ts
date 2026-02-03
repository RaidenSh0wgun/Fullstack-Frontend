import { useQuery, useMutation } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:8000 /api/';

interface Item {
  id: number;
  name: string;
  description: string;
}

export const useGetItems = () => {
  return useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}items/`);
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
  });
};

export const useCreateItem = () => {
  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch(`${API_BASE_URL}items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
  });
};