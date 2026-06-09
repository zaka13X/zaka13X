FROM nginx:alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy all assets and subdirectories into the Nginx root directory
COPY . /usr/share/nginx/html/

# Expose port 80 for the Nginx server
EXPOSE 80
