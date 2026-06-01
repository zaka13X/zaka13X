# Use the official minimal Nginx Alpine image
FROM nginx:alpine

# Copy all static files from your local root directory into Nginx's default public folder
COPY . /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80
EXPOSE 443

# The base image already includes the default CMD to start Nginx, so no CMD layer is needed
