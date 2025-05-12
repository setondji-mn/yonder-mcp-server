# Yonder Plot Search MCP Server

MCP Server for searching land plots with enriched location data, enabling Claude to find properties based on natural language queries about price, size, and nearby amenities.

## Tools

1. `search_plots`
   - Search for plots based on price, size, and nearby features
   - Optional numeric inputs:
     - `max_price_eur` (number): Maximum price in euros
     - `min_size_m2` (number): Minimum plot size in square meters
   - Optional boolean filters (checks if feature exists nearby):
     - `near_coastline`: Plot is near the coastline
     - `near_beach`: Plot is near a beach
     - `near_airport`: Plot is near an airport
     - `near_main_town`: Plot is near a main town
     - `near_public_transport`: Plot has public transport access
     - `near_supermarket`: Plot is near a supermarket
     - `near_convenience_store`: Plot is near a convenience store
     - `near_restaurant_or_fastfood`: Plot is near dining options
     - `near_cafe`: Plot is near a cafe
   - Returns: Up to 20 matching plots with their details, enrichment data, and listing URLs (format: https://liveyonder.co/version-test/listing/{bubble_id})

## Example Queries

The MCP server enables natural language search through queries like:
- "Find me plots under €50,000 with a nearby supermarket and cafe"
- "Show plots that are near the coastline and have public transport access"
- "Search for plots over 1000m² near airports"

## Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd yonder-mcp-server
   npm install
   ```

2. Set up your Supabase environment:
   - Create a `.env` file with your Supabase credentials:
     ```
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_SERVICE_KEY=your_supabase_service_role_key
     ```

3. Start the server:
   ```bash
   npm start
   ```

### Database Schema

The server expects a Supabase database with a `plots` table containing:
- `id`: UUID primary key
- `bubble_id`: Client-facing identifier
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate
- `price`: Plot price in EUR
- `size`: Plot size in square meters
- `enrichment_data`: JSONB column containing nearby feature data

The `enrichment_data` structure for each plot:
```json
{
  "cafe": {
    "distance": number,
    "nearest_point": {
      "lat": number,
      "lon": number,
      "name": string
    }
  },
  "coastline": {
    "distance": number,
    "nearest_point": {
      "lat": number,
      "lon": number
    }
  },
  // ... similar structure for other features
}
```

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yonder_plots": {
      "command": "node",
      "args": ["/Users/setondji.mn/Documents/Code/minimum/yonder-mcp-server/dist/index.js"],
      "cwd": "/Users/setondji.mn/Documents/Code/minimum/yonder-mcp-server",
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_KEY": "your_supabase_service_role_key"
      }
    }
  }
}
```

### Usage with VS Code

For manual installation, add the following to your VS Code settings:

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "supabase_url",
        "description": "Supabase Project URL",
        "password": false
      },
      {
        "type": "promptString",
        "id": "supabase_key",
        "description": "Supabase Service Role Key",
        "password": true
      }
    ],
    "servers": {
      "yonder_plots": {
        "command": "npm",
        "args": ["start"],
        "cwd": "${workspaceFolder}",
        "env": {
          "SUPABASE_URL": "${input:supabase_url}",
          "SUPABASE_SERVICE_KEY": "${input:supabase_key}"
        }
      }
    }
  }
}
```

### Environment Variables

1. `SUPABASE_URL`: Required. Your Supabase project URL
2. `SUPABASE_SERVICE_KEY`: Required. Your Supabase service role key (not the anon key)

### Troubleshooting

If you encounter errors:
1. Verify your Supabase credentials are correct
2. Ensure the `plots` table exists with the correct schema
3. Check that the service role key has the necessary permissions
4. Verify the enrichment_data column contains properly structured JSON

## Development

The server is built with:
- TypeScript
- @modelcontextprotocol/sdk for MCP implementation
- @supabase/supabase-js for database access
- Zod for parameter validation

## License

This MCP server is licensed under the ISC License. See the LICENSE file for details. 
