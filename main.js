// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const splashScreen = document.getElementById('splash-screen'); // Referencia al splash screen
const appContainer = document.getElementById('app-container');

// Secciones principales de la aplicación (login/registro/app)
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const mainAppSection = document.getElementById('main-app-section');

// Elementos de navegación y formularios
const newUserLink = document.getElementById('new-user-link');
const backToLoginLink = document.getElementById('back-to-login-link');
const visitorButton = document.getElementById('visitor-button');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const regPassword = document.getElementById('reg-password');
const regConfirmPassword = document.getElementById('reg-confirm-password');
const passwordMatchError = document.getElementById('password-match-error');

// Elementos del encabezado (solo para main-app-section)
const headerMenuButton = document.getElementById('header-menu-button');
const headerDropdownMenu = document.getElementById('header-dropdown-menu');
const logoutButtonDropdown = document.getElementById('logout-button-dropdown'); // Botón de cerrar sesión en el dropdown

// Elementos de la barra de navegación inferior
const navHome = document.getElementById('nav-home');
const navFluid = document.getElementById('nav-fluid');
const navMedications = document.getElementById('nav-medications');
const navAppointments = document.getElementById('nav-appointments');
const navProfile = document.getElementById('nav-profile');

// Contenido de las sub-secciones de la aplicación principal
const homeSectionContent = document.getElementById('home-section-content');
const fluidSectionContent = document.getElementById('fluid-section-content');
const medicationsSectionContent = document.getElementById('medications-section-content');
const appointmentsSectionContent = document.getElementById('appointments-section-content');
const profileSectionContent = document.getElementById('profile-section-content');

// Elementos de la sección de perfil
const profilePhotoDisplay = document.getElementById('profile-photo-display');
const profilePhotoUpload = document.getElementById('profile-photo-upload');
const uploadPhotoButton = document.getElementById('upload-photo-button');
const profileFullName = document.getElementById('profile-full-name');
const profileBloodType = document.getElementById('profile-blood-type');
const profileAge = document.getElementById('profile-age');
const profileDisease = document.getElementById('profile-disease');
const profileEps = document.getElementById('profile-eps'); // Nuevo elemento para EPS
const profileEmail = document.getElementById('profile-email');
const profileCaregiverName = document.getElementById('profile-caregiver-name');
const profileCaregiverPhone = document.getElementById('profile-caregiver-phone');

// PWA instalación elementos
const installButtonContainer = document.getElementById('install-button-container');
const installButton = document.getElementById('install-button');
let deferredPrompt; // Variable para almacenar el evento beforeinstallprompt

// Modal personalizado
const customAlertModal = document.getElementById('custom-alert-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseButton = document.getElementById('modal-close-button');

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
 * Muestra una sección principal de la aplicación y oculta las demás.
 * @param {HTMLElement} sectionToShow - La sección HTML principal a mostrar.
 */
function showMainSection(sectionToShow) {
    const allSections = document.querySelectorAll('section');
    allSections.forEach(section => {
        section.classList.remove('active-section');
        section.classList.add('hidden-section');
    });
    sectionToShow.classList.remove('hidden-section');
    sectionToShow.classList.add('active-section');
}

/**
 * Muestra una sub-sección dentro de la sección principal de la aplicación.
 * @param {HTMLElement} subSectionToShow - La sub-sección HTML a mostrar.
 * @param {HTMLElement} activeNavItem - El ítem de navegación que debe estar activo.
 */
function showAppSubSection(subSectionToShow, activeNavItem) {
    // Oculta todas las sub-secciones
    const allSubSections = document.querySelectorAll('.app-sub-section');
    allSubSections.forEach(subSection => {
        subSection.classList.remove('active-sub-section');
        subSection.classList.add('hidden-sub-section');
    });
    // Muestra la sub-sección deseada
    subSectionToShow.classList.remove('hidden-sub-section');
    subSectionToShow.classList.add('active-sub-section');

    // Desactiva todos los ítems de navegación
    const allNavItems = document.querySelectorAll('.nav-item');
    allNavItems.forEach(item => {
        item.classList.remove('active-nav');
    });
    // Activa el ítem de navegación correspondiente
    if (activeNavItem) {
        activeNavItem.classList.add('active-nav');
    }
}

/**
 * Carga y muestra la información del perfil del usuario desde Firestore.
 * @param {string} userId - El ID del usuario actual.
 */
async function loadUserProfile(userId) {
    try {
        const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, "data");
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            profileFullName.textContent = userData.fullName || 'N/A';
            profileBloodType.textContent = userData.bloodType || 'N/A';
            profileAge.textContent = userData.age ? `${userData.age}` : 'N/A';
            profileDisease.textContent = userData.disease || 'N/A';
            profileEps.textContent = userData.eps || 'N/A'; // Cargar EPS
            profileEmail.textContent = auth.currentUser.email || 'N/A'; // Usar el email de Firebase Auth
            profileCaregiverName.textContent = userData.caregiverName || 'N/A';
            profileCaregiverPhone.textContent = userData.caregiverPhone || 'N/A';
            // Aquí puedes cargar la foto de perfil si la guardas en Firestore o Storage
            // Por ahora, se mantiene el logo por defecto
        } else {
            console.log("No hay datos de perfil para este usuario.");
            // Opcional: mostrar un mensaje o un formulario para completar el perfil
        }
    } catch (error) {
        console.error("Error al cargar el perfil del usuario:", error);
        showCustomModal('Error', 'No se pudo cargar la información de tu perfil.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Mostrar el splash screen al inicio
    splashScreen.style.display = 'flex';
    appContainer.style.display = 'none'; // Asegurarse de que el contenedor principal esté oculto

    setTimeout(() => {
        splashScreen.classList.add('hidden'); // Inicia la transición de opacidad del splash
        setTimeout(() => {
            splashScreen.style.display = 'none'; // Oculta completamente el splash después de la transición
            appContainer.style.display = 'flex'; // Muestra el contenedor principal de la aplicación
            console.log('App container is now visible (display: flex).'); // Confirmación de visibilidad

            // 2. Lógica para crear un usuario de simulación (SOLO PARA PRUEBAS - ELIMINAR EN PRODUCCIÓN)
            const simulationEmail = 'john@example.com';
            const simulationPassword = '123456';
            try {
                await createUserWithEmailAndPassword(auth, simulationEmail, simulationPassword);
                console.log(`Usuario de simulación '${simulationEmail}' creado con éxito.`);
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log(`Usuario de simulación '${simulationEmail}' ya existe.`);
                } else {
                    console.error('Error al crear usuario de simulación:', error.code, error.message);
                }
            }
            // FIN DEL BLOQUE DE USUARIO DE SIMULACIÓN

            // 3. Manejo de autenticación inicial de Firebase
            onAuthStateChanged(auth, async (user) => {
                if (!authChecked) { // Solo ejecutar esta lógica una vez en la carga inicial
                    authChecked = true; // Marca que la verificación inicial ya se hizo

                    if (user) {
                        console.log('Usuario autenticado:', user.uid);
                        showMainSection(mainAppSection);
                        // Muestra la sección de inicio por defecto en la app principal
                        showAppSubSection(homeSectionContent, navHome);
                        // Carga el perfil si el usuario está autenticado
                        loadUserProfile(user.uid);
                    } else {
                        console.log('No hay usuario autenticado.');
                        // Si no hay usuario, inicia sesión anónimamente por defecto
                        try {
                            await signInAnonymously(auth);
                            console.log('Sesión iniciada anónimamente.');
                        } catch (error) {
                            console.error('Error al iniciar sesión anónimamente:', error);
                        }
                        // Muestra la sección de login por defecto si no hay usuario logueado
                        showMainSection(loginSection);
                    }
                }
            });

        }, 500); // Coincide con la duración de la transición CSS (0.5s)
    }, 1500); // Duración del splash screen: 1.5 segundos

    // 4. Registro del Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/renal/service-worker.js');
            console.log('Service Worker registrado con éxito:', registration);
        } catch (error) {
            console.error('Fallo el registro del Service Worker:', error);
        }
    }

    // 5. Manejo del evento beforeinstallprompt para el botón de instalación de PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButtonContainer.style.display = 'block';
        console.log('Evento beforeinstallprompt capturado. Botón de instalación visible.');
    });

    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            installButtonContainer.style.display = 'none';
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`El usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación de la PWA.`);
            deferredPrompt = null;
        }
    });

    window.addEventListener('appinstalled', () => {
        showCustomModal('¡PWA Instalada!', 'La aplicación ha sido instalada correctamente en tu dispositivo.');
        installButtonContainer.style.display = 'none';
        console.log('PWA instalada con éxito.');
    });

    // 6. Manejo de la navegación entre secciones principales (Login y Registro)
    newUserLink.addEventListener('click', (e) => {
        e.preventDefault();
        showMainSection(registerSection);
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showMainSection(loginSection);
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
            showMainSection(mainAppSection);
            showAppSubSection(homeSectionContent, navHome); // Muestra inicio para visitantes
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
            showCustomModal('Inicio de Sesión Exitoso', `¡Bienvenido de nuevo, ${user.email}!`);
            console.log('Usuario logueado:', user.email);
            showMainSection(mainAppSection);
            showAppSubSection(homeSectionContent, navHome); // Muestra inicio después de login
            loadUserProfile(user.uid); // Carga el perfil del usuario logueado
        } catch (error) {
            console.error('Error al iniciar sesión:', error.code, error.message);
            let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
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

            // Guardar datos adicionales del usuario en Firestore
            const userId = user.uid;
            await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile`, "data"), {
                fullName: document.getElementById('reg-full-name').value,
                bloodType: document.getElementById('reg-blood-type').value,
                age: document.getElementById('reg-age').value,
                disease: document.getElementById('reg-disease').value,
                eps: document.getElementById('reg-eps').value, // Guardar EPS
                caregiverName: document.getElementById('reg-caregiver-name').value,
                caregiverPhone: document.getElementById('reg-caregiver-phone').value,
                profilePhotoUrl: '' // Campo para la URL de la foto de perfil
            });
            console.log("Datos de perfil guardados para el usuario:", userId);


            showCustomModal('¡Registro Exitoso!', `¡Bienvenido a RenalApp, ${user.email}! Ya puedes iniciar sesión.`);
            console.log('Usuario registrado:', user.email);
            showMainSection(loginSection); // Después del registro, volver a la página de login
            registerForm.reset(); // Limpiar el formulario de registro
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

    // 10. Lógica de cerrar sesión (botón en el menú desplegable del header)
    if (logoutButtonDropdown) { // Verificar si el elemento existe antes de añadir el listener
        logoutButtonDropdown.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                showCustomModal('Sesión Cerrada', 'Has cerrado sesión correctamente.');
                console.log('Sesión cerrada desde dropdown.');
                showMainSection(loginSection); // Volver a la página de login
                headerDropdownMenu.classList.add('hidden'); // Ocultar el dropdown
            } catch (error) {
                console.error('Error al cerrar sesión desde dropdown:', error);
                showCustomModal('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
            }
        });
    }


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

    // 12. Lógica para el menú desplegable del encabezado (solo para main-app-section)
    if (headerMenuButton) { // Verificar si el elemento existe antes de añadir el listener
        headerMenuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el clic se propague y cierre el menú inmediatamente
            headerDropdownMenu.classList.toggle('hidden');
        });
    }

    // Ocultar el menú desplegable si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        if (headerDropdownMenu && !headerMenuButton.contains(e.target) && !headerDropdownMenu.contains(e.target)) {
            headerDropdownMenu.classList.add('hidden');
        }
    });

    // 13. Lógica de navegación de la barra inferior
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        showAppSubSection(homeSectionContent, navHome);
    });

    navFluid.addEventListener('click', (e) => {
        e.preventDefault();
        showAppSubSection(fluidSectionContent, navFluid);
    });

    navMedications.addEventListener('click', (e) => {
        e.preventDefault();
        showAppSubSection(medicationsSectionContent, navMedications);
    });

    navAppointments.addEventListener('click', (e) => {
        e.preventDefault();
        showAppSubSection(appointmentsSectionContent, navAppointments);
    });

    navProfile.addEventListener('click', async (e) => {
        e.preventDefault();
        showAppSubSection(profileSectionContent, navProfile);
        // Cargar la información del perfil cuando se navega a la sección de perfil
        if (auth.currentUser) {
            await loadUserProfile(auth.currentUser.uid);
        } else {
            console.warn("No hay usuario autenticado para cargar el perfil.");
            showCustomModal('Información', 'Inicia sesión para ver tu perfil completo.');
        }
    });

    // 14. Lógica para subir o tomar foto de perfil
    uploadPhotoButton.addEventListener('click', () => {
        profilePhotoUpload.click(); // Simula el clic en el input de tipo file
    });

    profilePhotoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePhotoDisplay.src = event.target.result;
                // Aquí podrías añadir la lógica para subir la foto a Firebase Storage
                // y guardar la URL en Firestore en el perfil del usuario.
                showCustomModal('Foto de Perfil', 'Foto seleccionada. (La funcionalidad de subida a la nube se implementará más adelante)');
            };
            reader.readAsDataURL(file);
        }
    });

    // 15. Placeholder para solicitar permiso de notificaciones (se activará más adelante)
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
