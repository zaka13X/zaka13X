// Ensure the browser supports Service Workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the service worker file located at the root
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker successfully registered!');
        console.log('Scope:', registration.scope);

        // Optional: Listen for updates to the service worker script
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('New content available! Please refresh the page.');
                } else {
                  console.log('Content is now cached for offline use!');
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else {
  console.warn('Service Workers are not supported in this browser.');
}
