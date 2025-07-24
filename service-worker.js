const CACHE_NAME = 'pwa-salud-cache-v1';
// IMPORTANTE: Reemplaza 'YOUR_REPO_NAME' con el nombre de tu repositorio de GitHub.
// Por ejemplo, si tu URL es https://usuario.github.io/mi-pwa-app/, entonces YOUR_REPO_NAME es 'mi-pwa-app'.
const REPO_BASE_PATH = '/renal/'; 

const urlsToCache = [
    REPO_BASE_PATH, // Cacha la raíz del repositorio, que es donde se servirá index.html
    `${REPO_BASE_PATH}index.html`,
    `${REPO_BASE_PATH}style.css`,
    `${REPO_BASE_PATH}main.js`,
    `${REPO_BASE_PATH}logo.png`,
    `${REPO_BASE_PATH}fondo_01.jpg`,
    'https://cdn.tailwindcss.com', // Cacha el CDN de Tailwind
    // Aquí puedes añadir más URLs de activos estáticos que quieras cachear
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
            .then(() => self.skipWaiting()) // Fuerza la activación del nuevo Service Worker
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
        }).then(() => self.clients.claim()) // Permite que el Service Worker controle la página inmediatamente
    );
});

// Evento 'fetch': Intercepta las solicitudes de red
self.addEventListener('fetch', (event) => {
    // Estrategia Cache First: Intenta servir desde la caché, si no, va a la red
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si hay una respuesta en caché, la devuelve
                if (response) {
                    console.log('Service Worker: Sirviendo desde caché:', event.request.url);
                    return response;
                }
                // Si no está en caché, va a la red
                console.log('Service Worker: Fetching desde la red:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Opcional: Cachear nuevas respuestas de la red para futuras visitas
                        return caches.open(CACHE_NAME).then((cache) => {
                            // No cachear solicitudes que no sean GET o que tengan errores
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }
                            // Clona la respuesta porque un stream solo se puede consumir una vez
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    })
                    .catch(() => {
                        // Si falla la red y no hay caché, puedes servir una página offline
                        console.log('Service Worker: Fallo de red para:', event.request.url);
                        // return caches.match('/offline.html'); // Si tuvieras una página offline
                    });
            })
    );
});
