const CACHE_NAME = 'renalapp-cache-v1';
const REPO_BASE_PATH = '/renal/'; 

const urlsToCache = [
    REPO_BASE_PATH,
    `${REPO_BASE_PATH}index.html`,
    `${REPO_BASE_PATH}style.css`,
    `${REPO_BASE_PATH}main.js`,
    `${REPO_BASE_PATH}logo.png`,
    `${REPO_BASE_PATH}fondo_01.jpg`,
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Evento 'install': Se ejecuta cuando el Service Worker se instala por primera vez
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cacheando archivos esenciales.');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('Service Worker: Fallo al cachear archivos:', error);
            })
    );
});

// Evento 'activate': Se ejecuta cuando el Service Worker se activa
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Evento 'fetch': Intercepta las solicitudes de red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('Service Worker: Sirviendo desde caché:', event.request.url);
                    return response;
                }
                console.log('Service Worker: Fetching desde la red:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        return caches.open(CACHE_NAME).then((cache) => {
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    })
                    .catch(() => {
                        console.log('Service Worker: Fallo de red para:', event.request.url);
                    });
            })
    );
});
