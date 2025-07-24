// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Tu configuración real de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB1EB6VDP8l0r6aZbLnNvnIFQcQi_AmCFg",
    authDomain: "app-renal.firebaseapp.com",
    projectId: "app-renal",
    storageBucket: "app-renal.firebasestorage.app",
    messagingSenderId: "161042778606",
    appId: "1:161042778606:web:6bde9f814bd74de7a1e6ff",
    measurementId: "G-THRNT9J3ST"
};

// El appId para Firestore, tomado de tu configuración de Firebase
const appId = firebaseConfig.projectId;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Se inicializa Firestore para uso futuro si es necesario

// Referencias a elementos del DOM
const appContainer = document.getElementById('app-container');

// Secciones de la aplicación
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const mainAppSection = document.getElementById('main-app-section'); // Sección para el contenido principal de la app

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
    // El contenedor principal de la aplicación ya es visible por defecto en style.css
    console.log('App container is now visible (display: flex).');

    // 1. Lógica para crear un usuario de simulación (SOLO PARA PRUEBAS - ELIMINAR EN PRODUCCIÓN)
    // Este bloque intenta crear un usuario "john@example.com" con contraseña "123456"
    // si no existe. Esto es útil para pruebas rápidas sin registro manual.
    // ¡IMPORTANTE! Elimina o comenta este bloque antes de desplegar en producción.
    const simulationEmail = 'john@example.com';
    const simulationPassword = '123456';
    try {
        await createUserWithEmailAndPassword(auth, simulationEmail, simulationPassword);
        console.log(`Usuario de simulación '${simulationEmail}' creado con éxito.`);
        // No se envía correo de verificación para el usuario de simulación para simplificar la prueba
        // y se asume que se puede iniciar sesión directamente.
        // Si necesitas que el usuario de simulación esté verificado, tendrías que simular la verificación
        // en la consola de Firebase o manejarlo en tu lógica de prueba.
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log(`Usuario de simulación '${simulationEmail}' ya existe.`);
        } else {
            console.error('Error al crear usuario de simulación:', error.code, error.message);
        }
    }
    // FIN DEL BLOQUE DE USUARIO DE SIMULACIÓN

    // 2. Mostrar directamente la sección de registro al cargar
    // Si el usuario ya está autenticado (por ejemplo, por una sesión previa o el usuario de simulación),
    // la lógica de onAuthStateChanged lo redirigirá a mainAppSection.
    showSection(registerSection);
    console.log('Showing register section directly on load.');

    // 3. Manejo de autenticación inicial de Firebase (se mantiene para la lógica de sesión)
    onAuthStateChanged(auth, async (user) => {
        if (!authChecked) { // Solo ejecutar esta lógica una vez en la carga inicial
            authChecked = true; // Marca que la verificación inicial ya se hizo

            if (user) {
                console.log('Usuario autenticado:', user.uid);
                // Si el usuario está autenticado, redirige a la sección principal de la app
                showSection(mainAppSection); 
            } else {
                console.log('No hay usuario autenticado.');
                // Si no hay usuario, inicia sesión anónimamente por defecto
                try {
                    await signInAnonymously(auth);
                    console.log('Sesión iniciada anónimamente.');
                } catch (error) {
                    console.error('Error al iniciar sesión anónimamente:', error);
                }
                // La sección de login no se muestra por defecto aquí, ya que se pidió la de registro.
                // Si el usuario cierra sesión, se volverá a la de login.
            }
        }
    });

    // 4. Registro del Service Worker
    if ('serviceWorker' in navigator) {
        try {
            // Ruta corregida para el Service Worker en GitHub Pages
            const registration = await navigator.serviceWorker.register('/renal/service-worker.js');
            console.log('Service Worker registrado con éxito:', registration);
        } catch (error) {
            console.error('Fallo el registro del Service Worker:', error);
        }
    }

    // 5. Manejo del evento beforeinstallprompt para el botón de instalación de PWA
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

    // 6. Manejo de la navegación entre secciones (Login y Registro)
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

    // 7. Lógica para el botón de "Acceso como Visitante"
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

    // 8. Manejo del envío del formulario de Inicio de Sesión (con Firebase Auth)
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

    // 9. Manejo del envío del formulario de Registro (con Firebase Auth)
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

    // 10. Lógica de cerrar sesión
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

    // 11. Validación de coincidencia de contraseñas en tiempo real
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

    // 12. Placeholder para solicitar permiso de notificaciones (se activará más adelante)
    async function requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showCustomModal('Notificaciones', 'Permiso de notificaciones concedido. ¡Recibirás recordatorios importantes!');
                console.log('Permiso de notificaciones concedido.');
            } else {
                showCustomModal('Notificaciones', 'Permiso de notificaciones denegado. No podrás recibir recordatorios.');
                console.log('Permiso de notificaciones denegado.');
            }
        } else {
            showCustomModal('Notificaciones', 'Tu navegador no soporta notificaciones.');
            console.log('El navegador no soporta notificaciones.');
        }
    }
});
