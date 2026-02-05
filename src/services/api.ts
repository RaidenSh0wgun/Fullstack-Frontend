import { useMutation } from '@tanstack/react-query';
import { useAxios } from 'axios-hooks';

const API_BASE_URL = 'http://localhost:8000/api/';

interface Item {
  id: number;
  name: string;
  description: string;
}

export const useGetItems = () => {
  const [{ data, loading, error }] = useAxios<Item[]>(`${API_BASE_URL}items/`);

  return {
    data: data || [],
    isLoading: loading,
    error: error ? new Error(error.message) : null,
  };
};

export const useCreateItem = () => {
  const [, executePost] = useAxios<Item>(
    {
      url: `${API_BASE_URL}items/`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { manual: true }
  );

  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await executePost({ data });
      return response.data;
    },
  });
};