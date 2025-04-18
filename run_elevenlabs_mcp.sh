#!/bin/bash

# Wrapper script to run ElevenLabs MCP server with Python 3.11
# This ensures the correct Python version is used with the installed packages

# Path to Python 3.11
PYTHON_PATH="/usr/local/bin/python3.11"

# Path to the ElevenLabs MCP server script
SERVER_SCRIPT="/Library/Frameworks/Python.framework/Versions/3.11/lib/python3.11/site-packages/elevenlabs_mcp/server.py"

# Path to .env.local file
ENV_FILE=".env.local"

# Check if Python 3.11 exists
if [ ! -f "$PYTHON_PATH" ]; then
    echo "Error: Python 3.11 not found at $PYTHON_PATH"
    exit 1
fi

# Check if the server script exists
if [ ! -f "$SERVER_SCRIPT" ]; then
    echo "Error: ElevenLabs MCP server script not found at $SERVER_SCRIPT"
    exit 1
fi

# Check if .env.local file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env.local file not found. Please create it with ELEVENLABS_API_KEY."
    exit 1
fi

# Extract ElevenLabs API key from .env.local
ELEVENLABS_API_KEY=$(grep "ELEVENLABS_API_KEY" "$ENV_FILE" | cut -d '=' -f2)

if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "Error: ELEVENLABS_API_KEY not found in .env.local file."
    exit 1
fi

echo "Found ElevenLabs API key in .env.local"

# Run the server script with Python 3.11, passing all arguments and setting the API key
echo "Starting ElevenLabs MCP server with Python 3.11..."
ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY" "$PYTHON_PATH" "$SERVER_SCRIPT" "$@"