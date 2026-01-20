import os
from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from app import app, db
from models import User, TeacherProfile, Course, Grade, Subject, Task
from datetime import datetime

def admin_required(func):
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role not in ['Admin', 'Director']:
            flash('Acceso no autorizado.', 'error')
            return redirect(url_for('login'))
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

def director_required(func):
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'Director':
            flash('Acceso exclusivo de Director.', 'error')
            return redirect(url_for('login'))
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.role == 'Teacher':
            return redirect(url_for('dashboard_teacher'))
        elif current_user.role == 'Student':
             return redirect(url_for('dashboard_student'))
        return redirect(url_for('dashboard_admin'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Email o contraseña incorrectos.', 'error')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    # AJAX/JSON Handling
    if request.method == 'POST':
        # Check if X-Requested-With header is present (AJAX) or accepts JSON
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role', 'Teacher') # Default to Teacher if not specified
        
        if User.query.filter_by(email=email).first():
            msg = 'El email ya está registrado.'
            if is_ajax:
                return jsonify({'success': False, 'message': msg}), 400
            flash(msg, 'error')
        else:
            user = User(email=email, role=role) # Use submitted role
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            
            # Create profile only for teachers
            if role == 'Teacher':
                profile = TeacherProfile(user_id=user.id)
                db.session.add(profile)
                db.session.commit()
            
            print(f"--- SIMULACION: Codigo de verificacion enviado a {email} ---")
            
            if is_ajax:
                return jsonify({'success': True, 'message': 'Usuario registrado correctamente'})
                
            login_user(user)
            flash('Registro exitoso.', 'success')
            return redirect(url_for('index'))
            
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if current_user.role != 'Teacher':
        return redirect(url_for('index'))
        
    profile = TeacherProfile.query.filter_by(user_id=current_user.id).first()
    
    if request.method == 'POST':
        address = request.form.get('address')
        phone = request.form.get('phone')
        
        if 'photo' in request.files:
            file = request.files['photo']
            if file and file.filename != '':
                filename = secure_filename(f"user_{current_user.id}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                profile.photo_url = filename
        
        profile.address = address
        profile.phone = phone
        
        if address and phone:
             profile.is_verified = True
             
        db.session.commit()
        flash('Perfil actualizado.', 'success')
        return redirect(url_for('dashboard_teacher'))
        
    return render_template('profile.html', profile=profile)

@app.route('/dashboard/teacher', methods=['GET', 'POST'])
@login_required
def dashboard_teacher():
    if current_user.role != 'Teacher':
        return redirect(url_for('index'))
    
    grades = Grade.query.all()
    courses = []
    
    # Fetch courses assigned to this teacher
    if current_user.teacher_profile:
        courses = Course.query.filter_by(teacher_profile_id=current_user.teacher_profile.id).all()
        
    return render_template('dashboard_teacher.html', grades=grades, courses=courses)

@app.route('/dashboard/student')
@login_required
def dashboard_student():
    if current_user.role != 'Student':
        return redirect(url_for('index'))
    
    courses = []
    if current_user.grade:
        courses = current_user.grade.courses
        
    return render_template('dashboard_student.html', courses=courses)

@app.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    
    current_user.first_name = first_name
    current_user.last_name = last_name

    # Handle Teacher Profile details
    if current_user.role == 'Teacher':
        phone = request.form.get('phone')
        address = request.form.get('address')
        
        if not current_user.teacher_profile:
            profile = TeacherProfile(user_id=current_user.id)
            db.session.add(profile)
        
        # Ensure we're accession the relationship object
        if current_user.teacher_profile:
             current_user.teacher_profile.phone = phone
             current_user.teacher_profile.address = address

    db.session.commit()
    
    flash('Perfil actualizado correctamente', 'success')
    return redirect(request.referrer or url_for('index'))

@app.route('/dashboard/admin')
@admin_required
def dashboard_admin():
    # Filter out deleted users
    # Fetch all users (paginated concept, but fetching all for this demo as requested)
    users = User.query.filter(User.is_deleted == False).order_by(User.role, User.id.desc()).all()
    
    # Calculate stats
    student_count = User.query.filter_by(role='Student', is_deleted=False, is_active=True).count()
    teacher_count = User.query.filter_by(role='Teacher', is_deleted=False).count()
    course_count = Course.query.count()
    courses = Course.query.all()

    # Chart Data: Students per Grade
    grades = Grade.query.all()
    students_by_grade = {}
    for grade in grades:
        count = User.query.filter_by(grade_id=grade.id, is_active=True, is_deleted=False).count()
        students_by_grade[grade.name] = count

    return render_template('dashboard_admin.html', 
                           users=users, 
                           courses=courses,
                           student_count=student_count, 
                           teacher_count=teacher_count, 
                           course_count=course_count,
                           students_by_grade=students_by_grade
                           )

@app.route('/admin/create_user', methods=['POST'])
@admin_required
def create_user():
    """Create a new user (student, teacher, or admin) via AJAX"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    role = data.get('role', 'student').lower()
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email y contraseña son requeridos'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'El correo ya está registrado'}), 400
    
    # Map role to proper case
    role_map = {'student': 'Student', 'teacher': 'Teacher', 'admin': 'Admin'}
    user_role = role_map.get(role, 'Student')
    
    user = User(email=email, role=user_role, first_name=first_name, last_name=last_name)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # Get the user ID
    
    # If teacher, create TeacherProfile
    if user_role == 'Teacher':
        contract_status = data.get('contract_status', 'Contratado')
        profile = TeacherProfile(user_id=user.id, contract_status=contract_status)
        db.session.add(profile)
    
    db.session.commit()
    return jsonify({'success': True, 'message': f'{user_role} creado correctamente.'})
@app.route('/admin/delete_user/<int:user_id>', methods=['POST'])
@admin_required
def delete_user(user_id):
    user_to_delete = User.query.get_or_404(user_id)
    
    # Prevent self-deletion
    if current_user.id == user_to_delete.id:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'No puedes eliminarte a ti mismo.'}), 400
        flash('No puedes eliminarte a ti mismo.', 'error')
        return redirect(url_for('dashboard_admin'))
    
    # Prevent Admin from deleting Director or other Admins
    if user_to_delete.role == 'Director':
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'No puedes eliminar al Director.'}), 400
        flash('No puedes eliminar al Director.', 'error')
        return redirect(url_for('dashboard_admin'))
    
    if current_user.role == 'Admin' and user_to_delete.role == 'Admin':
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'No tienes permiso para eliminar a otro Administrador.'}), 400
        flash('No tienes permiso para eliminar a otro Administrador.', 'error')
        return redirect(url_for('dashboard_admin'))
    
    # Soft Deletion
    user_to_delete.is_deleted = True
    user_to_delete.is_active = False 
    db.session.commit()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True, 'message': 'Usuario eliminado (Soft Delete).'})

    flash('Usuario eliminado incorrectamente (Soft Delete).', 'success')
    return redirect(url_for('dashboard_admin'))

@app.route('/admin/edit_student/<int:user_id>', methods=['POST'])
@admin_required
def edit_student(user_id):
    """Edit a student's details including grade assignment"""
    user = User.query.get_or_404(user_id)
    
    if user.role != 'Student':
        return jsonify({'success': False, 'message': 'Este usuario no es un estudiante.'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.email = data.get('email', user.email)
    user.is_active = data.get('is_active', user.is_active)
    
    # Update grade
    grade_id = data.get('grade_id')
    if grade_id:
        user.grade_id = int(grade_id)
    else:
        user.grade_id = None
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Alumno actualizado correctamente.'})

@app.route('/admin/edit_user/<int:user_id>', methods=['POST'])
@admin_required
def edit_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Get JSON data from fetch body
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
        
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.email = data.get('email', user.email)
    
    # Update active status
    if 'is_active' in data:
        user.is_active = data.get('is_active')
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Usuario actualizado correctamente.'})

@app.route('/admin/toggle_status/<int:user_id>', methods=['POST'])
@admin_required
def toggle_status(user_id):
    profile = TeacherProfile.query.filter_by(user_id=user_id).first_or_404()
    
    if profile.contract_status == 'Contratado':
        profile.contract_status = 'Nombrado'
    else:
        profile.contract_status = 'Contratado'
        
    db.session.commit()
    flash(f'Estado cambiado a {profile.contract_status}.', 'success')
    return redirect(url_for('dashboard_admin'))

@app.route('/api/teachers', methods=['GET'])
@admin_required
def api_get_teachers():
    """Get all teachers for dropdowns"""
    teachers = TeacherProfile.query.join(User).filter(User.is_deleted == False).all()
    teacher_list = []
    for t in teachers:
        if t.user:
            teacher_list.append({
                'id': t.id,
                'name': f"{t.user.first_name or ''} {t.user.last_name or ''}".strip() or t.user.email
            })
    # Sort alphabetically by name
    teacher_list.sort(key=lambda x: x['name'])
    return jsonify(teacher_list)

@app.route('/api/grades', methods=['GET'])
@admin_required
def api_get_grades():
    """Get all grades for dropdowns"""
    grades = Grade.query.all()
    return jsonify([{'id': g.id, 'name': g.name} for g in grades])

@app.route('/api/subjects', methods=['GET'])
@admin_required
def api_get_subjects():
    """Get all subjects for dropdowns"""
    subjects = Subject.query.all()
    return jsonify([{'id': s.id, 'name': s.name} for s in subjects])

@app.route('/admin/create_course', methods=['POST'])
@admin_required
def create_course():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    subject_id = data.get('subject_id')
    grade_id = data.get('grade_id')
    teacher_id = data.get('teacher_id')
    is_active = data.get('is_active', True)
    
    if not subject_id or not grade_id:
        return jsonify({'success': False, 'message': 'Se requiere materia y grado'}), 400
    
    # Check if course already exists for this grade and subject
    existing = Course.query.filter_by(subject_id=subject_id, grade_id=grade_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Ya existe un curso para esta materia y grado'}), 400
    
    course = Course(
        subject_id=int(subject_id),
        grade_id=int(grade_id),
        teacher_profile_id=int(teacher_id) if teacher_id else None,
        is_active=is_active
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Curso creado correctamente.'})

@app.route('/admin/edit_course/<int:course_id>', methods=['POST'])
@admin_required
def edit_course(course_id):
    course = Course.query.get_or_404(course_id)
    
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    if 'is_active' in data:
        course.is_active = data.get('is_active')
    
    if 'teacher_id' in data:
        teacher_id = data.get('teacher_id')
        if teacher_id:
            course.teacher_profile_id = int(teacher_id)
        else:
            course.teacher_profile_id = None
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Curso actualizado correctamente.'})

@app.route('/admin/delete_course/<int:course_id>', methods=['POST'])
@admin_required
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    
    db.session.delete(course)
    db.session.commit()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True, 'message': 'Curso eliminado.'})
    
    flash('Curso eliminado.', 'success')
    return redirect(url_for('dashboard_admin'))

@app.route('/director/create_admin', methods=['POST'])
@director_required
def create_admin():
    email = request.form.get('email')
    password = request.form.get('password')
    
    if User.query.filter_by(email=email).first():
        flash('El email ya existe.', 'error')
    else:
        user = User(email=email, role='Admin')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Administrador creado.', 'success')
        
    return redirect(url_for('dashboard_admin'))

# ==========================================
# TASK API ROUTES
# ==========================================
@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = current_user.tasks
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'dueDate': t.due_date.strftime('%Y-%m-%d %H:%M') if t.due_date else None,
        'completed': t.completed
    } for t in tasks])

@app.route('/api/tasks', methods=['POST'])
@login_required
def add_task():
    data = request.get_json()
    title = data.get('title')
    due_date_str = data.get('dueDate')
    
    due_date = None
    if due_date_str:
        # Try full format first
        try:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d %H:%M')
        except:
             # Try date only
             try:
                 due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
             except:
                 pass
            
    task = Task(title=title, due_date=due_date, user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    return jsonify({'success': True, 'id': task.id})

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'success': False, 'message': 'Task not found'}), 404
        
    data = request.get_json()
    if 'completed' in data:
        task.completed = data['completed']
    if 'title' in data:
        task.title = data['title']
    # Add date update logic later if needed
    
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'success': False}), 404
        
    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True})