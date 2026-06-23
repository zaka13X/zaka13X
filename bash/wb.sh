#!/usr/bin/env bash

# Define the port and the local root folder to serve files from
PORT=8080
ROOT_DIR="."

echo "Starting static file server on http://localhost:$PORT"
echo "Serving all files from: $(realpath "$ROOT_DIR")"
echo "Press [CTRL+C] to stop."

while true; do
    # Listen for a connection and read the HTTP request header line
    # We use a FIFO trick or standard netcat mapping to handle dynamic responses
    nc -l -p "$PORT" | while read -r line; do
        # Look for the GET request line (e.g., "GET /index.html HTTP/1.1")
        if [[ "$line" =~ ^GET[[:space:]]+([^[:space:]?]+) ]]; then
            REQUEST_PATH="${BASH_REMATCH[1]}"
            
            # URL decoding (converts %20 to spaces, etc.)
            REQUEST_PATH=$(printf '%b' "${REQUEST_PATH//%/\\x}")
            
            # Prevent directory traversal attacks (security fix)
            if [[ "$REQUEST_PATH" == *"../"* ]]; then
                printf "HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n" | nc -l -p "$PORT"
                continue
            fi

            # If path ends in a slash, look for index.html
            LOCAL_PATH="${ROOT_DIR}${REQUEST_PATH}"
            if [[ -d "$LOCAL_PATH" ]]; then
                LOCAL_PATH="${LOCAL_PATH%/}/index.html"
            fi

            # Check if the requested file exists
            if [[ -f "$LOCAL_PATH" ]]; then
                # Determine Content-Type based on extension
                case "$LOCAL_PATH" in
                    *.html|*.htm) MIME="text/html" ;;
                    *.css)        MIME="text/css" ;;
                    *.js)         MIME="application/javascript" ;;
                    *.png)        MIME="image/png" ;;
                    *.jpg|*.jpeg) MIME="image/jpeg" ;;
                    *.gif)        MIME="image/gif" ;;
                    *.svg)        MIME="image/svg+xml" ;;
                    *.json)       MIME="application/json" ;;
                    *)            MIME="application/octet-stream" ;;
                esac

                FILE_SIZE=$(wc -c < "$LOCAL_PATH")

                # Send successful headers and stream the file contents
                {
                    printf "HTTP/1.1 200 OK\r\n"
                    printf "Content-Type: %s\r\n" "$MIME"
                    printf "Content-Length: %s\r\n" "$FILE_SIZE"
                    printf "Connection: close\r\n\r\n"
                    cat "$LOCAL_PATH"
                } | nc -l -p "$PORT"
            else
                # Send 404 Not Found error
                {
                    printf "HTTP/1.1 404 Not Found\r\n"
                    printf "Content-Type: text/plain\r\n"
                    printf "Connection: close\r\n\r\n"
                    printf "404 Not Found: %s" "$REQUEST_PATH"
                } | nc -l -p "$PORT"
            fi
            break
        fi
    done
done
