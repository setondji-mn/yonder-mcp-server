import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.BUBBLE_API_TOKEN || !process.env.BUBBLE_HOMES_URL) {
  throw new Error('Missing required environment variables');
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

// Add type definitions for the Yonder API response
interface YonderApiResponse {
  response: {
    results: YonderHome[];
    count: number;
    remaining: number;
  }
}

interface YonderHome {
  _id: string;
  _Title: string;
  _Price: number;
  '_Square meters': number;  // Note the space in the field name
  _Space_requirement?: number;
  _Description?: string;
  _Category?: string[];
  _Images?: string[];
  _Main_Image?: string;
  _Floor_Plan?: string;
  URL?: string;
  Prefab_Brand?: string;
  IsDeleted?: boolean;
}

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

// Define the list_prefab_homes tool schema
const listPrefabHomesSchema = {
  max_price_eur: z.number().optional(),
  min_size_m2: z.number().optional(),
  category: z.string().optional(),
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

// Add the list_prefab_homes tool
server.tool(
  "list_prefab_homes",
  listPrefabHomesSchema,
  async (params) => {
    try {
      const response = await fetch(process.env.BUBBLE_HOMES_URL!, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.BUBBLE_API_TOKEN}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json() as YonderApiResponse;
      let filteredHomes = data.response.results;

      // Debug log initial data
      console.error('Initial homes count:', filteredHomes.length);
      console.error('Sample home:', JSON.stringify(filteredHomes[0], null, 2));

      if (params.max_price_eur !== undefined) {
        filteredHomes = filteredHomes.filter(home => {
          const passes = home._Price <= params.max_price_eur!;
          if (!passes) {
            console.error(`Home ${home._Title} filtered out by price: ${home._Price} > ${params.max_price_eur}`);
          }
          return passes;
        });
      }

      if (params.min_size_m2 !== undefined) {
        filteredHomes = filteredHomes.filter(home => {
          // Handle both string and number types for Square meters
          const size = typeof home['_Square meters'] === 'string' 
            ? parseFloat(home['_Square meters']) 
            : home['_Square meters'];
            
          const passes = !isNaN(size) && size >= params.min_size_m2!;
          if (!passes) {
            console.error(`Home ${home._Title} filtered out by size: ${size} < ${params.min_size_m2}`);
          }
          return passes;
        });
      }

      // Debug log filtered results
      console.error('Filtered homes count:', filteredHomes.length);
      if (filteredHomes.length > 0) {
        console.error('Sample filtered home:', JSON.stringify(filteredHomes[0], null, 2));
      }

      if (params.category) {
        filteredHomes = filteredHomes.filter(home => 
          home._Category && home._Category.includes(params.category!)
        );
      }

      // Transform the data to include only relevant fields
      const transformedHomes = filteredHomes.map(home => ({
        id: home._id,
        title: home._Title,
        price_eur: home._Price,
        size_m2: home['_Square meters'],
        space_requirement_m2: home._Space_requirement,
        description: home._Description,
        categories: home._Category || [],
        images: home._Images || [],
        main_image: home._Main_Image,
        floor_plan: home._Floor_Plan,
        url: home.URL,
        prefab_brand: home.Prefab_Brand
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(transformedHomes, null, 2)
        }]
      };
    } catch (error) {
      console.error('Error fetching prefab homes:', error);
      return {
        content: [{
          type: "text",
          text: `Error fetching prefab homes: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport); 