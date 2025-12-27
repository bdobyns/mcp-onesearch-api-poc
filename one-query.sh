set -x

curl -X POST http://localhost:1337/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "simple_query",
      "arguments": {
      	  "context": "All",
	  "query": "Medicare"
      }
    }
  }'

