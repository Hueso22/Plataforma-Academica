from app import app
from models import db, User, Grade, Subject, Course, TeacherProfile
import random

def seed_database():
    with app.app_context():
        # Drop all to ensure clean slate with new schema
        db.drop_all()
        db.create_all()

        print("--- Seeding Database ---")

        # Create Director
        director = User(email='director@school.com', role='Director', first_name='Director', last_name='General')
        director.set_password('admin123')
        db.session.add(director)

        # Create Admin
        admin = User(email='admin@school.com', role='Admin', first_name='Administrador', last_name='Principal')
        admin.set_password('admin123')
        db.session.add(admin)

        # Helper for realistic names
        first_names_list = ["Juan", "Carlos", "Maria", "Ana", "Luis", "Sofia", "Pedro", "Lucia", "Jorge", "Elena", "Diego", "Valentina", "Mateo", "Camila", "Andres", "Isabella"]
        last_names_list = ["Garcia", "Perez", "Lopez", "Torres", "Ramirez", "Flores", "Gomez", "Diaz", "Vasquez", "Castro", "Rodrigues", "Sanchez", "Romero", "Alvarez", "Ruiz"]

        def get_random_name():
            return f"{random.choice(first_names_list)} {random.choice(first_names_list)}"
        
        def get_random_surname():
            return f"{random.choice(last_names_list)} {random.choice(last_names_list)}"

        # --- 45 Teachers ---
        print("Creating 45 Teachers...")
        statuses = ['Nombrado', 'Contratado', 'En Espera', 'Inactivo']

        for i in range(1, 46):
            email = f'profesor{i}@school.com'
            fname = get_random_name()
            lname = get_random_surname()
            status = random.choice(statuses)

            user = User(email=email, role='Teacher', first_name=fname, last_name=lname)
            user.set_password('123456')
            user.is_active = (status != 'Inactivo')
            db.session.add(user)
            db.session.flush() # Get ID
            
            profile = TeacherProfile(
                user_id=user.id, 
                contract_status=status
            )
            db.session.add(profile)
        
        # --- Grades & Subjects (CREATE BEFORE STUDENTS) ---
        grades_data = ['1ro Sec', '2do Sec', '3ro Sec', '4to Sec', '5to Sec']
        grades = {}
        for g_name in grades_data:
            grade = Grade(name=g_name)
            db.session.add(grade)
            db.session.flush()  # Get ID immediately
            grades[g_name] = grade
        
        subjects_data = ['Matemática', 'Historia', 'Lenguaje', 'Ciencias', 'Inglés', 'Arte', 'Educación Física', 'Cívica']
        subjects = {}
        for s_name in subjects_data:
            subj = Subject(name=s_name)
            db.session.add(subj)
            subjects[s_name] = subj
        
        db.session.commit()
        
        # Get grade IDs for assignment
        grade_ids = [g.id for g in grades.values()]
        
        # --- 1250 Students ---
        print("Creating 1250 Students...")
        for i in range(1, 1251):
            email = f'estudiante{i}@school.com'
            fname = get_random_name()
            lname = get_random_surname()
            
            user = User(email=email, role='Student', first_name=fname, last_name=lname)
            user.set_password('123456')
            # 5% Inactive
            user.is_active = (random.random() > 0.05)
            # Assign random grade
            user.grade_id = random.choice(grade_ids)
            db.session.add(user)
            if i % 100 == 0:
                print(f"  ... {i} students created")
                db.session.commit() # Commit in chunks
        
        db.session.commit()

        # --- 32 Courses ---
        print("Creating 32 Courses...")
        # Assign random teacher
        teacher_profiles = TeacherProfile.query.all()
        
        # Distribute 32 courses across grades
        count = 0
        for g_name in grades_data:
            grade = grades[g_name]
            # Try to add a mix of subjects
            grade_subjects = random.sample(subjects_data, k=min(len(subjects_data), 7)) 
            for s_name in grade_subjects:
                if count >= 32: break
                sub = subjects[s_name]
                
                random_teacher = random.choice(teacher_profiles) if teacher_profiles else None

                course = Course(
                    grade_id=grade.id, 
                    subject_id=sub.id,
                    teacher_profile_id=random_teacher.id if random_teacher else None
                )
                db.session.add(course)
                count += 1
            if count >= 32: break
        
        db.session.commit()
        print("Database seeded successfully: 45 Teachers, 1250 Students, 32 Courses.")

if __name__ == '__main__':
    seed_database()
