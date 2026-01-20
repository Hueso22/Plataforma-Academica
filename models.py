from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    first_name = db.Column(db.String(50), nullable=True) # Added for all users
    last_name = db.Column(db.String(50), nullable=True)  # Added for all users
    role = db.Column(db.String(20), nullable=False)  # Director, Admin, Teacher, Student
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    grade_id = db.Column(db.Integer, db.ForeignKey('grade.id'), nullable=True)  # For students

    teacher_profile = db.relationship('TeacherProfile', backref='user', uselist=False)
    grade = db.relationship('Grade', backref='students')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.email.split('@')[0]

class TeacherProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Names moved to User model
    photo_url = db.Column(db.String(255))
    address = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    contract_status = db.Column(db.String(20), default='Pending') # Contratado, Nombrado
    is_verified = db.Column(db.Boolean, default=False)

class Grade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False) # 5to Sec
    courses = db.relationship('Course', backref='grade', lazy=True)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # Matemática

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    grade_id = db.Column(db.Integer, db.ForeignKey('grade.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    teacher_profile_id = db.Column(db.Integer, db.ForeignKey('teacher_profile.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    subject = db.relationship('Subject')
    teacher = db.relationship('TeacherProfile', backref='courses')
    
    @property
    def name(self):
        """Generate course name from subject"""
        if self.subject:
            return self.subject.name
        return f"Curso {self.id}"

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    completed = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref=db.backref('tasks', lazy=True))
