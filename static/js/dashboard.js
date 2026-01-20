// Global function to show sections
window.showSection = function (sectionId) {
    // Hide all view-sections
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected section
    const target = document.getElementById(`view-${sectionId}`);
    if (target) {
        target.classList.add('active');
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });

    // Save current section to localStorage for persistence after reload
    localStorage.setItem('currentSection', sectionId);
};

// Restore section on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedSection = localStorage.getItem('currentSection');
    if (savedSection) {
        showSection(savedSection);
    } else {
        showSection('resumen');
    }
});

// Toggle Action Menu
window.toggleActionMenu = function (button) {
    // Close other open menus
    document.querySelectorAll('.action-content.show').forEach(el => {
        if (el !== button.nextElementSibling) el.classList.remove('show');
    });

    const menu = button.nextElementSibling;
    menu.classList.toggle('show');

    // Stop propagation so clicking menu doesn't close it immediately
    event.stopPropagation();
};

// Close all menus when clicking outside
window.addEventListener('click', () => {
    document.querySelectorAll('.action-content.show').forEach(el => {
        el.classList.remove('show');
    });
});

window.closeModal = function (modal) {
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Action Placeholders
// Material You SweetAlert2 Configuration
const swalMaterialYou = Swal.mixin({
    customClass: {
        popup: 'swal-material-you',
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outlined',
        title: 'swal-material-title',
    },
    buttonsStyling: false,
    background: 'var(--md-sys-color-surface, #FFF8F0)',
    color: 'var(--md-sys-color-on-surface, #201A17)',
    confirmButtonColor: '#6D4C41',
});

window.viewUser = function (id) {
    const row = document.querySelector(`.js-view-user[data-id="${id}"]`);
    if (row) {
        const firstName = row.dataset.firstname || '';
        const lastName = row.dataset.lastname || '';
        const email = row.dataset.email || '';
        const role = row.dataset.role || 'Usuario';
        const status = row.dataset.status || 'Activo';

        swalMaterialYou.fire({
            title: `${firstName} ${lastName}`,
            html: `
                <div style="text-align: left; padding: 0 1rem;">
                    <p style="margin: 0.5rem 0;"><strong>Correo:</strong> ${email}</p>
                    <p style="margin: 0.5rem 0;"><strong>Rol:</strong> ${role}</p>
                    <p style="margin: 0.5rem 0;"><strong>Estado:</strong> ${status}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar'
        });
    }
};

window.editUser = function (id) {
    const row = document.querySelector(`.js-edit-user[data-id="${id}"]`);
    if (!row) return;

    const firstName = row.dataset.firstname || '';
    const lastName = row.dataset.lastname || '';
    const email = row.dataset.email || '';
    const isActive = row.dataset.status === 'Activo';

    swalMaterialYou.fire({
        title: 'Editar Usuario',
        html: `
            <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
                <input id="swal-firstName" class="swal2-input" placeholder="Nombres" value="${firstName}" style="margin: 0;">
                <input id="swal-lastName" class="swal2-input" placeholder="Apellidos" value="${lastName}" style="margin: 0;">
                <input id="swal-email" class="swal2-input" placeholder="Correo Electrónico" value="${email}" style="margin: 0;">
                <select id="swal-status" class="swal2-input" style="margin: 0; padding: 12px;">
                    <option value="true" ${isActive ? 'selected' : ''}>Activo</option>
                    <option value="false" ${!isActive ? 'selected' : ''}>Inactivo</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            return {
                first_name: document.getElementById('swal-firstName').value,
                last_name: document.getElementById('swal-lastName').value,
                email: document.getElementById('swal-email').value,
                is_active: document.getElementById('swal-status').value === 'true'
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/admin/edit_user/${id}`, {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire({
                        title: 'Actualizado',
                        text: 'La información del usuario ha sido actualizada.',
                        icon: 'success',
                    }).then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al actualizar', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

window.deleteUser = function (id) {
    swalMaterialYou.fire({
        title: '¿Eliminar Usuario?',
        text: "Esta acción es permanente y no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#B71C1C',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/admin/delete_user/${id}`, {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire('Eliminado!', data.message, 'success').then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', 'No se pudo eliminar el usuario', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'Fallo de red', 'error');
            }
        }
    });
};

// === Filtering Logic ===
window.filterUsers = function (role) {
    showSection('usuarios');
    const rows = document.querySelectorAll('#userTableBody tr');

    rows.forEach(row => {
        const roleCell = row.cells[1].textContent.trim(); // Assuming Role is 2nd column
        if (role === 'all' || roleCell.toLowerCase() === role.toLowerCase()) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Update table title or provide feedback?
    // Optionally scroll to table
};

// === Task Logic ===
window.addTask = function () {
    Swal.fire({
        title: 'Nueva Tarea',
        html: `
            <input id="task-title" class="swal2-input" placeholder="Título de la tarea">
            <input id="task-date" type="datetime-local" class="swal2-input">
        `,
        showCancelButton: true,
        confirmButtonColor: '#6D4C41',
        confirmButtonText: 'Crear',
        preConfirm: () => {
            return [
                document.getElementById('task-title').value,
                document.getElementById('task-date').value
            ]
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const [title, date] = result.value;
            if (!title) return;

            // Add to DOM list visually
            const taskList = document.getElementById('taskList'); // We need to add this ID to HTML
            if (taskList) {
                const newTaskHtml = `
                <div class="d-flex align-center gap-2 mb-2 task-item" onclick="this.classList.toggle('completed')">
                     <span class="material-symbols-rounded check-icon" style="color:var(--md-sys-color-outline); cursor:pointer;">radio_button_unchecked</span>
                     <div>
                         <strong>${title}</strong>
                         <div style="font-size:0.85rem; color:var(--md-sys-color-on-surface-variant);">${date || 'Sin fecha'}</div>
                     </div>
                </div>`;
                taskList.insertAdjacentHTML('beforeend', newTaskHtml);
            }

            Swal.fire({
                title: 'Tarea Registrada',
                text: 'La tarea se ha añadido a tu lista.',
                icon: 'success',
                confirmButtonColor: '#6D4C41'
            });
        }
    });
};

// === Theme Logic ===
window.changeTheme = function (select) {
    const theme = select.value;
    if (theme === 'Dark Mode') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    // Ideally save to localStorage
    localStorage.setItem('theme', theme);
};

// === Config Logic ===
window.saveConfig = function () {
    const name = document.getElementById('instName').value;
    const brandText = document.getElementById('brand-text');
    if (brandText) {
        brandText.textContent = name;
    }
    localStorage.setItem('schoolName', name);

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        const theme = themeSelect.value;
        if (theme === 'Dark Mode') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        localStorage.setItem('theme', theme);
    }

    swalMaterialYou.fire('Guardado', 'Configuración actualizada', 'success');
}


document.addEventListener('DOMContentLoaded', () => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'Dark Mode') {
        document.body.classList.add('dark-theme');
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = 'Dark Mode';
    }

    // Check local storage for school name
    const savedSchoolName = localStorage.getItem('schoolName');
    if (savedSchoolName) {
        const brandText = document.getElementById('brand-text');
        if (brandText) brandText.textContent = savedSchoolName;
        const instNameInput = document.getElementById('instName');
        if (instNameInput) instNameInput.value = savedSchoolName;
    }

    // === Modal Logic Generic ===
    const userModal = document.getElementById('userModal');
    const openUserModalBtn = document.getElementById('openUserModal');
    const closeUserModalBtn = document.getElementById('closeUserModal');
    const cancelUserModalBtn = document.getElementById('cancelUserModal');

    function openModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
            void modal.offsetWidth; // trigger reflow
            modal.classList.add('show');
        }
    }

    if (openUserModalBtn) {
        openUserModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(userModal);
        });
    }

    if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', () => closeModal(userModal));
    if (cancelUserModalBtn) cancelUserModalBtn.addEventListener('click', () => closeModal(userModal));

    window.addEventListener('click', (e) => {
        if (e.target === userModal) {
            closeModal(userModal);
        }
    });

    // === AJAX Registration Form ===
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(newUserForm);

            try {
                const response = await fetch(newUserForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    closeModal(userModal);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Usuario Creado!',
                        text: 'El nuevo usuario ha sido registrado correctamente.',
                        confirmButtonColor: '#6D4C41'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Hubo un error al crear el usuario.',
                        confirmButtonColor: '#6D4C41'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Conexión',
                    text: 'No se pudo conectar con el servidor.',
                    confirmButtonColor: '#6D4C41'
                });
            }
        });
    }

    // === Logout Logic ===
    const logoutLinks = document.querySelectorAll('a[href*="logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');

            swalMaterialYou.fire({
                title: '¿Cerrar Sesión?',
                text: "¿Estás seguro de que deseas salir de la plataforma?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = href;
                }
            });
        });
    });

    // === User Actions Event Delegation ===
    document.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.js-view-user');
        if (viewBtn) {
            viewUser(viewBtn.dataset.id);
        }

        const editBtn = e.target.closest('.js-edit-user');
        if (editBtn) {
            editUser(editBtn.dataset.id);
        }

        const deleteBtn = e.target.closest('.js-delete-user');
        if (deleteBtn) {
            deleteUser(deleteBtn.dataset.id);
        }

        // Course Actions
        const viewCourseBtn = e.target.closest('.js-view-course');
        if (viewCourseBtn) {
            viewCourse(viewCourseBtn);
        }

        const editCourseBtn = e.target.closest('.js-edit-course');
        if (editCourseBtn) {
            editCourse(editCourseBtn);
        }

        const deleteCourseBtn = e.target.closest('.js-delete-course');
        if (deleteCourseBtn) {
            deleteCourse(deleteCourseBtn.dataset.id);
        }
    });

});

// === Course Action Functions ===
window.viewCourse = function (el) {
    const name = el.dataset.name || 'Curso';
    const grade = el.dataset.grade || 'N/A';
    const teacher = el.dataset.teacher || 'Sin asignar';
    const status = el.dataset.status || 'Activo';

    swalMaterialYou.fire({
        title: name,
        html: `
            <div style="text-align: left; padding: 0 1rem;">
                <p style="margin: 0.5rem 0;"><strong>Grado:</strong> ${grade}</p>
                <p style="margin: 0.5rem 0;"><strong>Profesor:</strong> ${teacher}</p>
                <p style="margin: 0.5rem 0;"><strong>Estado:</strong> ${status}</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Cerrar'
    });
};

window.editCourse = async function (el) {
    const id = el.dataset.id;
    const isActive = el.dataset.status === 'Activo';
    const currentTeacherId = el.dataset.teacherid || '';

    // Fetch available teachers
    let teacherOptions = '<option value="">Sin asignar</option>';
    try {
        const response = await fetch('/api/teachers');
        const teachers = await response.json();
        teachers.forEach(t => {
            const selected = (t.id == currentTeacherId) ? 'selected' : '';
            teacherOptions += `<option value="${t.id}" ${selected}>${t.name}</option>`;
        });
    } catch (error) {
        console.error('Error fetching teachers:', error);
    }

    swalMaterialYou.fire({
        title: 'Editar Curso',
        html: `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Profesor Asignado</label>
                    <select id="swal-course-teacher" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        ${teacherOptions}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Estado del Curso</label>
                    <select id="swal-course-status" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        <option value="true" ${isActive ? 'selected' : ''}>Activo</option>
                        <option value="false" ${!isActive ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            return {
                teacher_id: document.getElementById('swal-course-teacher').value || null,
                is_active: document.getElementById('swal-course-status').value === 'true'
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/admin/edit_course/${id}`, {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire({
                        title: 'Actualizado',
                        text: 'El curso ha sido actualizado.',
                        icon: 'success',
                    }).then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al actualizar', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

window.deleteCourse = function (id) {
    swalMaterialYou.fire({
        title: '¿Eliminar Curso?',
        text: "Esta acción es permanente y no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#B71C1C',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/admin/delete_course/${id}`, {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire('Eliminado!', data.message, 'success').then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'No se pudo eliminar el curso', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'Fallo de red', 'error');
            }
        }
    });
};

// === Create Course Function ===
window.createCourse = async function () {
    // Fetch grades, subjects, and teachers
    let gradeOptions = '';
    let subjectOptions = '';
    let teacherOptions = '<option value="">Sin asignar</option>';

    try {
        const [gradesRes, subjectsRes, teachersRes] = await Promise.all([
            fetch('/api/grades'),
            fetch('/api/subjects'),
            fetch('/api/teachers')
        ]);

        const grades = await gradesRes.json();
        const subjects = await subjectsRes.json();
        const teachers = await teachersRes.json();

        grades.forEach(g => {
            gradeOptions += `<option value="${g.id}">${g.name}</option>`;
        });

        subjects.forEach(s => {
            subjectOptions += `<option value="${s.id}">${s.name}</option>`;
        });

        teachers.forEach(t => {
            teacherOptions += `<option value="${t.id}">${t.name}</option>`;
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        swalMaterialYou.fire('Error', 'No se pudo cargar los datos', 'error');
        return;
    }

    swalMaterialYou.fire({
        title: 'Nuevo Curso',
        html: `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Materia *</label>
                    <select id="swal-subject" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;" required>
                        <option value="">Seleccionar materia...</option>
                        ${subjectOptions}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Grado *</label>
                    <select id="swal-grade" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;" required>
                        <option value="">Seleccionar grado...</option>
                        ${gradeOptions}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Profesor Asignado</label>
                    <select id="swal-teacher" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        ${teacherOptions}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Estado</label>
                    <select id="swal-status" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        <option value="true" selected>Activo</option>
                        <option value="false">Inactivo</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Curso',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const subject_id = document.getElementById('swal-subject').value;
            const grade_id = document.getElementById('swal-grade').value;

            if (!subject_id || !grade_id) {
                Swal.showValidationMessage('Debes seleccionar materia y grado');
                return false;
            }

            return {
                subject_id: subject_id,
                grade_id: grade_id,
                teacher_id: document.getElementById('swal-teacher').value || null,
                is_active: document.getElementById('swal-status').value === 'true'
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/create_course', {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire({
                        title: 'Creado',
                        text: data.message,
                        icon: 'success',
                    }).then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al crear el curso', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

// === Create Student Function ===
window.createStudent = function () {
    swalMaterialYou.fire({
        title: 'Nuevo Alumno',
        html: `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Nombres *</label>
                    <input id="swal-student-firstname" class="swal2-input" placeholder="Ej: Maria Sofia" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Apellidos *</label>
                    <input id="swal-student-lastname" class="swal2-input" placeholder="Ej: Garcia Perez" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Correo Electrónico *</label>
                    <input id="swal-student-email" type="email" class="swal2-input" placeholder="correo@ejemplo.com" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Contraseña *</label>
                    <input id="swal-student-password" type="password" class="swal2-input" placeholder="******" style="margin: 0; width: 100%;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Alumno',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const firstName = document.getElementById('swal-student-firstname').value;
            const lastName = document.getElementById('swal-student-lastname').value;
            const email = document.getElementById('swal-student-email').value;
            const password = document.getElementById('swal-student-password').value;

            if (!firstName || !lastName || !email || !password) {
                Swal.showValidationMessage('Todos los campos son requeridos');
                return false;
            }
            return { first_name: firstName, last_name: lastName, email, password, role: 'student' };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/create_user', {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire('Creado', data.message, 'success').then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al crear', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

// === Create Teacher Function ===
window.createTeacher = function () {
    swalMaterialYou.fire({
        title: 'Nuevo Profesor',
        html: `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Nombres *</label>
                    <input id="swal-teacher-firstname" class="swal2-input" placeholder="Ej: Juan Carlos" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Apellidos *</label>
                    <input id="swal-teacher-lastname" class="swal2-input" placeholder="Ej: Lopez Martinez" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Correo Electrónico *</label>
                    <input id="swal-teacher-email" type="email" class="swal2-input" placeholder="profesor@escuela.com" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Contraseña *</label>
                    <input id="swal-teacher-password" type="password" class="swal2-input" placeholder="******" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Tipo de Contrato</label>
                    <select id="swal-teacher-contract" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        <option value="Contratado">Contratado</option>
                        <option value="Nombrado">Nombrado</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Profesor',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const firstName = document.getElementById('swal-teacher-firstname').value;
            const lastName = document.getElementById('swal-teacher-lastname').value;
            const email = document.getElementById('swal-teacher-email').value;
            const password = document.getElementById('swal-teacher-password').value;
            const contract = document.getElementById('swal-teacher-contract').value;

            if (!firstName || !lastName || !email || !password) {
                Swal.showValidationMessage('Todos los campos son requeridos');
                return false;
            }
            return { first_name: firstName, last_name: lastName, email, password, role: 'teacher', contract_status: contract };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/create_user', {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire('Creado', data.message, 'success').then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al crear', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

// === Create Admin Function ===
window.createAdmin = function () {
    swalMaterialYou.fire({
        title: 'Nuevo Administrador',
        html: `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Nombres *</label>
                    <input id="swal-admin-firstname" class="swal2-input" placeholder="Ej: Pedro" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Apellidos *</label>
                    <input id="swal-admin-lastname" class="swal2-input" placeholder="Ej: Sanchez" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Correo Electrónico *</label>
                    <input id="swal-admin-email" type="email" class="swal2-input" placeholder="admin@escuela.com" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Contraseña *</label>
                    <input id="swal-admin-password" type="password" class="swal2-input" placeholder="******" style="margin: 0; width: 100%;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Administrador',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const firstName = document.getElementById('swal-admin-firstname').value;
            const lastName = document.getElementById('swal-admin-lastname').value;
            const email = document.getElementById('swal-admin-email').value;
            const password = document.getElementById('swal-admin-password').value;

            if (!firstName || !lastName || !email || !password) {
                Swal.showValidationMessage('Todos los campos son requeridos');
                return false;
            }
            return { first_name: firstName, last_name: lastName, email, password, role: 'admin' };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/create_user', {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire('Creado', data.message, 'success').then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al crear', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

// === Edit Student Function ===
window.editStudent = async function (el) {
    const id = el.dataset.id;
    const firstName = el.dataset.firstname;
    const lastName = el.dataset.lastname;
    const email = el.dataset.email;
    const gradeId = el.dataset.gradeid;
    const status = el.dataset.status;

    // Fetch grades for dropdown
    let gradeOptions = '<option value="">Sin asignar</option>';
    try {
        const gradesRes = await fetch('/api/grades');
        const grades = await gradesRes.json();
        grades.forEach(g => {
            const selected = g.id == gradeId ? 'selected' : '';
            gradeOptions += `<option value="${g.id}" ${selected}>${g.name}</option>`;
        });
    } catch (error) {
        console.error('Error fetching grades:', error);
    }

    swalMaterialYou.fire({
        title: 'Editar Alumno',
        html: `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Nombres</label>
                    <input id="swal-edit-firstname" class="swal2-input" value="${firstName}" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Apellidos</label>
                    <input id="swal-edit-lastname" class="swal2-input" value="${lastName}" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Email</label>
                    <input id="swal-edit-email" type="email" class="swal2-input" value="${email}" style="margin: 0; width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Grado</label>
                    <select id="swal-edit-grade" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        ${gradeOptions}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 500; display: block; margin-bottom: 8px;">Estado</label>
                    <select id="swal-edit-status" class="swal2-input" style="margin: 0; padding: 14px; width: 100%;">
                        <option value="Activo" ${status === 'Activo' ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${status === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            return {
                first_name: document.getElementById('swal-edit-firstname').value,
                last_name: document.getElementById('swal-edit-lastname').value,
                email: document.getElementById('swal-edit-email').value,
                grade_id: document.getElementById('swal-edit-grade').value || null,
                is_active: document.getElementById('swal-edit-status').value === 'Activo'
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/admin/edit_student/${id}`, {
                    method: 'POST',
                    body: JSON.stringify(result.value),
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    swalMaterialYou.fire('Actualizado', data.message, 'success').then(() => location.reload());
                } else {
                    swalMaterialYou.fire('Error', data.message || 'Error al actualizar', 'error');
                }
            } catch (error) {
                console.error(error);
                swalMaterialYou.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
};

// Event delegation for edit student
document.addEventListener('click', (e) => {
    const editStudentEl = e.target.closest('.js-edit-student');
    if (editStudentEl) {
        editStudent(editStudentEl);
    }
});

// =============================================
// TASK MANAGEMENT SYSTEM
// =============================================

// Get tasks from API
async function getTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

// Render all tasks
async function renderTasks() {
    const tasks = await getTasks();
    window.currentTasks = tasks; // Store for access by ID references

    const container = document.getElementById('tasksContainer');
    const noTasksMsg = document.getElementById('noTasksMessage');

    // Update count display
    const countDisplay = document.getElementById('task-count-display');
    if (countDisplay) {
        countDisplay.textContent = tasks.filter(t => !t.completed).length;
    }

    if (!container) return;

    if (tasks.length === 0) {
        container.innerHTML = '';
        if (noTasksMsg) noTasksMsg.style.display = 'block';
        return;
    }

    if (noTasksMsg) noTasksMsg.style.display = 'none';

    container.innerHTML = tasks.map((task) => `
        <div class="task-item d-flex align-center justify-between mb-2 ${task.completed ? 'completed' : ''}" 
             style="padding: 1rem; border-radius: 12px; background: var(--md-sys-color-surface-variant);">
            <div class="d-flex align-center gap-2" style="flex: 1; cursor: pointer;" onclick="toggleTask(${task.id})">
                <span class="material-symbols-rounded ${task.completed ? 'filled-icon' : ''}" 
                      style="color: ${task.completed ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'}; font-size: 1.5rem;">
                    ${task.completed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div>
                    <strong style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</strong>
                    <div style="font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant);">
                        ${task.dueDate ? formatDate(task.dueDate) : 'Sin fecha'}
                    </div>
                </div>
            </div>
            <div class="d-flex gap-1">
                <button class="btn-text" onclick="editTask(${task.id})" title="Editar">
                    <span class="material-symbols-rounded" style="color: var(--md-sys-color-primary);">edit</span>
                </button>
                <button class="btn-text" onclick="deleteTask(${task.id})" title="Eliminar">
                    <span class="material-symbols-rounded" style="color: var(--md-sys-color-error, #B71C1C);">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    // Fix date parsing for Safari/Others if needed, but standard ISO works mostly
    const date = new Date(dateStr.replace(' ', 'T')); // Ensure ISO format
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-ES', options);
}

// Toggle task completion
window.toggleTask = async function (id) {
    const task = window.currentTasks.find(t => t.id === id);
    if (!task) return;

    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ completed: !task.completed })
        });
        renderTasks();
    } catch (e) {
        swalMaterialYou.fire('Error', 'No se pudo actualizar la tarea', 'error');
    }
};

// Create new task
window.createTask = function () {
    swalMaterialYou.fire({
        title: 'Nueva Tarea',
        width: '850px',
        html: `
            <div style="display: flex; gap: 24px; align-items: start; flex-wrap: wrap; justify-content: center;">
                <div style="flex: 1; min-width: 280px; text-align: left;">
                    <div style="margin-bottom: 24px;">
                        <label style="font-weight: 500; display: block; margin-bottom: 8px;">Título de la tarea *</label>
                        <input id="swal-task-title" class="swal2-input" placeholder="Ej: Revisar calificaciones" style="margin: 0; width: 100%;">
                    </div>
                    <div>
                        <label style="font-weight: 500; display: block; margin-bottom: 8px;">Fecha y Hora</label>
                        <input id="swal-task-date-display" type="text" class="swal2-input" placeholder="Seleccione en el calendario..." readonly style="margin: 0; width: 100%; background: var(--md-sys-color-surface-variant); cursor: default;">
                        <input id="swal-task-date" type="hidden">
                    </div>
                </div>
                <div style="flex: 0 0 auto;">
                    <div id="datepicker-container" style="background: var(--md-sys-color-surface); border-radius: 16px;"></div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        didOpen: () => {
            flatpickr("#datepicker-container", {
                inline: true,
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                locale: "es",
                time_24hr: false,
                disableMobile: true,
                onChange: function (selectedDates, dateStr, instance) {
                    document.getElementById('swal-task-date').value = dateStr;
                    document.getElementById('swal-task-date-display').value = dateStr;
                }
            });
        },
        preConfirm: async () => {
            const title = document.getElementById('swal-task-title').value;
            const date = document.getElementById('swal-task-date').value;
            if (!title) {
                Swal.showValidationMessage('El título es requerido');
                return false;
            }

            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({
                        title: title,
                        dueDate: date || null
                    })
                });
                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || 'Error creating task');
                }
                return data;
            } catch (error) {
                Swal.showValidationMessage(`Request failed: ${error}`);
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            renderTasks();
            swalMaterialYou.fire('Creada', 'Tarea creada correctamente', 'success');
        }
    });
};

// Edit task
window.editTask = function (id) {
    const task = window.currentTasks.find(t => t.id === id);
    if (!task) return;

    swalMaterialYou.fire({
        title: 'Editar Tarea',
        width: '850px',
        html: `
            <div style="display: flex; gap: 24px; align-items: start; flex-wrap: wrap; justify-content: center;">
                <div style="flex: 1; min-width: 280px; text-align: left;">
                    <div style="margin-bottom: 24px;">
                        <label style="font-weight: 500; display: block; margin-bottom: 8px;">Título de la tarea *</label>
                        <input id="swal-task-title" class="swal2-input" value="${task.title}" style="margin: 0; width: 100%;">
                    </div>
                    <div>
                        <label style="font-weight: 500; display: block; margin-bottom: 8px;">Fecha y Hora</label>
                        <input id="swal-task-date-display" type="text" class="swal2-input" value="${task.dueDate || ''}" placeholder="Seleccione en el calendario..." readonly style="margin: 0; width: 100%; background: var(--md-sys-color-surface-variant); cursor: default;">
                        <input id="swal-task-date" type="hidden" value="${task.dueDate || ''}">
                    </div>
                </div>
                <div style="flex: 0 0 auto;">
                    <div id="datepicker-container" style="background: var(--md-sys-color-surface); border-radius: 16px;"></div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        didOpen: () => {
            flatpickr("#datepicker-container", {
                inline: true,
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                locale: "es",
                defaultDate: task.dueDate || null,
                time_24hr: false,
                disableMobile: true,
                onChange: function (selectedDates, dateStr, instance) {
                    document.getElementById('swal-task-date').value = dateStr;
                    document.getElementById('swal-task-date-display').value = dateStr;
                }
            });
        },
        preConfirm: async () => {
            const title = document.getElementById('swal-task-title').value;
            const date = document.getElementById('swal-task-date').value;

            try {
                const response = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({
                        title: title,
                        dueDate: date || null
                    })
                });
                return await response.json();
            } catch (e) {
                Swal.showValidationMessage('Error al actualizar');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            renderTasks();
            swalMaterialYou.fire('Actualizada', 'Tarea actualizada correctamente', 'success');
        }
    });
};

// Delete task
window.deleteTask = function (id) {
    swalMaterialYou.fire({
        title: '¿Eliminar tarea?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#B71C1C'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                renderTasks();
                swalMaterialYou.fire('Eliminada', 'Tarea eliminada correctamente', 'success');
            } catch (e) {
                swalMaterialYou.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    });
};

// Initialize tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only render tasks if we are on a page with tasks logic
    if (document.getElementById('tasksContainer') || document.getElementById('task-count-display')) {
        renderTasks();
    }
});
