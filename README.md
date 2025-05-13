# Yonder Plot Search MCP Server

MCP Server for searching land plots and prefab homes, enabling Claude to find properties based on natural language queries about price, size, and nearby amenities.

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
   - Returns: Up to 20 matching plots with their details, enrichment data, and listing URLs

2. `list_prefab_homes`
   - Search for prefab homes based on price and size
   - Optional numeric inputs:
     - `max_price_eur` (number): Maximum price in euros
     - `min_size_m2` (number): Minimum home size in square meters
   - Optional filters:
     - `category` (string): Filter by home category
   - Returns: List of matching prefab homes with details, images, and floor plans

### Example Queries

The MCP server enables natural language search through queries like:
- "Find me plots under €50,000 with a nearby supermarket and cafe"
- "Show plots that are near the coastline and have public transport access"
- "Search for plots over 1000m² near airports"
- "Show me prefab homes under €100,000 with at least 80m²"

## Setup and Usage with Claude Desktop

Open Terminal (Mac) or Command Prompt (Windows) and run these commands:

1. Install Node.js globally:
   ```bash
   # Mac (using Homebrew)
   brew install node

   # Windows (using winget)
   winget install OpenJS.NodeJS.LTS
   ```

2. Set up the project:
   ```bash
   # Clone and build
   git clone https://github.com/setondji-mn/yonder-mcp-server
   cd yonder-mcp-server
   npm install
   npm run build

   # Create .env file
   echo "SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   BUBBLE_API_TOKEN=your_bubble_api_token
   BUBBLE_HOMES_URL=your_bubble_homes_url" > .env

   # Get your project path
   pwd  # On Mac
   cd   # On Windows
   ```

3. Set up Claude Desktop:
   - Open Claude Desktop
   - Click Claude menu → Settings → Developer → Edit Config
   - This opens:
     - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Add this configuration (replace FULL_PATH_TO_PROJECT with path from previous step):
     ```json
     {
       "mcpServers": {
         "yonder_plots": {
           "command": "node",
           "args": ["FULL_PATH_TO_PROJECT/dist/index.js"],
           "cwd": "FULL_PATH_TO_PROJECT",
           "env": {
             "SUPABASE_URL": "your_supabase_url",
             "SUPABASE_SERVICE_KEY": "your_supabase_service_key",
             "BUBBLE_API_TOKEN": "your_bubble_api_token",
             "BUBBLE_HOMES_URL": "your_bubble_homes_url"
           }
         }
       }
     }
     ```
   - Replace the credential values with your actual values from the .env file
   - Save the file and restart Claude Desktop
   - Look for the hammer icon 🔨 in bottom right
   - Click hammer to verify "yonder_plots" is listed

### Troubleshooting

If server isn't working:
1. Check logs:
   ```bash
   # Mac
   tail -f ~/Library/Logs/Claude/mcp*.log

   # Windows
   type "%APPDATA%\Claude\logs\mcp*.log"
   ```
2. Verify paths in claude_desktop_config.json are absolute and correct
3. Make sure all credentials in .env match claude_desktop_config.json

## License

This MCP server is licensed under the ISC License. See the LICENSE file for details. 
