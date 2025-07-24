// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Tu configuración real de Firebase (necesaria también en app.js para inicializar Firebase)
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
const db = getFirestore(app);

// Referencias a elementos del DOM en app.html
const mainAppContainer = document.getElementById('main-app-container');

// Elementos del encabezado
const headerMenuButton = document.getElementById('header-menu-button');
const headerDropdownMenu = document.getElementById('header-dropdown-menu');
const logoutButtonDropdown = document.getElementById('logout-button-dropdown');

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
const profileEps = document.getElementById('profile-eps');
const profileEmail = document.getElementById('profile-email');
const profileCaregiverName = document.getElementById('profile-caregiver-name');
const profileCaregiverPhone = document.getElementById('profile-caregiver-phone');

// Modal personalizado
const customAlertModal = document.getElementById('custom-alert-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseButton = document.getElementById('modal-close-button');

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
            profileEps.textContent = userData.eps || 'N/A';
            profileEmail.textContent = auth.currentUser.email || 'N/A';
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
    // Asegurarse de que el contenedor principal de la app esté visible
    mainAppContainer.style.display = 'flex';
    console.log('Main app container is now visible (display: flex).');

    // Verificar el estado de autenticación al cargar app.html
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Usuario autenticado en app.html:', user.uid);
            // Muestra la sección de inicio por defecto
            showAppSubSection(homeSectionContent, navHome);
            loadUserProfile(user.uid); // Carga el perfil si el usuario está autenticado
        } else {
            console.log('No hay usuario autenticado en app.html. Redirigiendo a index.html.');
            // Si no hay usuario, redirige de vuelta a la página de login
            window.location.href = '/renal/index.html';
        }
    });

    // Manejo del menú desplegable del encabezado
    if (headerMenuButton) {
        headerMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            headerDropdownMenu.classList.toggle('hidden');
        });
    }

    // Ocultar el menú desplegable si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        if (headerDropdownMenu && !headerMenuButton.contains(e.target) && !headerDropdownMenu.contains(e.target)) {
            headerDropdownMenu.classList.add('hidden');
        }
    });

    // Lógica de cerrar sesión (botón en el menú desplegable del header)
    if (logoutButtonDropdown) {
        logoutButtonDropdown.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                showCustomModal('Sesión Cerrada', 'Has cerrado sesión correctamente. Redirigiendo...');
                console.log('Sesión cerrada desde dropdown.');
                window.location.href = '/renal/index.html'; // Redirige a la página de login
            } catch (error) {
                console.error('Error al cerrar sesión desde dropdown:', error);
                showCustomModal('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
            }
        });
    }

    // Lógica de navegación de la barra inferior
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
            showCustomModal('Información', 'No se pudo cargar el perfil. Por favor, inicia sesión.');
            // Opcional: redirigir a login si no hay usuario autenticado aquí también
            // window.location.href = '/renal/index.html';
        }
    });

    // Lógica para subir o tomar foto de perfil
    uploadPhotoButton.addEventListener('click', () => {
        profilePhotoUpload.click();
    });

    profilePhotoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePhotoDisplay.src = event.target.result;
                showCustomModal('Foto de Perfil', 'Foto seleccionada. (La funcionalidad de subida a la nube se implementará más adelante)');
            };
            reader.readAsDataURL(file);
        }
    });

    // Placeholder para solicitar permiso de notificaciones (se activará más adelante)
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
