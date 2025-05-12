import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase credentials in .env file');
}

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Create MCP server
const server = new McpServer({
  name: "Yonder Plot Search",
  version: "1.0.0",
});

// Define the search_plots tool schema
const searchPlotsSchema = {
  max_price_eur: z.number().optional(),
  min_size_m2: z.number().optional(),
  near_coastline: z.boolean().optional(),
  near_beach: z.boolean().optional(),
  near_airport: z.boolean().optional(),
  near_main_town: z.boolean().optional(),
  near_public_transport: z.boolean().optional(),
  near_supermarket: z.boolean().optional(),
  near_convenience_store: z.boolean().optional(),
  near_restaurant_or_fastfood: z.boolean().optional(),
  near_cafe: z.boolean().optional(),
};

// Helper to build query filters
const buildQueryFilters = (params: Record<string, any>) => {
  let query = supabase.from('plots').select('*');

  if (params.max_price_eur !== undefined) {
    query = query.lte('price', params.max_price_eur);
  }

  if (params.min_size_m2 !== undefined) {
    query = query.gte('size', params.min_size_m2);
  }

  // Add filters for each boolean parameter
  const booleanFields = [
    'coastline',
    'beach',
    'airport',
    'main_town',
    'public_transport',
    'supermarket',
    'convenience_store',
    'restaurant_or_fastfood',
    'cafe',
  ];

  booleanFields.forEach(field => {
    const paramName = `near_${field}`;
    if (params[paramName] === true) {
      query = query.not(`enrichment_data->${field}->distance`, 'is', null);
    }
  });

  return query.limit(20);
};

// Add the search_plots tool
server.tool(
  "search_plots",
  searchPlotsSchema,
  async (params) => {
    try {
      const query = buildQueryFilters(params);
      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to include listing URLs
      const transformedData = data.map(plot => ({
        ...plot,
        listing_url: `https://liveyonder.co/version-test/listing/${plot.bubble_id}`
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(transformedData, null, 2)
        }]
      };
    } catch (error) {
      console.error('Error executing search_plots:', error);
      return {
        content: [{
          type: "text",
          text: `Error searching plots: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport); 