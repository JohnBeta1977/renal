// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variables globales de Firebase (proporcionadas por el entorno Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Se inicializa Firestore para uso futuro si es necesario

// Referencias a elementos del DOM
const splashScreen = document.getElementById('splash-screen');
const appContainer = document.getElementById('app-container');

// Secciones de la aplicación
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const mainAppSection = document.getElementById('main-app-section'); // Nueva sección para el contenido principal

const newUserLink = document.getElementById('new-user-link');
const backToLoginLink = document.getElementById('back-to-login-link');
const visitorButton = document.getElementById('visitor-button');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const regPassword = document.getElementById('reg-password');
const regConfirmPassword = document.getElementById('reg-confirm-password');
const passwordMatchError = document.getElementById('password-match-error');
const installButtonContainer = document.getElementById('install-button-container');
const installButton = document.getElementById('install-button');
const customAlertModal = document.getElementById('custom-alert-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseButton = document.getElementById('modal-close-button');
const logoutButton = document.getElementById('logout-button'); // Botón de cerrar sesión

let deferredPrompt; // Variable para almacenar el evento beforeinstallprompt
let authChecked = false; // Bandera para asegurar que la verificación inicial de autenticación se realice una sola vez

/**
 * Muestra un modal personalizado con un título y mensaje.
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje del modal.
 * @param {function} [callback] - Función a ejecutar cuando el modal se cierra.
 */
function showCustomModal(title, message, callback) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customAlertModal.classList.add('show');
    modalCloseButton.onclick = () => {
        customAlertModal.classList.remove('show');
        if (callback) callback();
    };
}

/**
 * Muestra una sección específica de la aplicación y oculta las demás.
 * @param {HTMLElement} sectionToShow - La sección HTML a mostrar.
 */
function showSection(sectionToShow) {
    const allSections = document.querySelectorAll('section');
    allSections.forEach(section => {
        section.classList.remove('active-section');
        section.classList.add('hidden-section');
    });
    sectionToShow.classList.remove('hidden-section');
    sectionToShow.classList.add('active-section');
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Manejo del splash screen y la carga inicial de la aplicación
    // Esta lógica se ejecuta primero para controlar la secuencia de aparición.
    setTimeout(() => {
        splashScreen.classList.add('hidden'); // Inicia la transición de opacidad del splash
        setTimeout(() => {
            splashScreen.style.display = 'none'; // Oculta completamente el splash después de la transición
            appContainer.style.display = 'flex'; // Muestra el contenedor principal de la aplicación
            console.log('App container should now be visible (display: flex).'); // Confirmación de visibilidad

            // Una vez que el contenedor principal es visible,
            // podemos configurar el listener de autenticación de Firebase.
            // Esto asegura que showSection se llame solo cuando appContainer esté listo.
            onAuthStateChanged(auth, async (user) => {
                if (!authChecked) { // Solo ejecutar esta lógica una vez en la carga inicial
                    authChecked = true; // Marca que la verificación inicial ya se hizo

                    if (user) {
                        console.log('Usuario autenticado:', user.uid);
                        // Si el usuario está autenticado, redirige a la sección principal de la app
                        showSection(mainAppSection);
                    } else {
                        console.log('No hay usuario autenticado.');
                        // Si no hay usuario, intenta iniciar sesión anónimamente o con token
                        if (initialAuthToken) {
                            try {
                                await signInWithCustomToken(auth, initialAuthToken);
                                console.log('Sesión iniciada con token personalizado.');
                            } catch (error) {
                                console.error('Error al iniciar sesión con token personalizado:', error);
                                await signInAnonymously(auth);
                                console.log('Sesión iniciada anónimamente como fallback.');
                            }
                        } else {
                            await signInAnonymously(auth);
                            console.log('Sesión iniciada anónimamente.');
                        }
                        // Muestra la sección de login por defecto si no hay usuario logueado
                        showSection(loginSection);
                    }
                }
                // Para cambios de estado de autenticación posteriores (ej. login/logout después de la carga inicial),
                // la lógica de showSection ya está manejada por los eventos de los formularios/botones.
            });

        }, 500); // Coincide con la duración de la transición CSS (0.5s)
    }, 1500); // Duración del splash screen: 1.5 segundos

    // 2. Registro del Service Worker (puede ir fuera del timeout ya que no afecta la visibilidad inicial)
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('Service Worker registrado con éxito:', registration);
        } catch (error) {
            console.error('Fallo el registro del Service Worker:', error);
        }
    }

    // 3. Manejo del evento beforeinstallprompt para el botón de instalación de PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // Evita que el navegador muestre su propio prompt
        deferredPrompt = e; // Almacena el evento para usarlo más tarde
        installButtonContainer.style.display = 'block'; // Muestra el botón de instalación
        console.log('Evento beforeinstallprompt capturado. Botón de instalación visible.');
    });

    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            installButtonContainer.style.display = 'none'; // Oculta el botón
            deferredPrompt.prompt(); // Muestra el prompt de instalación
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`El usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación de la PWA.`);
            deferredPrompt = null; // Limpia el evento
        }
    });

    window.addEventListener('appinstalled', () => {
        showCustomModal('¡PWA Instalada!', 'La aplicación ha sido instalada correctamente en tu dispositivo.');
        installButtonContainer.style.display = 'none'; // Asegura que el botón se oculte
        console.log('PWA instalada con éxito.');
    });

    // 4. Manejo de la navegación entre secciones (Login y Registro)
    newUserLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(registerSection);
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(loginSection);
        // Limpiar campos del formulario de registro al volver
        registerForm.reset();
        passwordMatchError.classList.add('hidden');
    });

    // 5. Lógica para el botón de "Acceso como Visitante"
    visitorButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInAnonymously(auth);
            const currentUser = userCredential.user;
            showCustomModal('Acceso como Visitante', `Has iniciado sesión como visitante. ID de usuario: ${currentUser.uid}. Podrás visualizar la información pero no modificarla.`);
            console.log('Acceso como Visitante. UID:', currentUser.uid);
            showSection(mainAppSection); // Muestra la sección principal para visitantes
        } catch (error) {
            console.error('Error al iniciar sesión anónimamente:', error);
            showCustomModal('Error', 'No se pudo iniciar sesión como visitante. Inténtalo de nuevo.');
        }
    });

    // 6. Manejo del envío del formulario de Inicio de Sesión (con Firebase Auth)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user.emailVerified) {
                showCustomModal('Inicio de Sesión Exitoso', `¡Bienvenido de nuevo, ${user.email}!`);
                console.log('Usuario logueado:', user.email);
                showSection(mainAppSection); // Redirigir a la sección principal de la aplicación
            } else {
                showCustomModal('Verificación Requerida', 'Por favor, verifica tu correo electrónico para iniciar sesión.');
                console.log('Usuario no verificado:', user.email);
                // Opcional: ofrecer reenviar el correo de verificación
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error.code, error.message);
            let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Correo electrónico o contraseña incorrectos.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'El formato del correo electrónico es inválido.';
            }
            showCustomModal('Error de Inicio de Sesión', errorMessage);
        }
    });

    // 7. Manejo del envío del formulario de Registro (con Firebase Auth)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (regPassword.value !== regConfirmPassword.value) {
            passwordMatchError.classList.remove('hidden');
            return;
        } else {
            passwordMatchError.classList.add('hidden');
        }

        const email = document.getElementById('reg-email').value;
        const password = regPassword.value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Enviar correo de verificación
            await sendEmailVerification(user);

            // Guardar datos adicionales del usuario en Firestore
            const userId = user.uid;
            await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile`, "data"), {
                fullName: document.getElementById('reg-full-name').value,
                bloodType: document.getElementById('reg-blood-type').value,
                weight: document.getElementById('reg-weight').value,
                age: document.getElementById('reg-age').value,
                dob: document.getElementById('reg-dob').value,
                disease: document.getElementById('reg-disease').value,
                caregiverName: document.getElementById('reg-caregiver-name').value,
                caregiverPhone: document.getElementById('reg-caregiver-phone').value
            });
            console.log("Datos de perfil guardados para el usuario:", userId);


            showCustomModal('¡Registro Exitoso!', `Se ha enviado un correo de verificación a ${user.email}. Por favor, verifica tu bandeja de entrada para completar el registro.`, () => {
                // Después de cerrar el modal, volver a la página de login
                showSection(loginSection);
            });
            console.log('Usuario registrado y correo de verificación enviado:', user.email);

        } catch (error) {
            console.error('Error al registrar usuario:', error.code, error.message);
            let errorMessage = 'Error al registrar usuario. Inténtalo de nuevo.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este correo electrónico ya está registrado.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'El formato del correo electrónico es inválido.';
            }
            showCustomModal('Error de Registro', errorMessage);
        }
    });

    // 8. Lógica de cerrar sesión
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showCustomModal('Sesión Cerrada', 'Has cerrado sesión correctamente.');
            console.log('Sesión cerrada.');
            showSection(loginSection); // Volver a la página de login
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            showCustomModal('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
        }
    });

    // 9. Validación de coincidencia de contraseñas en tiempo real
    regConfirmPassword.addEventListener('input', () => {
        if (regPassword.value !== regConfirmPassword.value) {
            passwordMatchError.classList.remove('hidden');
        } else {
            passwordMatchError.classList.add('hidden');
        }
    });
    regPassword.addEventListener('input', () => {
        if (regPassword.value !== regConfirmPassword.value) {
            passwordMatchError.classList.remove('hidden');
        } else {
            passwordMatchError.classList.add('hidden');
        }
    });

    // 10. Placeholder para solicitar permiso de notificaciones (se activará más adelante)
    // Puedes añadir un botón o un evento para llamar a esta función
    // Por ejemplo: document.getElementById('request-notification-permission-button').addEventListener('click', requestNotificationPermission);
    async function requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showCustomModal('Notificaciones', 'Permiso de notificaciones concedido. ¡Recibirás recordatorios importantes!');
                console.log('Permiso de notificaciones concedido.');
                // Aquí podrías inicializar Firebase Cloud Messaging si lo usas
            } else {
                showCustomModal('Notificaciones', 'Permiso de notificaciones denegado. No podrás recibir recordatorios.');
                console.log('Permiso de notificaciones denegado.');
            }
        } else {
            showCustomModal('Notificaciones', 'Tu navegador no soporta notificaciones.');
            console.log('El navegador no soporta notificaciones.');
        }
    }
    // Para probar, puedes descomentar la siguiente línea para solicitar permiso al cargar la app
    // requestNotificationPermission();
});