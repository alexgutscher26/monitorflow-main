/**
 * Client-side API wrapper for making requests to the server
 * This avoids importing server-only code in client components
 */

import superjson from 'superjson';

// Helper function to parse superjson response
const parseSuperjsonResponse = async (response: Response) => {
  const text = await response.text();
  
  try {
    // First try to parse as regular JSON
    const data = JSON.parse(text);
    
    console.log('API Response data:', data);
    
    // If the response is in superjson format, it will have a json property
    if (data && typeof data === 'object' && 'json' in data) {
      try {
        // Parse the superjson format using the library
        const parsed = superjson.parse(data.json);
        console.log('Parsed superjson data:', parsed);
        return parsed;
      } catch (e) {
        console.error('Failed to parse superjson response:', e);
        return data; // Return the original data if parsing fails
      }
    }
    return data;
  } catch (e) {
    console.error('Failed to parse JSON response:', e, 'Raw text:', text);
    return null;
  }
};

// Category API
const categoryApi = {
  getCategories: {
    $get: async () => {
      const response = await fetch('/api/category/getCategories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  getEventCategories: {
    $get: async () => {
      const response = await fetch('/api/category/getEventCategories');
      if (!response.ok) {
        throw new Error('Failed to fetch event categories');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  }
};

// Webhook API
const webhooksApi = {
  getWebhooks: {
    $get: async () => {
      const response = await fetch('/api/webhooks/getWebhooks');
      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  
  createWebhook: {
    $post: async ({ json }: { json: any }) => {
      const response = await fetch('/api/webhooks/createWebhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });
      if (!response.ok) {
        throw new Error('Failed to create webhook');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  
  getWebhook: {
    $get: async ({ query }: { query: { id: string } }) => {
      const response = await fetch(`/api/webhooks/getWebhook?id=${query.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch webhook');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  
  updateWebhook: {
    $post: async ({ json }: { json: any }) => {
      const response = await fetch(`/api/webhooks/updateWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });
      if (!response.ok) {
        throw new Error('Failed to update webhook');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  
  deleteWebhook: {
    $post: async ({ json }: { json: { id: string } }) => {
      const response = await fetch(`/api/webhooks/deleteWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });
      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  
  regenerateSecret: {
    $post: async ({ json }: { json: { id: string } }) => {
      const response = await fetch(`/api/webhooks/regenerateSecret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate webhook secret');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
  
  getEvents: {
    $get: async () => {
      const response = await fetch('/api/webhooks/getEvents');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return {
        json: async () => parseSuperjsonResponse(response)
      };
    }
  },
};

// Export the API client
export const apiClient = {
  webhooks: webhooksApi,
  category: categoryApi,
};
