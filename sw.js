const CACHE_NAME = 'cifraprox-v40';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './chords.js',
    'logo.png',
    './manifest.json',
    './icons/abafado para baixo.svg',
    './icons/abafado para cima.svg',
    './icons/abafado.svg',
    './icons/batida circular.svg',
    './icons/batida para baixo.svg',
    './icons/batida para cima.svg',
    './icons/genero_acustico.svg',
    './icons/genero_mpb.svg',
    './icons/genero_rock.svg',
    './icons/genero_sertanejo.svg',
    './icons/repertorio.svg',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    // Force new SW to take control immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Claim clients immediately
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // Ignorar requisições para o Firebase Storage para evitar conflitos de CORS e cache
    if (event.request.url.includes('firebasestorage.googleapis.com')) {
        return; // Deixa o navegador lidar normalmente (bypass SW)
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retorna o cache se encontrar, senão vai para a rede
            return response || fetch(event.request).then((networkResponse) => {
                // Se for um arquivo de áudio ou estiver na pasta audios, coloca no cache automaticamente para ficar offline!
                if (event.request.url.includes('/audios/') || event.request.url.endsWith('.mp3')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        }).catch(() => {
            // Fallback para quando falha cache e rede (opcional)
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
